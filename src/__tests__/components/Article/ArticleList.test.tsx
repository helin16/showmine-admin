import React, { useState } from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import ArticleList from '../../../Components/Article/ArticleList'
import message from '../../../Components/Form/message'
import ArticleService from '../../../Services/ArticleService'
import { OP_LIKE } from '../../../Helpers/ServiceHelper'
import IArticle from '../../../Types/Article/IArticle'
import ICompany from '../../../Types/Company/ICompany'
import { iSearchParams } from '../../../Pages/Article/ArticleListPage'
import { renderWithProviders } from '../../testUtils'
import { company, deferred, httpError, listOf, makeArticle } from './fixtures'

vi.mock('../../../Services/ArticleService')
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))

const service = vi.mocked(ArticleService)
const first = makeArticle({ id: 'a1', title: 'First post' })
const second = makeArticle({ id: 'a2', title: 'Second post' })
const lastWhere = () => JSON.parse(service.getAll.mock.lastCall?.[0]?.where as string)
const noParams: iSearchParams = { keyWord: '', extraStatus: {} }

describe('ArticleList', () => {
  test('renders nothing and requests nothing without a company id', () => {
    const { container } = renderWithProviders(<ArticleList company={{ id: '' } as ICompany} />)
    expect(container).toBeEmptyDOMElement()
    expect(service.getAll).not.toHaveBeenCalled()
  })

  test('lists active articles, newest first, linking to each one', async () => {
    service.getAll.mockResolvedValue(listOf([first, second]))
    renderWithProviders(<ArticleList company={company} />)

    expect(await screen.findByRole('link', { name: /First post/ })).toHaveAttribute('href', '/b/articles/a1')
    expect(screen.getByText('Second post')).toBeInTheDocument()
    expect(service.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ perPage: 12, currentPage: 1, sort: 'createdAt:DESC', include: 'CoverAsset,CreatedBy' }),
    )
    expect(lastWhere()).toEqual({ isActive: true })
  })

  test('shows the empty state', async () => {
    service.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<ArticleList company={company} />)
    expect(await screen.findByText('No data', { selector: '.ant-empty-description' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })

  test('spins during the first load', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(request.promise as never)
    const { container } = renderWithProviders(<ArticleList company={company} />)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(listOf([first]))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('applies the keyword, trimmed, and the status filter', async () => {
    service.getAll.mockResolvedValue(listOf([first]))
    const searchParams = { keyWord: ' post ', extraStatus: { publishedAt: null } }
    renderWithProviders(<ArticleList company={company} searchParams={searchParams} />)
    await screen.findByText('First post')
    expect(lastWhere()).toEqual({ isActive: true, publishedAt: null, title: { [OP_LIKE]: '%post%' } })
  })

  test('loads the next page and appends it, then hides the button', async () => {
    service.getAll
      .mockResolvedValueOnce(listOf([first], { currentPage: 1, pages: 2 }))
      .mockResolvedValueOnce(listOf([second], { currentPage: 2, pages: 2 }))
    renderWithProviders(<ArticleList company={company} />)
    fireEvent.click(await screen.findByRole('button', { name: /load more/i }))

    expect(await screen.findByText('Second post')).toBeInTheDocument()
    expect(screen.getByText('First post')).toBeInTheDocument()
    expect(service.getAll.mock.lastCall?.[0]?.currentPage).toBe(2)
    await waitFor(() => expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument())
  })

  test('a new search replaces the results and starts from page one', async () => {
    const Parent = () => {
      const [searchParams, setSearchParams] = useState(noParams)
      return (
        <>
          <button onClick={() => setSearchParams({ ...noParams, keyWord: 'second' })}>search</button>
          <ArticleList company={company} searchParams={searchParams} />
        </>
      )
    }
    service.getAll.mockResolvedValueOnce(listOf([first], { pages: 3 })).mockResolvedValueOnce(listOf([second]))
    renderWithProviders(<Parent />)
    await screen.findByText('First post')
    fireEvent.click(screen.getByRole('button', { name: 'search' }))

    expect(await screen.findByText('Second post')).toBeInTheDocument()
    expect(screen.queryByText('First post')).not.toBeInTheDocument()
    expect(service.getAll.mock.lastCall?.[0]?.currentPage).toBe(1)
  })

  test('reports a failed load and stops spinning', async () => {
    service.getAll.mockRejectedValue(httpError('denied'))
    const { container } = renderWithProviders(<ArticleList company={company} />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('denied'))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
    expect(await screen.findByText('No data', { selector: '.ant-empty-description' })).toBeInTheDocument()
  })

  test('removes an article deleted from its context menu', async () => {
    service.getAll.mockResolvedValue(listOf([first, second]))
    service.deactivate.mockResolvedValue(first)
    renderWithProviders(<ArticleList company={company} />)
    fireEvent.contextMenu(await screen.findByRole('link', { name: /First post/ }))
    const menu = await screen.findByRole('menu')
    fireEvent.click(within(menu).getByRole('button', { name: /delete/i }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /yes/i }))

    await waitFor(() => expect(screen.queryByText('First post')).not.toBeInTheDocument())
    expect(service.deactivate).toHaveBeenCalledWith('a1')
    expect(screen.getByText('Second post')).toBeInTheDocument()
  })

  test('ignores a reply that arrives after unmount', async () => {
    const reply = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(reply.promise as never)
    const { unmount } = renderWithProviders(<ArticleList company={company} />)
    await waitFor(() => expect(service.getAll).toHaveBeenCalled())
    unmount()
    reply.resolve(listOf<IArticle>([first]))
    await reply.promise
    expect(screen.queryByText('First post')).not.toBeInTheDocument()
  })
})
