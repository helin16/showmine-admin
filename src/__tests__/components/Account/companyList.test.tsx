/* eslint-disable camelcase -- these are field names in API responses */
import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import LocalStorageService from '../../../Services/LocalStorageService'
import { apiError, deferred, stubMatchMedia, type } from '../Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import CompanyList from '../../../Components/Company/CompanyList'
import message from '../../../Components/Form/message'
import AuthService from '../../../Services/AuthService'
import CompanyService from '../../../Services/CompanyService'
import { BACK_END_URL } from '../../../UrlMap'

vi.mock('../../../Services/AuthService', () => ({ default: { updateMe: vi.fn() } }))
vi.mock('../../../Services/CompanyService', () => ({ default: { getAll: vi.fn(), deactivate: vi.fn() } }))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

const acme = { id: 'co-1', name: 'Acme' }
const globex = {
  id: 'co-2',
  name: 'Globex',
  contactNumber: '0300',
  email: 'hi@globex.test',
  websiteUrl: 'globex.test',
}
const services = vi.mocked(CompanyService)
const superAdmin = { auth: { user: { isSuperAdmin: true }, company: acme } } as never
const listOf = (data: object[]) => ({ data } as never)
const renderList = () => renderWithProviders(<CompanyList />, { state: superAdmin })
const switchBtn = () => screen.findByRole('button', { name: 'Switch to this company' })

beforeAll(() => stubMatchMedia())

describe('access', () => {
  test.each([
    ['a company admin', { auth: { user: { isSuperAdmin: false } } }],
    ['nobody', {}],
  ])('%s gets the 403 panel and loads nothing', (_who, state) => {
    renderWithProviders(<CompanyList />, { state: state as never })
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(services.getAll).not.toHaveBeenCalled()
  })
})

describe('loading', () => {
  test('asks for every active company: the API hides nothing itself and pages by 10', async () => {
    services.getAll.mockResolvedValue(listOf([]))
    renderList()
    await waitFor(() =>
      expect(services.getAll).toHaveBeenCalledExactlyOnceWith({
        where: JSON.stringify({ isActive: true }),
        perPage: 9999,
        currentPage: 1,
        sort: 'createdAt:DESC',
      }),
    )
  })

  test('shows a spinner while loading', async () => {
    services.getAll.mockReturnValue(deferred<never>().promise)
    const { container } = renderList()
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
  })

  test('shows an empty table', async () => {
    services.getAll.mockResolvedValue(listOf([]))
    renderList()
    expect(await screen.findByText('No data', { selector: '.ant-empty-description' })).toBeInTheDocument()
  })

  test('a load failure is an error, not an empty table', async () => {
    services.getAll.mockRejectedValue(new Error('Network Error'))
    renderList()
    expect(await screen.findByRole('alert')).toHaveTextContent('Error when getting companies: Network Error.')
    expect(screen.queryByText('No data')).not.toBeInTheDocument()
  })

  test.each([
    ['response', (request: ReturnType<typeof deferred<never>>) => request.resolve(listOf([acme]))],
    ['failure', (request: ReturnType<typeof deferred<never>>) => request.reject(new Error('late'))],
  ])('ignores a %s after unmounting', async (_name, settle) => {
    const request = deferred<never>()
    services.getAll.mockReturnValue(request.promise)
    const { container, unmount } = renderList()
    unmount()
    settle(request)
    await request.promise.catch(() => undefined)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('rows', () => {
  test('links the contact details, and a bare website stays an absolute link', async () => {
    services.getAll.mockResolvedValue(listOf([acme, globex]))
    const { container } = renderList()
    await screen.findByText('Globex')
    const hrefs = [...container.querySelectorAll('a')].map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(['tel:0300', 'mailto:hi@globex.test', 'https://globex.test'])
  })

  test('keeps a website with a scheme, and makes a script url harmless', async () => {
    services.getAll.mockResolvedValue(
      listOf([
        { id: 'a', name: 'A', websiteUrl: 'HTTP://a.test' },
        { id: 'b', name: 'B', websiteUrl: 'javascript:alert(1)' },
      ]),
    )
    const { container } = renderList()
    await screen.findByText('A')
    const hrefs = [...container.querySelectorAll('a')].map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(['HTTP://a.test', 'https://javascript:alert(1)'])
  })

  test.each([
    ['from before plans', null, 'No limits'],
    ['free', { plan: 'free' }, 'Free'],
    ['starter', { plan: 'starter' }, 'Starter'],
    ['unlimited', { plan: 'unlimited' }, 'Unlimited'],
  ])('shows the plan: %s', async (_name, adminConfig, plan) => {
    services.getAll.mockResolvedValue(listOf([{ ...acme, adminConfig }]))
    renderList()
    expect(await screen.findByText(plan)).toBeInTheDocument()
  })

  test('shows the JSON of a company in a modal, until it is closed', async () => {
    services.getAll.mockResolvedValue(listOf([globex]))
    renderList()
    fireEvent.click(await screen.findByRole('button', { name: 'Globex' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/"contactNumber": "0300"/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('the current company has no switch or delete buttons', async () => {
    services.getAll.mockResolvedValue(listOf([acme]))
    renderList()
    await screen.findByText('Acme')
    expect(screen.queryByRole('button', { name: 'Switch to this company' })).not.toBeInTheDocument()
    expect(document.querySelector('.anticon-delete')).not.toBeInTheDocument()
  })
})

describe('switching company', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { href: '/start' })
    services.getAll.mockResolvedValue(listOf([globex]))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('saves the last visited company and reloads, so the company header follows', async () => {
    vi.mocked(AuthService.updateMe).mockResolvedValue({} as never)
    renderList()
    fireEvent.click(await switchBtn())
    expect(AuthService.updateMe).toHaveBeenCalledExactlyOnceWith({ lastVisitCompanyId: 'co-2' })
    await waitFor(() => expect(window.location.href).toBe(BACK_END_URL))
    expect(LocalStorageService.getCompanyId()).toBe('co-2')
  })

  test('a failed switch stays put and survives a network error', async () => {
    vi.mocked(AuthService.updateMe).mockRejectedValue(new Error('Network Error'))
    renderList()
    fireEvent.click(await switchBtn())
    await waitFor(() =>
      expect(message.error).toHaveBeenCalledWith('Error when switching company: Network Error'),
    )
    expect(window.location.href).toBe('/start')
  })

  test('shows the API message of a failed switch', async () => {
    vi.mocked(AuthService.updateMe).mockRejectedValue(apiError('nope'))
    renderList()
    fireEvent.click(await switchBtn())
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error when switching company: nope'))
  })
})

test('deleting a company takes it off the list', async () => {
  services.getAll.mockResolvedValue(listOf([globex]))
  services.deactivate.mockResolvedValue(globex as never)
  const { container } = renderList()
  await screen.findByText('Globex')
  fireEvent.click(container.querySelector('.anticon-delete')?.closest('button') as Element)
  const dialog = await screen.findByRole('dialog')
  type(within(dialog).getByPlaceholderText('Type in the company name to confirm'), 'Globex')
  fireEvent.click(within(dialog).getByRole('button', { name: /Confirm Delete/ }))
  await waitFor(() => expect(screen.queryByText('Globex')).not.toBeInTheDocument())
  expect(services.deactivate).toHaveBeenCalledExactlyOnceWith('co-2')
})
