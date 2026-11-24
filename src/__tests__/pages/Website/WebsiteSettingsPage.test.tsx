import React from 'react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import WebsiteSettingsPage from '../../../Pages/Website/WebsiteSettingsPage'
import WebsiteService from '../../../Services/WebsiteService'
import message from '../../../Components/Form/message'
import { changeCompany } from '../../../Redux/reduxers/auth.slice'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The website settings page (specs/001-website-builder, US6, T064).
vi.mock('../../../Services/WebsiteService', () => ({
  default: { get: vi.fn(), update: vi.fn(), getImages: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../../../Components/Website/MediaPicker', () => ({
  default: (props: { open: boolean; onPick: (images: object[]) => void }) =>
    props.open ? (
      <button onClick={() => props.onPick([{ id: 'img-2', url: 'https://cdn.test/2.png', fileName: 'two.png' }])}>
        pick (one)
      </button>
    ) : null,
}))
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
const website = (extra = {}) => ({
  id: 'w-1',
  companyId: 'co-1',
  slug: 'acme',
  seo: { title: 'Acme', description: 'Bread' },
  subdomain: null,
  subdomainStatus: 'none',
  customDomain: null,
  customDomainStatus: 'none',
  hasUnpublishedChanges: false,
  updatedAt: 'w-time',
  ...extra,
})
const httpError = (status: number, data: object) =>
  Object.assign(new Error(`status ${status}`), { response: { status, data } })

const renderPage = (auth: object = { company, user: { id: 'u-1' } }) =>
  renderWithProviders(<WebsiteSettingsPage />, { state: { auth } })
const loaded = async (extra = {}, auth?: object) => {
  vi.mocked(WebsiteService.get).mockResolvedValue(website(extra) as never)
  const result = renderPage(auth)
  await screen.findByDisplayValue('Acme')
  return result
}
const saveBtn = () => screen.getByText('Save').closest('button') as HTMLButtonElement
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('WebsiteSettingsPage', () => {
  test('with the builder off, shows the not-allowed panel and asks the API nothing', () => {
    renderPage({ company: { ...company, websiteBuilderEnabled: false } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.get).not.toHaveBeenCalled()
  })

  test('shows the saved settings, the address states and that the addresses are not served yet', async () => {
    await loaded({
      subdomain: 'acme-shop',
      subdomainStatus: 'pending',
      customDomain: 'acme.com',
      customDomainStatus: 'failed',
    })
    expect(screen.getByLabelText('Search description')).toHaveValue('Bread')
    expect(screen.getByLabelText('ShowMine subdomain')).toHaveValue('acme-shop')
    expect(screen.getByLabelText('Your own domain')).toHaveValue('acme.com')
    expect(screen.getByText('State: pending')).toBeInTheDocument()
    expect(screen.getByText('State: failed')).toBeInTheDocument()
    expect(screen.getByText(/do not open the site yet/)).toBeInTheDocument()
    // Only staff can change the domain state.
    expect(screen.queryByLabelText('Domain state (ShowMine staff)')).not.toBeInTheDocument()
    expect(saveBtn()).toBeDisabled()
  })

  test('the text limits are shown and kept', async () => {
    await loaded()
    expect(screen.getByLabelText('Search title')).toHaveAttribute('maxLength', '70')
    expect(screen.getByLabelText('Search description')).toHaveAttribute('maxLength', '160')
    expect(screen.getByText('4 / 70')).toBeInTheDocument()
  })

  test('saves the SEO and addresses, tidied, with the updatedAt it was loaded with', async () => {
    await loaded()
    type('Search title', 'Acme Bakery')
    type('ShowMine subdomain', ' Acme-Shop ')
    type('Your own domain', ' WWW.Acme.com ')
    vi.mocked(WebsiteService.update).mockResolvedValue(
      website({ seo: { title: 'Acme Bakery', description: 'Bread' }, subdomain: 'acme-shop' }) as never,
    )
    fireEvent.click(saveBtn())

    expect(WebsiteService.update).toHaveBeenCalledWith({
      seo: { title: 'Acme Bakery', description: 'Bread', imageAssetId: null },
      subdomain: 'acme-shop',
      customDomain: 'www.acme.com',
      updatedAt: 'w-time',
    })
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Saved.'))
  })

  test('changing only an address leaves the SEO out, and clearing one sends null', async () => {
    await loaded({ subdomain: 'acme-shop', subdomainStatus: 'pending' })
    type('ShowMine subdomain', '')
    vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
    fireEvent.click(saveBtn())

    expect(WebsiteService.update).toHaveBeenCalledWith({ subdomain: null, customDomain: null, updatedAt: 'w-time' })
  })

  test('typing during a save is kept', async () => {
    await loaded()
    type('Search title', 'First')
    let finish: (value: unknown) => void = () => undefined
    vi.mocked(WebsiteService.update).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never)
    fireEvent.click(saveBtn())
    type('Search title', 'Second')
    await act(async () => finish(website({ seo: { title: 'First', description: 'Bread' } })))
    expect(screen.getByLabelText('Search title')).toHaveValue('Second')
    expect(saveBtn()).toBeEnabled()
  })

  test('emptying a field typed in is not a change, and unsaved changes warn before leaving', async () => {
    await loaded()
    const leaving = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(leaving()).toBe(false)
    type('Search description', 'Bread and cakes')
    expect(leaving()).toBe(true)
    type('Search description', 'Bread')
    expect(saveBtn()).toBeDisabled()
    expect(leaving()).toBe(false)
  })

  test('chooses and removes the sharing image', async () => {
    vi.mocked(WebsiteService.getImages).mockResolvedValue({
      data: [{ id: 'img-1', url: 'https://cdn.test/1.png', fileName: 'one.png' }],
    } as never)
    await loaded({ seo: { title: 'Acme', imageAssetId: 'img-1' } })
    expect(WebsiteService.getImages).toHaveBeenCalledWith(1, ['img-1'])
    const group = screen.getByRole('group', { name: 'Sharing image' })
    expect(await within(group).findByRole('img', { name: 'one.png' })).toBeInTheDocument()

    fireEvent.click(within(group).getByRole('button', { name: 'Change image' }))
    fireEvent.click(screen.getByRole('button', { name: 'pick (one)' }))
    expect(within(group).getByRole('img', { name: 'two.png' })).toBeInTheDocument()

    fireEvent.click(within(group).getByRole('button', { name: 'Remove image' }))
    expect(within(group).getByText('No image')).toBeInTheDocument()
    vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
    fireEvent.click(saveBtn())
    expect(WebsiteService.update).toHaveBeenCalledWith(
      expect.objectContaining({ seo: { title: 'Acme', description: '', imageAssetId: null } }),
    )
  })

  test('a missing sharing image is marked', async () => {
    vi.mocked(WebsiteService.getImages).mockResolvedValue({ data: [] } as never)
    await loaded({ seo: { title: 'Acme', imageAssetId: 'gone' } })
    expect(await screen.findByText('This image is missing. Choose another.')).toBeInTheDocument()
  })

  test.each([
    ['ShowMine subdomain', 'ab', 'Use 3 to 40 lower-case letters, digits or hyphens'],
    ['Your own domain', 'acme', 'Enter a domain name such as www.example.com.'],
  ])('a bad %s is stopped before sending', async (label, value, problem) => {
    await loaded()
    type(label, value)
    fireEvent.click(saveBtn())
    expect(screen.getByText(new RegExp(problem))).toBeInTheDocument()
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
    expect(WebsiteService.update).not.toHaveBeenCalled()
  })

  test.each([
    ['ShowMine subdomain', 'acme-shop', 'That subdomain is taken.', 'That subdomain is taken. Try another.'],
    ['Your own domain', 'acme.com', 'That domain is taken.', 'That domain is used by another website.'],
  ])('a taken %s is shown on its field', async (label, value, apiWords, shown) => {
    await loaded()
    type(label, value)
    vi.mocked(WebsiteService.update).mockRejectedValue(httpError(409, { message: apiWords }))
    fireEvent.click(saveBtn())
    expect(await screen.findByText(shown)).toBeInTheDocument()
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
  })

  test('field problems from the API show on their fields, including SEO', async () => {
    await loaded()
    type('Search title', 'Changed')
    vi.mocked(WebsiteService.update).mockRejectedValue(
      httpError(400, {
        errors: [
          { path: 'seo.title', message: 'Text of at most 70 characters.' },
          { path: 'customDomain', message: 'Not one of our own addresses.' },
        ],
      }),
    )
    fireEvent.click(saveBtn())
    expect(await screen.findByText('Text of at most 70 characters.')).toBeInTheDocument()
    expect(screen.getByLabelText('Search title')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Not one of our own addresses.')).toBeInTheDocument()
  })

  test('a problem with no field on the page is reported', async () => {
    await loaded()
    type('Search title', 'Changed')
    vi.mocked(WebsiteService.update).mockRejectedValue(
      httpError(400, { errors: [{ path: 'updatedAt', message: 'The updatedAt the website was loaded with.' }] }),
    )
    fireEvent.click(saveBtn())
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('The updatedAt the website was loaded with.'))
  })

  test('a save after someone else saved asks for a reload, which loads their version', async () => {
    await loaded()
    type('Search title', 'Mine')
    vi.mocked(WebsiteService.update).mockRejectedValue(
      httpError(409, { message: 'The website was changed by someone else. Reload and try again.' }),
    )
    fireEvent.click(saveBtn())
    expect(await screen.findByText(/Someone else changed the website/)).toBeInTheDocument()
    expect(saveBtn()).toBeDisabled()

    vi.mocked(WebsiteService.get).mockResolvedValue(website({ seo: { title: 'Theirs' } }) as never)
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(await screen.findByDisplayValue('Theirs')).toBeInTheDocument()
  })

  test('another failure is reported', async () => {
    await loaded()
    type('Search title', 'Mine')
    vi.mocked(WebsiteService.update).mockRejectedValue(httpError(500, { message: 'Server down' }))
    fireEvent.click(saveBtn())
    await waitFor(() => expect(message.error).toHaveBeenCalled())
  })

  test('a load failure can be retried', async () => {
    vi.mocked(WebsiteService.get).mockRejectedValueOnce(httpError(500, { message: 'Server down' }))
    renderPage()
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument()
    vi.mocked(WebsiteService.get).mockResolvedValue(website() as never)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByDisplayValue('Acme')).toBeInTheDocument()
  })

  describe('a super admin', () => {
    const staff = { company, user: { id: 'u-1', isSuperAdmin: true } }

    test('sets the domain state, sent only when changed', async () => {
      await loaded({ customDomain: 'acme.com', customDomainStatus: 'pending' }, staff)
      const select = screen.getByLabelText('Domain state (ShowMine staff)')
      fireEvent.mouseDown(select)
      fireEvent.click(await screen.findByTitle('verified'))
      vi.mocked(WebsiteService.update).mockResolvedValue(
        website({ customDomain: 'acme.com', customDomainStatus: 'verified' }) as never,
      )
      fireEvent.click(saveBtn())

      expect(WebsiteService.update).toHaveBeenCalledWith({
        subdomain: null,
        customDomain: 'acme.com',
        customDomainStatus: 'verified',
        updatedAt: 'w-time',
      })
      expect(await screen.findByText('State: verified')).toBeInTheDocument()
    })

    test('a new domain is sent without the state, so it waits to be checked', async () => {
      await loaded({ customDomain: 'acme.com', customDomainStatus: 'pending' }, staff)
      fireEvent.mouseDown(screen.getByLabelText('Domain state (ShowMine staff)'))
      fireEvent.click(await screen.findByTitle('verified'))
      type('Your own domain', 'shop.acme.com')
      vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
      fireEvent.click(saveBtn())
      expect(WebsiteService.update).toHaveBeenCalledWith({
        subdomain: null,
        customDomain: 'shop.acme.com',
        updatedAt: 'w-time',
      })
    })

    test('has no state selector while no domain is recorded', async () => {
      await loaded({}, staff)
      expect(screen.queryByLabelText('Domain state (ShowMine staff)')).not.toBeInTheDocument()
    })

    test('leaves the state out when only other fields change', async () => {
      await loaded({ customDomain: 'acme.com', customDomainStatus: 'pending' }, staff)
      type('Search title', 'New')
      vi.mocked(WebsiteService.update).mockResolvedValue(website() as never)
      fireEvent.click(saveBtn())
      expect(vi.mocked(WebsiteService.update).mock.calls[0][0]).not.toHaveProperty('customDomainStatus')
    })
  })

  test('an answer for the company before a switch is dropped', async () => {
    const { store } = await loaded()
    type('Search title', 'Mine')
    let finish: (value: unknown) => void = () => undefined
    vi.mocked(WebsiteService.update).mockReturnValue(new Promise((resolve) => (finish = resolve)) as never)
    vi.mocked(WebsiteService.get).mockReturnValue(new Promise(() => undefined) as never)
    fireEvent.click(saveBtn())
    act(() => {
      store.dispatch(changeCompany({ company: { id: 'co-2', name: 'Other', websiteBuilderEnabled: true } }))
    })
    await act(async () => finish(website({ seo: { title: 'Mine' } })))
    expect(message.success).not.toHaveBeenCalled()
  })
})
