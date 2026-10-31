import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import message from '../../../Components/Form/message'
import ArticleDetailsPage from '../../../Pages/Article/ArticleDetailsPage'
import ArticleService from '../../../Services/ArticleService'
import IArticle from '../../../Types/Article/IArticle'
import { renderWithProviders } from '../../testUtils'
import { FIXED_DATE, deferred, httpError, makeArticle, rejectedChain, signedIn } from '../../components/Article/fixtures'

vi.mock('../../../Services/ArticleService')
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('../../../Layouts/BackendPage', () => ({
  default: ({ children, ContentHeader }: { children: React.ReactNode; ContentHeader?: React.ReactNode }) => (
    <main>
      <header>{ContentHeader}</header>
      {children}
    </main>
  ),
}))
vi.mock('../../../Components/Package/PackageNoticeBoard', () => ({ default: () => null }))
vi.mock('../../../Components/Article/NewArticleGuide', () => ({ default: () => <div>new article guide</div> }))
vi.mock('../../../Components/Comments/CommentsList', () => ({
  default: ({ itemId }: { itemId: string }) => <div>comments for {itemId}</div>,
}))
type Changed = { onUpdated?: (a: IArticle) => void; onPublished?: (a: IArticle) => void; onChanged?: (a: IArticle) => void }
vi.mock('../../../Components/Article/ArticleEditor', () => ({
  default: ({ article, onUpdated }: { article: IArticle } & Changed) => (
    <button onClick={() => onUpdated?.(article)}>editor for {article.title}</button>
  ),
}))
vi.mock('../../../Components/Article/ArticlePublishBtn', () => ({
  default: ({ article, onPublished }: { article: IArticle } & Changed) => (
    <button onClick={() => onPublished?.(article)}>publish</button>
  ),
}))
vi.mock('../../../Components/Article/ArticleActionsDropdown', () => ({
  default: ({ article, onChanged }: { article: IArticle } & Changed) => (
    <button onClick={() => onChanged?.({ ...article, isActive: false })}>delete via actions</button>
  ),
}))

const service = vi.mocked(ArticleService)
const render = (route = '/b/articles/art-1', state: object = signedIn) =>
  renderWithProviders(
    <Routes>
      <Route path="/b/articles" element={<div>article list</div>} />
      <Route path="/b/articles/:id" element={<ArticleDetailsPage />} />
    </Routes>,
    { route, state },
  )

describe('ArticleDetailsPage', () => {
  test('a new article shows the guide, and fetches nothing', async () => {
    render('/b/articles/new')
    expect(await screen.findByText('new article guide')).toBeInTheDocument()
    expect(service.getItemById).not.toHaveBeenCalled()
    expect(screen.queryByText(/comments for/)).not.toBeInTheDocument()
  })

  test('loads the article with its editor, header and comments', async () => {
    service.getItemById.mockResolvedValue(makeArticle({ title: 'My post' }))
    render()

    expect(await screen.findByRole('button', { name: 'editor for My post' })).toBeInTheDocument()
    expect(service.getItemById).toHaveBeenCalledWith('art-1', { include: 'CoverAsset,Author' })
    expect(screen.getByText(/Editing/i)).toHaveTextContent('My post')
    expect(screen.getByText('comments for art-1')).toBeInTheDocument()
  })

  test('marks drafts but not published articles', async () => {
    service.getItemById.mockResolvedValue(makeArticle())
    const { unmount } = render()
    expect(await screen.findByText('[draft]')).toBeInTheDocument()
    unmount()

    service.getItemById.mockResolvedValue(makeArticle({ isPublished: true }))
    render()
    await screen.findByRole('button', { name: 'publish' })
    expect(screen.queryByText('[draft]')).not.toBeInTheDocument()
  })

  test('shows a loading state with no publish controls until the article arrives', async () => {
    const request = deferred<IArticle>()
    service.getItemById.mockReturnValue(request.promise)
    const { container } = render()
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'publish' })).not.toBeInTheDocument()

    request.resolve(makeArticle())
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('denies an article of another company, hiding its editor and controls', async () => {
    service.getItemById.mockResolvedValue(makeArticle({ companyId: 'co-2' }))
    render()

    expect(await screen.findByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editor for/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'publish' })).not.toBeInTheDocument()
    expect(screen.queryByText(/comments for/)).not.toBeInTheDocument()
  })

  test('denies access when there is no company context', async () => {
    service.getItemById.mockResolvedValue(makeArticle())
    render('/b/articles/art-1', { auth: { user: signedIn.auth.user } })
    expect(await screen.findByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(screen.queryByText(/comments for/)).not.toBeInTheDocument()
  })

  test('says when the article has been deleted', async () => {
    service.getItemById.mockResolvedValue(makeArticle({ isActive: false, updatedAt: FIXED_DATE } as Partial<IArticle>))
    render()
    expect(await screen.findByText('Content has been deleted')).toBeInTheDocument()
    expect(screen.getByText('This content has been deleted @ Mar 15, 2024 9:30 AM')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'publish' })).not.toBeInTheDocument()
  })

  test('reports a failed load', async () => {
    service.getItemById.mockRejectedValue(httpError('denied'))
    const { container } = render()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('denied'))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('ignores a reply and a failure that arrive after unmount', async () => {
    const first = deferred<IArticle>()
    service.getItemById.mockReturnValue(first.promise)
    render().unmount()
    first.resolve(makeArticle())
    await first.promise

    const second = deferred<never>()
    service.getItemById.mockReturnValue(second.promise)
    render().unmount()
    second.reject(httpError('late'))
    await second.promise.catch(() => undefined)
    expect(message.error).not.toHaveBeenCalled()
  })

  test.each([
    ['editor', /editor for/],
    ['publish button', 'publish'],
  ])('reloads after a change from the %s', async (_, name) => {
    service.getItemById.mockResolvedValue(makeArticle())
    render()
    fireEvent.click(await screen.findByRole('button', { name }))
    await waitFor(() => expect(service.getItemById).toHaveBeenCalledTimes(2))
  })

  test('returns to the list when the article is deleted', async () => {
    service.getItemById.mockResolvedValue(makeArticle())
    render()
    fireEvent.click(await screen.findByRole('button', { name: 'delete via actions' }))
    expect(await screen.findByText('article list')).toBeInTheDocument()
  })

  // Bug: a failed load (such as a 404) falls through to the "new article" guide instead of an error page.
  test.fails('does not offer to create an article when loading one fails', async () => {
    service.getItemById.mockRejectedValue(httpError('not found'))
    render()
    await waitFor(() => expect(message.error).toHaveBeenCalled())
    expect(screen.queryByText('new article guide')).not.toBeInTheDocument()
  })

  // Bug: the guide shows while an existing article is still loading, so it flashes on every open.
  test.fails('does not show the guide while an existing article loads', () => {
    service.getItemById.mockReturnValue(deferred<IArticle>().promise)
    render()
    expect(screen.queryByText('new article guide')).not.toBeInTheDocument()
  })

  // Bug: comments for the id in the url are requested before the company check, so a denied article still queries them.
  test.fails('holds back the comments until the article passes the company check', () => {
    service.getItemById.mockReturnValue(deferred<IArticle>().promise)
    render()
    expect(screen.queryByText(/comments for/)).not.toBeInTheDocument()
  })

  // Bug: the handler reads err.response.data.message, so a network error with no response throws inside .catch.
  test.fails('reports a network error that has no server response', () => {
    const { chain, thrown } = rejectedChain(new Error('Network Error'))
    service.getItemById.mockReturnValue(chain)
    render()
    expect(thrown).toEqual([])
  })
})
