import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import ArticleActionsDropdown from '../../../Components/Article/ArticleActionsDropdown'
import ArticleCard from '../../../Components/Article/ArticleCard'
import ArticleCoverImg from '../../../Components/Article/ArticleCoverImg'
import ArticleDraftImg from '../../../Components/Article/ArticleDraftImg'
import CompanyArticleStats from '../../../Components/Article/CompanyArticleStats'
import InvalidArticleDetails from '../../../Components/Article/InvalidArticleDetails'
import NewArticleGuide from '../../../Components/Article/NewArticleGuide'
import message from '../../../Components/Form/message'
import ArticleService from '../../../Services/ArticleService'
import IArticle from '../../../Types/Article/IArticle'
import { renderWithProviders } from '../../testUtils'
import { FIXED_DATE, deferred, httpError, listOf, makeArticle, signedIn } from './fixtures'

vi.mock('../../../Services/ArticleService')
vi.mock('@ant-design/charts', () => ({ Pie: () => null, Line: () => null }))
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))

const service = vi.mocked(ArticleService)
const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>

describe('ArticleDraftImg', () => {
  test('shows the draft stamp and passes props on', () => {
    renderWithProviders(<ArticleDraftImg className="stamp" />)
    const img = screen.getByAltText('draft')
    expect(img).toHaveAttribute('src', '/img/item_draft.png')
    expect(img).toHaveClass('stamp')
  })
})

describe('ArticleCoverImg', () => {
  const withCover = makeArticle({ CoverAsset: { url: 'https://x.test/cover.png' } as IArticle['CoverAsset'] })

  test('shows the cover image and passes wrapper props', () => {
    const { container } = renderWithProviders(
      <ArticleCoverImg article={withCover} imgWrapperProps={{ className: 'cover-img' }} />,
    )
    expect(container.querySelector('.cover-img .cover-img-div')).toHaveStyle({
      backgroundImage: 'url(https://x.test/cover.png)',
    })
  })

  test('reports clicks with the article', () => {
    const onClick = vi.fn()
    const { container } = renderWithProviders(<ArticleCoverImg article={withCover} onClick={onClick} />)
    fireEvent.click(container.querySelector('.cover-img-div') as Element)
    expect(onClick).toHaveBeenCalledWith(withCover)
  })

  test('tolerates clicks when no handler is given', () => {
    const { container } = renderWithProviders(<ArticleCoverImg article={withCover} />)
    expect(() => fireEvent.click(container.querySelector('.cover-img-div') as Element)).not.toThrow()
  })

  test('shows a placeholder for a blank cover url', () => {
    const blank = makeArticle({ CoverAsset: { url: ' ' } as IArticle['CoverAsset'] })
    const { container } = renderWithProviders(<ArticleCoverImg article={blank} />)
    expect(container.querySelector('.default-img-div')).toBeInTheDocument()
  })

  test('shows a placeholder when the article has no cover', () => {
    const { container } = renderWithProviders(<ArticleCoverImg article={makeArticle()} />)
    expect(container.querySelector('.default-img-div')).toBeInTheDocument()
  })
})

describe('ArticleCard', () => {
  const createdBy = { CreatedBy: { nickName: 'Lin' } } as Partial<IArticle>

  test('shows title, author and created date', () => {
    const article = makeArticle({ ...createdBy, createdAt: FIXED_DATE } as Partial<IArticle>)
    renderWithProviders(<ArticleCard article={article} className="card" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getAllByText('Lin').length).toBeGreaterThan(0)
    expect(screen.getByText('Mar 15, 2024')).toBeInTheDocument()
  })

  test('stamps drafts but not published articles', () => {
    const { unmount } = renderWithProviders(<ArticleCard article={makeArticle()} />)
    expect(screen.getByAltText('draft')).toBeInTheDocument()
    unmount()
    renderWithProviders(<ArticleCard article={makeArticle({ isPublished: true })} />)
    expect(screen.queryByAltText('draft')).not.toBeInTheDocument()
  })
})

