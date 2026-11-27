import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import WebsiteMessagesPage from '../../../Pages/Website/WebsiteMessagesPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// Website > Messages (specs/006-website-message-form).
vi.mock('../../../Services/WebsiteService', () => ({
  default: { getMessages: vi.fn(), markMessageRead: vi.fn(), deleteMessage: vi.fn() },
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
const item = (id: string, extra = {}) => ({
  id,
  pageSlug: 'contact-us',
  firstName: 'Ann',
  lastName: `Lee ${id}`,
  email: `${id}@example.com`,
  message: `Hello from ${id}\nCall me`,
  isRead: false,
  createdAt: '2026-11-27T01:00:00.000Z',
  ...extra,
})
const page = (data: object[], { currentPage = 1, totalPages = 1, unread = 1 } = {}) => ({
  data,
  pagination: { currentPage, pageSize: 20, total: data.length, totalPages },
  unread,
})
const renderPage = (auth: object = { company }) => renderWithProviders(<WebsiteMessagesPage />, { state: { auth } })
const row = (name: string) => screen.getByText(name).closest('li') as HTMLElement

describe('WebsiteMessagesPage', () => {
  afterEach(() => vi.clearAllMocks())

  test('lists the messages with name, email link, page and unread mark, and the unread count', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(page([item('a'), item('b', { isRead: true })]) as never)
    renderPage()

    expect(await screen.findByText('Ann Lee a')).toBeInTheDocument()
    expect(WebsiteService.getMessages).toHaveBeenCalledWith(1, 20)
    expect(within(row('Ann Lee a')).getByRole('link', { name: 'a@example.com' })).toHaveAttribute(
      'href',
      'mailto:a@example.com',
    )
    expect(within(row('Ann Lee a')).getByText(/\/contact-us/)).toBeInTheDocument()
    expect(within(row('Ann Lee a')).getByText('Unread')).toBeInTheDocument()
    expect(within(row('Ann Lee b')).queryByText('Unread')).toBeNull()
    expect(screen.getByText('1 unread')).toBeInTheDocument()
    // The text shows once opened.
    expect(screen.queryByText(/Hello from a/)).toBeNull()
  })

  test('opening an unread message shows it, marks it read and lowers the count', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(page([item('a')]) as never)
    vi.mocked(WebsiteService.markMessageRead).mockResolvedValue({} as never)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Open the message from Ann Lee a' }))

    expect(screen.getByText(/Hello from a/)).toHaveTextContent('Hello from a Call me')
    expect(WebsiteService.markMessageRead).toHaveBeenCalledWith('a')
    await waitFor(() => expect(within(row('Ann Lee a')).queryByText('Unread')).toBeNull())
    expect(screen.queryByText('1 unread')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Open the message from Ann Lee a' })).toBeNull()
  })

  test('an address is encoded in its link, so it cannot add recipients or text', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(
      page([item('a', { email: 'a@b.co?cc=boss@x.co' })]) as never,
    )
    renderPage()
    await screen.findByText('Ann Lee a')
    expect(screen.getByRole('link', { name: 'a@b.co?cc=boss@x.co' })).toHaveAttribute(
      'href',
      'mailto:a@b.co%3Fcc%3Dboss@x.co',
    )
  })

  test('tells the menu badge the unread count as it changes', async () => {
    const counts: number[] = []
    const listen = (event: Event) => counts.push((event as CustomEvent).detail)
    window.addEventListener('website-messages-unread', listen)
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(page([item('a')], { unread: 1 }) as never)
    vi.mocked(WebsiteService.markMessageRead).mockResolvedValue({} as never)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Open the message from Ann Lee a' }))
    await waitFor(() => expect(counts.at(-1)).toBe(0))
    expect(counts).toContain(1)
    window.removeEventListener('website-messages-unread', listen)
  })

  test('opening a read message does not mark it again', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(page([item('a', { isRead: true })], { unread: 0 }) as never)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Open the message from Ann Lee a' }))
    expect(screen.getByText(/Hello from a/)).toBeInTheDocument()
    expect(WebsiteService.markMessageRead).not.toHaveBeenCalled()
  })

  test('deletes after confirming, and lowers the count for an unread one', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(page([item('a'), item('b')], { unread: 2 }) as never)
    vi.mocked(WebsiteService.deleteMessage).mockResolvedValue({} as never)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete the message from Ann Lee a' }))
    expect(WebsiteService.deleteMessage).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('It cannot be brought back.')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByText('Ann Lee a')).toBeNull())
    expect(WebsiteService.deleteMessage).toHaveBeenCalledWith('a')
    expect(screen.getByText('Ann Lee b')).toBeInTheDocument()
    expect(screen.getByText('1 unread')).toBeInTheDocument()
    expect(message.success).toHaveBeenCalledWith('Message deleted.')
  })

  test('cancelling the delete keeps the message', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(page([item('a')]) as never)
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete the message from Ann Lee a' }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Cancel/ }))
    expect(WebsiteService.deleteMessage).not.toHaveBeenCalled()
    expect(screen.getByText('Ann Lee a')).toBeInTheDocument()
  })

  test('loads more pages, adding them below', async () => {
    vi.mocked(WebsiteService.getMessages)
      .mockResolvedValueOnce(page([item('a')], { totalPages: 2 }) as never)
      .mockResolvedValueOnce(page([item('b')], { currentPage: 2, totalPages: 2 }) as never)
    renderPage()
    await screen.findByText('Ann Lee a')
    fireEvent.click(screen.getByText(/load more/i).closest('button') as HTMLElement)

    expect(await screen.findByText('Ann Lee b')).toBeInTheDocument()
    expect(WebsiteService.getMessages).toHaveBeenLastCalledWith(2, 20)
    expect(screen.getByText('Ann Lee a')).toBeInTheDocument()
    expect(screen.queryByText(/load more/i)).toBeNull()
  })

  test('says when there are none, and when loading fails', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValueOnce(page([], { unread: 0 }) as never)
    const { unmount } = renderPage()
    expect(await screen.findByText('No messages yet.')).toBeInTheDocument()
    unmount()
    vi.mocked(WebsiteService.getMessages).mockRejectedValueOnce(new Error('down'))
    renderPage()
    await waitFor(() => expect(message.error).toHaveBeenCalled())
  })

  test('with the website builder off, shows the not-allowed panel and asks nothing', () => {
    renderPage({ company: { ...company, websiteBuilderEnabled: false } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.getMessages).not.toHaveBeenCalled()
  })
})
