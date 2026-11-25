import React from 'react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import WebsiteOverviewPage, { getPublicUrl } from '../../../Pages/Website/WebsiteOverviewPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { changeCompany } from '../../../Redux/reduxers/auth.slice'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The website overview (specs/001-website-builder, US1, T012). Named since SMN-81: the address is made from the name.
vi.mock('../../../Services/WebsiteService', async (importOriginal) => {
  const actual = (await importOriginal()) as { default: object }
  return { default: { ...actual.default, get: vi.fn(), create: vi.fn(), update: vi.fn() } }
})
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
  name: 'Acme',
  slug: 'acme',
  publishedAt: null,
  hasUnpublishedChanges: true,
  updatedAt: '2026-11-24T01:00:00.000Z',
  ...extra,
})
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })

const renderPage = (auth: object = { company }) => renderWithProviders(<WebsiteOverviewPage />, { state: { auth } })
const nameBox = () => screen.getByLabelText('Website name')
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

    test('offers the company name, and creates it with a name that may have spaces', async () => {
      vi.mocked(WebsiteService.create).mockResolvedValue(website() as never)
      renderPage()
      expect(await screen.findByText('Create your website')).toBeInTheDocument()
      expect(nameBox()).toHaveValue('Acme')
      expect(screen.queryByRole('link', { name: 'Choose a template' })).not.toBeInTheDocument()

      setName('  Acme Bakery ')
      fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

      expect(WebsiteService.create).toHaveBeenCalledWith('Acme Bakery')
      expect(await screen.findByText('https://reader.test/s/acme')).toBeInTheDocument()
      expect(screen.getByText('Not published')).toBeInTheDocument()
      expect(message.success).toHaveBeenCalledWith('Saved.')
    })

    test.each(['', '   ', 'a'.repeat(81)])('refuses "%s" before asking the API', async (name) => {
      renderPage()
      await screen.findByText('Create your website')

      setName(name)
      fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

      expect(screen.getByRole('alert')).toHaveTextContent('Enter a name of 1 to 80 characters.')
      expect(nameBox()).toHaveAttribute('aria-invalid', 'true')
      expect(WebsiteService.create).not.toHaveBeenCalled()
    })

    test('shows the field error from the API next to the name', async () => {
      vi.mocked(WebsiteService.create).mockRejectedValue(
        httpError(400, {
          message: 'Some fields are not valid.',
          errors: [{ path: 'name', message: 'The website name, 1 to 80 characters.' }],
        }),
      )
      renderPage()
      await screen.findByText('Create your website')

      setName('Shop')
      fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('The website name, 1 to 80 characters.')
    })

    test('the name rule is always shown, and the field points to it', async () => {
      renderPage()
      await screen.findByText('Create your website')
      expect(screen.getByText(/Any name, spaces allowed/)).toBeInTheDocument()
      expect(nameBox()).toHaveAttribute('aria-describedby', 'website-name-help')
    })

    test('another admin creating the website at the same time asks to reload', async () => {
      vi.mocked(WebsiteService.create).mockRejectedValue(
        httpError(409, { message: 'This company already has a website.' }),
      )
      renderPage()
      await screen.findByText('Create your website')

      setName('Acme')
      fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

      expect(await screen.findByText(/Someone else changed the website/)).toBeInTheDocument()
      expect(screen.queryByText('This name gives an address that is taken. Try another.')).not.toBeInTheDocument()
    })

    test('the race message that also mentions "taken" is not shown as a taken name', async () => {
      vi.mocked(WebsiteService.create).mockRejectedValue(
        httpError(409, { message: 'That name is taken, or the company already has a website.' }),
      )
      renderPage()
      await screen.findByText('Create your website')

      setName('Acme')
      fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

      expect(await screen.findByText(/Someone else changed the website/)).toBeInTheDocument()
    })

    test('409 for a taken name says so', async () => {
      vi.mocked(WebsiteService.create).mockRejectedValue(httpError(409, { message: 'That name is taken.' }))
      renderPage()
      await screen.findByText('Create your website')

      setName('Taken Name')
      fireEvent.keyDown(nameBox(), { key: 'Enter', keyCode: 13, which: 13 })

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'This name gives an address that is taken. Try another.',
      )
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

    test('links to the template gallery', async () => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
      renderPage()
      expect(await screen.findByRole('link', { name: 'Choose a template' })).toHaveAttribute(
        'href',
        '/b/company/website/templates',
      )
      expect(screen.getByRole('link', { name: 'Edit pages' })).toHaveAttribute('href', '/b/company/website/pages')
      expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    })

    test('renames it with the updatedAt it was loaded with', async () => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
      vi.mocked(WebsiteService.update).mockResolvedValue(website({ name: 'Acme Shop', slug: 'acme-shop' }) as never)
      renderPage()
      await screen.findByDisplayValue('Acme')
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

      setName(' Acme Shop  ')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(WebsiteService.update).toHaveBeenCalledWith({ name: 'Acme Shop', updatedAt: '2026-11-24T01:00:00.000Z' })
      expect(await screen.findByText('https://reader.test/s/acme-shop')).toBeInTheDocument()
    })

    test('a stale save asks to reload, and reloading shows the saved website', async () => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
      vi.mocked(WebsiteService.update).mockRejectedValue(
        httpError(409, { message: 'The website was changed by someone else. Reload and try again.' }),
      )
      renderPage()
      await screen.findByDisplayValue('Acme')

      setName('Mine')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(await screen.findByText(/Someone else changed the website/)).toBeInTheDocument()
      expect(nameBox()).toBeDisabled()
      vi.mocked(WebsiteService.get).mockResolvedValue(website({ name: 'Theirs' }) as never)
      fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
      expect(await screen.findByDisplayValue('Theirs')).toBeInTheDocument()
      expect(screen.queryByText(/Someone else changed the website/)).not.toBeInTheDocument()
    })

    test('any other save error is shown as a message', async () => {
      vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
      vi.mocked(WebsiteService.update).mockRejectedValue(httpError(500, { message: 'Server down' }))
      renderPage()
      await screen.findByDisplayValue('Acme')

      setName('Other')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(message.error).toHaveBeenCalledWith('Server down'))
    })
  })

  test('a save that ends after a switch of company changes nothing on the new one', async () => {
    let finish!: (website: object) => void
    vi.mocked(WebsiteService.get).mockRejectedValue(httpError(404, { message: 'none' }))
    vi.mocked(WebsiteService.create).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never)
    const { store } = renderPage()
    await screen.findByText('Create your website')
    setName('Acme')
    fireEvent.click(screen.getByRole('button', { name: 'Create website' }))

    await act(async () => {
      store.dispatch(changeCompany({ company: { id: 'co-2', name: 'Other', websiteBuilderEnabled: true } }))
    })
    await act(async () => finish(website()))

    expect(screen.queryByText('https://reader.test/s/acme')).not.toBeInTheDocument()
    expect(message.success).not.toHaveBeenCalled()
    // The new company is offered its own name.
    expect(nameBox()).toHaveValue('Other')
  })

  test('without the Reader address configured, no public address is shown', async () => {
    delete process.env.REACT_APP_FRONT_END_URL
    vi.mocked(WebsiteService.get).mockResolvedValue(website({ publishedAt: '2026-11-20T00:00:00.000Z' }) as never)
    renderPage()
    expect(await screen.findByText('Not available: the Reader address is not configured.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /reader/ })).not.toBeInTheDocument()
  })

  test('shows the ShowMine address, not open yet, and the Reader address', async () => {
    vi.mocked(WebsiteService.get).mockResolvedValue(
      website({ addresses: { subdomain: 'https://acme-ab12cd.showmine.com.au', reader: null } }) as never,
    )
    renderPage()
    expect(await screen.findByText(/https:\/\/acme-ab12cd\.showmine\.com\.au/)).toHaveTextContent('not open yet')
    expect(screen.getByText('ShowMine address')).toBeInTheDocument()
    expect(screen.getByText('Reader address')).toBeInTheDocument()
  })

  test('uses the Reader address the API gives over this app setting', async () => {
    vi.mocked(WebsiteService.get).mockResolvedValue(
      website({ addresses: { subdomain: null, reader: 'https://r.showmine66.com/s/acme' } }) as never,
    )
    renderPage()
    expect(await screen.findByText('https://r.showmine66.com/s/acme')).toBeInTheDocument()
    expect(screen.queryByText('https://reader.test/s/acme')).not.toBeInTheDocument()
  })

  test('without a ShowMine address configured, that line is left out', async () => {
    vi.mocked(WebsiteService.get).mockResolvedValue(website({ addresses: { subdomain: null, reader: null } }) as never)
    renderPage()
    await screen.findByText('Reader address')
    expect(screen.queryByText('ShowMine address')).not.toBeInTheDocument()
  })

  test('a failed load says why and can be tried again', async () => {
    vi.mocked(WebsiteService.get).mockRejectedValueOnce(httpError(500, { message: 'Server down' }))
    renderPage()
    expect(await screen.findByText('The website could not be loaded: Server down')).toBeInTheDocument()

    vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await screen.findByDisplayValue('Acme')).toBeInTheDocument()
  })

  test('the public address works with or without a trailing slash', () => {
    expect(getPublicUrl('acme')).toBe('https://reader.test/s/acme')
    process.env.REACT_APP_FRONT_END_URL = 'https://reader.test'
    expect(getPublicUrl('acme')).toBe('https://reader.test/s/acme')
  })
})