describe('InvalidArticleDetails', () => {
  const ui = (description?: string) => (
    <>
      <InvalidArticleDetails title="Gone" description={description} />
      <LocationProbe />
    </>
  )

  test('shows the description and goes back to the list', () => {
    renderWithProviders(ui('It was deleted'))
    expect(screen.getByText('Gone')).toBeInTheDocument()
    expect(screen.getByText('It was deleted')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Back to list' }))
    expect(screen.getByTestId('location')).toHaveTextContent('/b/articles')
  })

  test('leaves the description out when there is none', () => {
    const { container } = renderWithProviders(ui())
    expect(container.querySelector('.desc')).not.toBeInTheDocument()
  })
})

describe('CompanyArticleStats', () => {
  test('shows the article count and links to the list', async () => {
    service.getAll.mockResolvedValue(listOf([], { total: 42 }))
    renderWithProviders(<CompanyArticleStats />)

    expect(await screen.findByText('42')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/b/articles')
    expect(screen.getByText(/unlimited/i)).toBeInTheDocument()
    expect(service.getAll).toHaveBeenCalledWith({
      where: JSON.stringify({ isActive: true }),
      perPage: 1,
      currentPage: 1,
    })
  })

  test('spins while loading', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(request.promise as never)
    const { container } = renderWithProviders(<CompanyArticleStats />)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(listOf([]))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('reports a failure and keeps showing zero', async () => {
    service.getAll.mockRejectedValue(httpError('denied'))
    renderWithProviders(<CompanyArticleStats />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('denied'))
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})

describe('ArticleActionsDropdown', () => {
  const openMenu = () => fireEvent.click(screen.getByRole('button', { name: /options/i }))

  test('renders nothing without an article', () => {
    const { container } = renderWithProviders(<ArticleActionsDropdown />)
    expect(container).toBeEmptyDOMElement()
  })

  test('shows custom trigger content', () => {
    renderWithProviders(<ArticleActionsDropdown article={makeArticle()}>Actions</ArticleActionsDropdown>)
    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument()
  })

  test('offers the article actions', async () => {
    renderWithProviders(<ArticleActionsDropdown article={makeArticle()} />, { state: signedIn })
    openMenu()
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('button', { name: /unpublish/i })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /preview/i })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  test('passes a change from a menu action to the parent', async () => {
    const deleted = makeArticle({ isActive: false })
    service.deactivate.mockResolvedValue(deleted)
    const onChanged = vi.fn()
    renderWithProviders(<ArticleActionsDropdown article={makeArticle()} onChanged={onChanged} />, { state: signedIn })
    openMenu()
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('button', { name: /delete/i }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /yes/i }))
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(deleted))
  })

  test('copes with no onChanged callback', async () => {
    service.deactivate.mockResolvedValue(makeArticle())
    renderWithProviders(<ArticleActionsDropdown article={makeArticle()} />, { state: signedIn })
    openMenu()
    fireEvent.click(within(await screen.findByRole('menu')).getByRole('button', { name: /delete/i }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /yes/i }))
    await waitFor(() => expect(message.success).toHaveBeenCalled())
  })
})

describe('NewArticleGuide', () => {
  const renderGuide = (state: object = signedIn) =>
    renderWithProviders(
      <Routes>
        <Route path="/b/articles/:id" element={<><NewArticleGuide /><LocationProbe /></>} />
      </Routes>,
      { route: '/b/articles/new', state },
    )
  const typeTitle = (title: string) => {
    const input = screen.getByPlaceholderText(/mind/i)
    fireEvent.change(input, { target: { value: title } })
    fireEvent.keyUp(input, { target: { value: title } })
  }
  const submit = () => screen.getByRole('button', { name: /continue/i })

  test('keeps Continue disabled until there is a title, ignoring spaces', () => {
    renderGuide()
    expect(submit()).toBeDisabled()
    typeTitle('   ')
    expect(submit()).toBeDisabled()
    typeTitle('My post')
    expect(submit()).toBeEnabled()
  })

  test('creates the article with a trimmed title and opens it', async () => {
    service.create.mockResolvedValue(makeArticle({ id: 'art-9' }))
    renderGuide()
    typeTitle('  My post ')
    fireEvent.click(submit())

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/b/articles/art-9'))
    expect(service.create).toHaveBeenCalledWith({ title: 'My post' })
  })

  test('reports a failed create, stays put and can be retried', async () => {
    service.create.mockRejectedValue(new Error('nope'))
    renderGuide()
    typeTitle('My post')
    fireEvent.click(submit())

    await waitFor(() => expect(message.error).toHaveBeenCalledWith(expect.stringContaining('nope')))
    expect(screen.getByTestId('location')).toHaveTextContent('/b/articles/new')
    await waitFor(() => expect(submit()).not.toHaveClass('ant-btn-loading'))
  })

  test.each([
    ['company', { auth: { user: signedIn.auth.user } }],
    ['user', { auth: { company: signedIn.auth.company } }],
  ])('refuses to create without a %s', (_, state) => {
    renderGuide(state)
    typeTitle('My post')
    fireEvent.click(submit())
    expect(message.error).toHaveBeenCalledTimes(1)
    expect(service.create).not.toHaveBeenCalled()
  })

  test('creates the article when Enter is pressed', () => {
    service.create.mockResolvedValue(makeArticle())
    renderGuide()
    typeTitle('My post')
    fireEvent.keyDown(screen.getByPlaceholderText(/mind/i), { key: 'Enter', keyCode: 13 })
    expect(service.create).toHaveBeenCalled()
  })
})
