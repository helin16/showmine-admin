import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import WebsiteOverviewPage, { getPublicUrl } from '../../../Pages/Website/WebsiteOverviewPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The website overview (specs/001-website-builder, US1, T012).
vi.mock('../../../Services/WebsiteService', () => ({ default: { get: vi.fn(), create: vi.fn(), update: vi.fn() } }))
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
beforeEach(() => {
  process.env.REACT_APP_FRONT_END_URL = 'https://reader.test/'
})

const company = { id: 'co-1', name: 'Acme', websiteBuilderEnabled: true }
const website = (extra = {}) => ({
  id: 'w-1',
  companyId: 'co-1',
  slug: 'acme',
  publishedAt: null,
  hasUnpublishedChanges: true,
  updatedAt: '2026-11-24T01:00:00.000Z',
  ...extra,
})
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })

const renderPage = (auth: object = { company }) => renderWithProviders(<WebsiteOverviewPage />, { state: { auth } })
const nameBox = () => screen.getByLabelText('Address name')
const setName = (value: string) => fireEvent.change(nameBox(), { target: { value } })

describe('WebsiteOverviewPage', () => {
  test('with the builder off, shows the not-allowed panel and asks the API nothing', () => {
    renderPage({ company: { ...company, websiteBuilderEnabled: false } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.get).not.toHaveBeenCalled()
  })

  describe('no website yet', () => {
    beforeEach(() => {
      vi.mocked(WebsiteService.get).mockRejectedValue(httpError(404, { message: 'This company has no website yet.' }))
    })

    test('creates one with a valid name', async () => {
      vi.mocked(WebsiteService.create).mockResolvedValue(website() as never)
      renderPage()
      expect(await screen.findByText('Create your website')).toBeInTheDocument()

      setName('acme')
      fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

      expect(WebsiteService.create).toHaveBeenCalledWith('acme')
      expect(await screen.findByText('https://reader.test/s/acme')).toBeInTheDocument()
      expect(screen.getByText('Not published')).toBeInTheDocument()
      expect(message.success).toHaveBeenCalledWith('Saved.')
    })

    test.each(['ab', 'My Shop', '-acme', 'acme-', 'a'.repeat(41)])('refuses "%s" before asking the API', async (name) => {
      renderPage()
      await screen.findByText('Create your website')

      setName(name)
      fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

      expect(screen.getByRole('alert')).toHaveTextContent('Use 3 to 40 lower-case letters')
      expect(nameBox()).toHaveAttribute('aria-invalid', 'true')
      expect(WebsiteService.create).not.toHaveBeenCalled()
    })

    test('shows the field error from the API next to the name', async () => {
      vi.mocked(WebsiteService.create).mockRejectedValue(
        httpError(400, { message: 'Some fields are not valid.', errors: [{ path: 'slug', message: 'This name is reserved.' }] })
      )
      renderPage()
      await screen.findByText('Create your website')

      setName('admin')
      fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('This name is reserved.')
    })

    test('409 for a taken name says so', async () => {
      vi.mocked(WebsiteService.create).mockRejectedValue(httpError(409, { message: 'That name is taken.' }))
      renderPage()
      await screen.findByText('Create your website')

      setName('taken-name')
      fireEvent.keyDown(nameBox(), { key: 'Enter', keyCode: 13, which: 13 })

      expect(await screen.findByRole('alert')).toHaveTextContent('This name is taken. Try another.')
    })
  })

  describe('an existing website', () => {
    test.each([
      [{}, 'Not published'],
      [{ publishedAt: '2026-11-20T00:00:00.000Z', hasUnpublishedChanges: false }, 'Published'],
      [{ publishedAt: '2026-11-20T00:00:00.000Z', hasUnpublishedChanges: true }, 'with changes not yet published'],
    ])('shows the state %o', async (extra, text) => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website(extra) as never)
      renderPage()
      expect(await screen.findByText(new RegExp(text))).toBeInTheDocument()
    })

    test('links to the public address only once published', async () => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
      const { unmount } = renderPage()
      expect(await screen.findByText('https://reader.test/s/acme')).not.toHaveAttribute('href')
      unmount()

      vi.mocked(WebsiteService.get).mockResolvedValue(website({ publishedAt: '2026-11-20T00:00:00.000Z' }) as never)
      renderPage()
      const link = await screen.findByRole('link', { name: 'https://reader.test/s/acme' })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    test('renames it with the updatedAt it was loaded with', async () => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
      vi.mocked(WebsiteService.update).mockResolvedValue(website({ slug: 'acme-shop' }) as never)
      renderPage()
      await screen.findByDisplayValue('acme')
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

      setName('acme-shop')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(WebsiteService.update).toHaveBeenCalledWith({ slug: 'acme-shop', updatedAt: '2026-11-24T01:00:00.000Z' })
      expect(await screen.findByText('https://reader.test/s/acme-shop')).toBeInTheDocument()
    })

    test('a stale save asks to reload, and reloading shows the saved website', async () => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
      vi.mocked(WebsiteService.update).mockRejectedValue(
        httpError(409, { message: 'The website was changed by someone else. Reload and try again.' })
      )
      renderPage()
      await screen.findByDisplayValue('acme')

      setName('mine')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(await screen.findByText(/Someone else changed the website/)).toBeInTheDocument()
      expect(nameBox()).toBeDisabled()
      vi.mocked(WebsiteService.get).mockResolvedValue(website({ slug: 'theirs' }) as never)
      fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
      expect(await screen.findByDisplayValue('theirs')).toBeInTheDocument()
      expect(screen.queryByText(/Someone else changed the website/)).not.toBeInTheDocument()
    })

    test('any other save error is shown as a message', async () => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
      vi.mocked(WebsiteService.update).mockRejectedValue(httpError(500, { message: 'Server down' }))
      renderPage()
      await screen.findByDisplayValue('acme')

      setName('other')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(message.error).toHaveBeenCalledWith('Server down'))
    })
  })

  test('a failed load says why and can be tried again', async () => {
    vi.mocked(WebsiteService.get).mockRejectedValueOnce(httpError(500, { message: 'Server down' }))
    renderPage()
    expect(await screen.findByText('The website could not be loaded: Server down')).toBeInTheDocument()

    vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await screen.findByDisplayValue('acme')).toBeInTheDocument()
  })

  test('the public address works with or without a trailing slash', () => {
    expect(getPublicUrl('acme')).toBe('https://reader.test/s/acme')
    process.env.REACT_APP_FRONT_END_URL = 'https://reader.test'
    expect(getPublicUrl('acme')).toBe('https://reader.test/s/acme')
  })
})
