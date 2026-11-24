import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import WebsiteMediaPage, { describeUses } from '../../../Pages/Website/WebsiteMediaPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The website images page (specs/001-website-builder, US5, T058, T062).
vi.mock('../../../Services/WebsiteService', () => ({
  default: {
    getImages: vi.fn(),
    getImageUsage: vi.fn(),
    deleteImage: vi.fn(),
    getImageUploadUrl: () => 'https://api.test/website/images',
  },
}))
vi.mock('../../../Services/AppService', () => ({
  default: { getHeaders: () => ({ headers: {} }), getUploadFailure: vi.fn() },
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
const image = (id: string) => ({
  id,
  url: `https://cdn.test/${id}.png`,
  fileName: `${id}.png`,
  fileSize: 2048,
  type: 'WEBSITE',
})
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })
const renderPage = (auth: object = { company }) => renderWithProviders(<WebsiteMediaPage />, { state: { auth } })
const tileOf = async (name: string) =>
  (await screen.findByRole('img', { name })).closest('.website-image') as HTMLElement

describe('WebsiteMediaPage', () => {
  beforeEach(() => {
    vi.mocked(WebsiteService.getImages).mockResolvedValue({
      data: [image('used'), image('free')],
      currentPage: 1,
      pages: 1,
    } as never)
    vi.mocked(WebsiteService.getImageUsage).mockResolvedValue({
      used: [{ pageId: 'p-1', pageTitle: 'About us', published: false }, { published: true }],
      free: [],
    })
  })

  test('with the builder off, shows the not-allowed panel and loads nothing', () => {
    renderPage({ company: { ...company, websiteBuilderEnabled: false } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.getImages).not.toHaveBeenCalled()
  })

  test('shows where each image is used; only an unused one can be deleted', async () => {
    renderPage()
    const used = await tileOf('used.png')
    expect(await within(used).findByText('Used in: About us, the published website')).toBeInTheDocument()
    expect(within(used).queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
    const free = await tileOf('free.png')
    expect(await within(free).findByText('Not used')).toBeInTheDocument()
    expect(WebsiteService.getImageUsage).toHaveBeenCalledWith(['used', 'free'])
  })

  test('deletes an unused image after confirming', async () => {
    vi.mocked(WebsiteService.deleteImage).mockResolvedValue({} as never)
    renderPage()
    const free = await tileOf('free.png')

    fireEvent.click(await within(free).findByRole('button', { name: 'Delete free.png' }))
    expect(WebsiteService.deleteImage).not.toHaveBeenCalled()
    fireEvent.click(within(await screen.findByRole('tooltip')).getByRole('button', { name: 'Delete' }))

    expect(WebsiteService.deleteImage).toHaveBeenCalledWith('free')
    await waitFor(() => expect(screen.queryByRole('img', { name: 'free.png' })).not.toBeInTheDocument())
    expect(message.success).toHaveBeenCalledWith('free.png deleted.')
  })

  test('an image that came into use meanwhile is refused with where it is used', async () => {
    vi.mocked(WebsiteService.deleteImage).mockRejectedValue(
      httpError(409, { message: 'In use', usedBy: [{ pageId: 'p-2', pageTitle: 'Home', published: false }] }),
    )
    renderPage()
    const free = await tileOf('free.png')

    fireEvent.click(await within(free).findByRole('button', { name: 'Delete free.png' }))
    fireEvent.click(within(await screen.findByRole('tooltip')).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(message.error).toHaveBeenCalledWith('This image is in use (Home), so it was not deleted.'),
    )
    expect(await within(free).findByText('Used in: Home')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'free.png' })).toBeInTheDocument()
  })

  test('describeUses names pages, the site settings and the published site', () => {
    expect(describeUses([{ pageTitle: 'Home', published: false }, { published: false }, { published: true }])).toBe(
      'Home, website settings, the published website',
    )
  })
})
