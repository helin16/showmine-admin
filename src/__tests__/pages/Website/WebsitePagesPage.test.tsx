import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import WebsitePagesPage from '../../../Pages/Website/WebsitePagesPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { COMPANY_WEBSITE_PAGE_URL, COMPANY_WEBSITE_PAGES_URL } from '../../../UrlMap'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The pages list (specs/001-website-builder, US2, T026).
vi.mock('../../../Services/WebsiteService', () => ({
  default: { getPages: vi.fn(), createPage: vi.fn(), deletePage: vi.fn(), orderPages: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../../../Layouts/BackendPage', () => ({
  default: ({ children, ContentHeader }: { children: React.ReactNode; ContentHeader?: React.ReactNode }) => (
    <main>
      <header>{ContentHeader}</header>
      {children}
    </main>
  ),
}))

beforeAll(() => stubMatchMedia())

const company = { id: 'co-1', name: 'Acme', websiteBuilderEnabled: true }
const page = (id: string, slug: string, title: string, extra = {}) => ({
  id,
  slug,
  title,
  position: 0,
  hasUnpublishedChanges: false,
  ...extra,
})
const pages = [
  page('p-1', 'home', 'Home page'),
  page('p-2', 'about', 'About us', { hasUnpublishedChanges: true }),
  page('p-3', 'contact', 'Contact'),
]
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })

const renderPage = (auth: object = { company }) =>
  renderWithProviders(
    <Routes>
      <Route path={COMPANY_WEBSITE_PAGES_URL} element={<WebsitePagesPage />} />
      <Route path={COMPANY_WEBSITE_PAGE_URL} element={<div>editor page</div>} />
    </Routes>,
    { state: { auth }, route: COMPANY_WEBSITE_PAGES_URL },
  )
const rowOf = async (title: string) => (await screen.findByRole('link', { name: title })).closest('tr') as HTMLElement

describe('WebsitePagesPage', () => {
  test('with the builder off, shows the not-allowed panel and loads nothing', () => {
    renderPage({ company: { ...company, websiteBuilderEnabled: false } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.getPages).not.toHaveBeenCalled()
  })

  test('lists the pages in order, the first as Home, with their addresses and changes', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never)
    renderPage()

    const home = await rowOf('Home page')
    expect(within(home).getByText('Home')).toBeInTheDocument()
    expect(within(home).getByText('/home')).toBeInTheDocument()
    expect(within(await rowOf('About us')).getByText('Unpublished changes')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home page' })).toHaveAttribute('href', '/b/company/website/pages/p-1')
    expect(screen.getByRole('button', { name: 'Move Home page up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Contact down' })).toBeDisabled()
  })

  test('moves a page down and shows the saved order', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never)
    vi.mocked(WebsiteService.orderPages).mockResolvedValue([pages[1], pages[0], pages[2]] as never)
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Move Home page down' }))

    expect(WebsiteService.orderPages).toHaveBeenCalledWith(['p-2', 'p-1', 'p-3'])
    await waitFor(() => expect(within(screen.getAllByRole('row')[1]).getByText('About us')).toBeInTheDocument())
  })

  test('a refused reorder says why and reloads the pages', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never)
    vi.mocked(WebsiteService.orderPages).mockRejectedValue(
      httpError(400, { message: 'Send the ids of all the pages.' }),
    )
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Move Contact up' }))

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Send the ids of all the pages.'))
    await waitFor(() => expect(WebsiteService.getPages).toHaveBeenCalledTimes(2))
  })

  test('deletes a page only after confirming', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never)
    vi.mocked(WebsiteService.deletePage).mockResolvedValue({} as never)
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Delete About us' }))
    expect(WebsiteService.deletePage).not.toHaveBeenCalled()
    const confirm = await screen.findByRole('tooltip')
    expect(within(confirm).getByText(/Delete the page About us\?/)).toBeInTheDocument()
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }))

    expect(WebsiteService.deletePage).toHaveBeenCalledWith('p-2')
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Page About us deleted.'))
  })

  describe('adding a page', () => {
    const openForm = async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Add page' }))
      return screen.findByRole('dialog')
    }
    const fill = (dialog: HTMLElement, title: string, slug: string) => {
      fireEvent.change(within(dialog).getByLabelText('Title'), { target: { value: title } })
      fireEvent.change(within(dialog).getByLabelText('Address name'), { target: { value: slug } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Add page' }))
    }

    beforeEach(() => vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never))

    test('adds it and opens its editor', async () => {
      vi.mocked(WebsiteService.createPage).mockResolvedValue(page('p-9', 'news', 'News') as never)
      renderPage()

      fill(await openForm(), ' News ', 'news')

      expect(WebsiteService.createPage).toHaveBeenCalledWith({ title: 'News', slug: 'news' })
      expect(await screen.findByText('editor page')).toBeInTheDocument()
    })

    test('checks the title and name before asking the API', async () => {
      renderPage()
      const dialog = await openForm()

      fill(dialog, ' ', 'Bad Name')

      expect(within(dialog).getByText('A title is required.')).toBeInTheDocument()
      expect(within(dialog).getByText('Use 1 to 40 lower-case letters, digits or hyphens.')).toBeInTheDocument()
      expect(WebsiteService.createPage).not.toHaveBeenCalled()
    })

    test.each([
      [
        httpError(409, { message: 'Another page of this website has that address.' }),
        'Another page has this address name.',
      ],
      [httpError(403, { message: 'Your plan allows 5 pages.' }), 'Your plan allows 5 pages.'],
      [
        httpError(400, { message: 'Bad', errors: [{ path: 'title', message: 'Text of at most 80 characters.' }] }),
        'Text of at most 80 characters.',
      ],
    ])('shows a refusal on the form: %s', async (error, text) => {
      vi.mocked(WebsiteService.createPage).mockRejectedValue(error)
      renderPage()
      const dialog = await openForm()

      fill(dialog, 'News', 'news')

      expect(await within(dialog).findByText(text)).toBeInTheDocument()
      expect(screen.queryByText('editor page')).not.toBeInTheDocument()
    })
  })

  test('without a website, links to the overview', async () => {
    vi.mocked(WebsiteService.getPages).mockRejectedValue(
      httpError(404, { message: 'This company has no website yet.' }),
    )
    renderPage()
    expect(await screen.findByRole('link', { name: 'Create the website' })).toHaveAttribute(
      'href',
      '/b/company/website',
    )
  })

  test('no pages yet says so', async () => {
    vi.mocked(WebsiteService.getPages).mockResolvedValue([] as never)
    renderPage()
    expect(await screen.findByText('No pages yet. Add one, or choose a template.')).toBeInTheDocument()
  })

  test('a failed load can be tried again', async () => {
    vi.mocked(WebsiteService.getPages).mockRejectedValueOnce(httpError(500, { message: 'Server down' }))
    renderPage()
    expect(await screen.findByText('The pages could not be loaded: Server down')).toBeInTheDocument()

    vi.mocked(WebsiteService.getPages).mockResolvedValue(pages as never)
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await rowOf('Home page')).toBeInTheDocument()
  })
})
