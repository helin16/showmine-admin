import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import WebsiteMessagesMenuName from '../../../Components/Website/WebsiteMessagesMenuName'
import WebsiteService from '../../../Services/WebsiteService'
import { renderWithProviders } from '../../testUtils'

// The Website > Messages menu name with its unread count (specs/006-website-message-form).
vi.mock('../../../Services/WebsiteService', () => ({ default: { getMessages: vi.fn() } }))

const company = (extra = {}) => ({ id: 'co-1', name: 'Acme', websiteBuilderEnabled: true, ...extra })
const list = (unread: number) => ({
  data: [],
  pagination: { currentPage: 1, pageSize: 1, total: 0, totalPages: 0 },
  unread,
})

describe('WebsiteMessagesMenuName', () => {
  afterEach(() => vi.mocked(WebsiteService.getMessages).mockReset())

  test('shows the name and the unread count, asking for one message only', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(list(3) as never)
    renderWithProviders(<WebsiteMessagesMenuName />, { state: { auth: { company: company() } } })
    expect(screen.getByText('Messages')).toBeInTheDocument()
    expect(await screen.findByLabelText('3 unread')).toBeInTheDocument()
    expect(WebsiteService.getMessages).toHaveBeenCalledWith(1, 1)
  })

  test('no count with none unread, or when the count fails', async () => {
    vi.mocked(WebsiteService.getMessages).mockResolvedValue(list(0) as never)
    const { unmount } = renderWithProviders(<WebsiteMessagesMenuName />, { state: { auth: { company: company() } } })
    await waitFor(() => expect(WebsiteService.getMessages).toHaveBeenCalled())
    expect(screen.queryByLabelText(/unread/)).toBeNull()
    unmount()
    vi.mocked(WebsiteService.getMessages).mockRejectedValue(new Error('down'))
    renderWithProviders(<WebsiteMessagesMenuName />, { state: { auth: { company: company() } } })
    await waitFor(() => expect(WebsiteService.getMessages).toHaveBeenCalledTimes(2))
    expect(screen.queryByLabelText(/unread/)).toBeNull()
  })

  test('asks nothing when the website builder is off', () => {
    renderWithProviders(<WebsiteMessagesMenuName />, {
      state: { auth: { company: company({ websiteBuilderEnabled: false }) } },
    })
    expect(screen.getByText('Messages')).toBeInTheDocument()
    expect(WebsiteService.getMessages).not.toHaveBeenCalled()
  })
})
