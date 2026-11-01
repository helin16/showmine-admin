import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import ArticleListPage, { iSearchParams } from '../../../Pages/Article/ArticleListPage'
import CommentsListPage from '../../../Pages/Comments/CommentsListPage'
import DashBoardPage from '../../../Pages/Dashboard/DashBoardPage'
import MediaListPage from '../../../Pages/Media/MediaListPage'
import { OP_NOT } from '../../../Helpers/ServiceHelper'
import { renderWithProviders } from '../../testUtils'
import { signedIn } from '../../components/Article/fixtures'

vi.mock('../../../Layouts/BackendPage', () => ({
  default: ({
    children,
    ContentHeader,
    selectedMenu,
  }: {
    children: React.ReactNode
    ContentHeader?: React.ReactNode
    selectedMenu: string
  }) => (
    <main data-menu={selectedMenu}>
      <header>{ContentHeader}</header>
      {children}
    </main>
  ),
}))
vi.mock('../../../Components/Article/ArticleList', () => ({
  default: ({ searchParams }: { searchParams: iSearchParams }) => (
    <pre data-testid="article-list">{JSON.stringify(searchParams)}</pre>
  ),
}))
vi.mock('../../../Components/Comments/CommentsList', () => ({ default: () => <div>comments list</div> }))
vi.mock('../../../Components/Media/MediaList', () => ({
  default: ({ keyword }: { keyword: string }) => <div>media list [{keyword}]</div>,
}))
vi.mock('../../../Components/Media/CompanyMediaUsage', () => ({ default: () => <div>media usage</div> }))
vi.mock('../../../Components/Article/CompanyArticleStats', () => ({ default: () => <div>article stats</div> }))
vi.mock('../../../Components/Channel/CompanyChannelStats', () => ({ default: () => <div>channel stats</div> }))
vi.mock('../../../Components/User/CompanyUserStats', () => ({ default: () => <div>user stats</div> }))
vi.mock('../../../Components/Stats/VisitStats', () => ({ default: () => <div>visit stats</div> }))

const noCompany = { auth: { user: signedIn.auth.user } }
const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>
const search = (placeholder: RegExp, text: string) => {
  const box = screen.getByPlaceholderText(placeholder)
  fireEvent.change(box, { target: { value: text } })
  fireEvent.keyDown(box, { key: 'Enter', keyCode: 13, which: 13 })
}

describe('ArticleListPage', () => {
  const params = () => JSON.parse(screen.getByTestId('article-list').textContent as string)
  const render = (state: object = signedIn) =>
    renderWithProviders(
      <>
        <ArticleListPage />
        <LocationProbe />
      </>,
      { state },
    )

  test('shows the list with no filters', () => {
    render()
    expect(screen.getByText('News/Articles')).toBeInTheDocument()
    expect(params()).toEqual({ extraStatus: {}, keyWord: '' })
  })

  test('holds back the list without a company', () => {
    render(noCompany)
    expect(screen.queryByTestId('article-list')).not.toBeInTheDocument()
  })

  test('the new article button opens the editor', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: /new article/i }))
    expect(screen.getByTestId('location')).toHaveTextContent('/b/articles/new')
  })

  test('searching passes the keyword to the list', () => {
    render()
    search(/search/i, 'hello')
    expect(params().keyWord).toBe('hello')
  })

  test('the search keeps the selected status', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Draft' }))
    search(/search/i, 'hello')
    expect(params()).toEqual({ extraStatus: { publishedAt: null }, keyWord: 'hello' })
  })

  test('filters by published and draft status, and back to all', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'Published' }))
    expect(params().extraStatus).toEqual({ publishedAt: { [OP_NOT]: null } })
    fireEvent.click(screen.getByRole('button', { name: 'Draft' }))
    expect(params().extraStatus).toEqual({ publishedAt: null })
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(params().extraStatus).toEqual({})
  })

  test('highlights the selected status', () => {
    render()
    expect(screen.getByRole('button', { name: 'All' })).toHaveClass('ant-btn-primary')
    fireEvent.click(screen.getByRole('button', { name: 'Draft' }))
    expect(screen.getByRole('button', { name: 'Draft' })).toHaveClass('ant-btn-primary')
    expect(screen.getByRole('button', { name: 'All' })).not.toHaveClass('ant-btn-primary')
  })

  test('stays on the list when the active status is clicked again', () => {
    render()
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/)
  })

  test('keeps the keyword when the status changes', () => {
    render()
    search(/search/i, 'hello')
    fireEvent.click(screen.getByRole('button', { name: 'Draft' }))
    expect(params().keyWord).toBe('hello')
  })
})

describe('CommentsListPage', () => {
  test('shows the comments for the company', () => {
    renderWithProviders(<CommentsListPage />, { state: signedIn })
    expect(screen.getByText('comments list')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('data-menu')
    expect(screen.getByText('Comments')).toBeInTheDocument()
  })

  test('holds back the list without a company', () => {
    renderWithProviders(<CommentsListPage />, { state: noCompany })
    expect(screen.queryByText('comments list')).not.toBeInTheDocument()
  })
})

describe('MediaListPage', () => {
  test('renders nothing without a company', () => {
    const { container } = renderWithProviders(<MediaListPage />, { state: noCompany })
    expect(container).toBeEmptyDOMElement()
  })

  test('shows usage and the list', () => {
    renderWithProviders(<MediaListPage />, { state: signedIn })
    expect(screen.getByText('media usage')).toBeInTheDocument()
    expect(screen.getByText('media list []')).toBeInTheDocument()
  })

  test('searching passes the keyword to the list', async () => {
    renderWithProviders(<MediaListPage />, { state: signedIn })
    search(/search/i, 'cat')
    await waitFor(() => expect(screen.getByText('media list [cat]')).toBeInTheDocument())
  })
})

describe('DashBoardPage', () => {
  test('renders nothing without a company', () => {
    const { container } = renderWithProviders(<DashBoardPage />, { state: noCompany })
    expect(container).toBeEmptyDOMElement()
  })

  test('shows every panel and a link to write an article', () => {
    renderWithProviders(<DashBoardPage />, { state: signedIn })
    ;['article stats', 'media usage', 'channel stats', 'user stats', 'visit stats'].forEach((panel) =>
      expect(screen.getByText(panel)).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: /new article/i })).toHaveAttribute('href', '/b/articles/new')
  })
})
