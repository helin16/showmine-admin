import React from 'react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { apiError, deferred, stubMatchMedia, type } from '../Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import UserCompanySelector from '../../../Components/Company/UserCompanySelector'
import CompanyInvalidNotice from '../../../Components/Company/CompanyInvalidNotice'
import moment from 'moment'
import '../../../i18n/translate'
import AuthService from '../../../Services/AuthService'
import CompanyService from '../../../Services/CompanyService'
import message from '../../../Components/Form/message'
import { BACK_END_URL } from '../../../UrlMap'

vi.mock('../../../Services/AuthService', () => ({ default: { updateMe: vi.fn() } }))
vi.mock('../../../Services/CompanyService', () => ({ default: { getAll: vi.fn() } }))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

const acme = { id: 'co-1', name: 'Acme' }
const globex = { id: 'co-2', name: 'Globex' }
const memberships = [{ Company: acme }, { Company: globex }, {}]

const open = (container: HTMLElement) => {
  fireEvent.mouseDown(container.querySelector('.ant-select-selector') as Element)
}
const option = (name: string) => screen.findByTitle(name, { selector: '.ant-select-item-option' })
const selected = (container: HTMLElement) => container.querySelector('.ant-select-selection-item')

beforeAll(() => stubMatchMedia())
beforeEach(() => {
  vi.stubGlobal('location', { href: '/start' })
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('UserCompanySelector', () => {
  describe('for a normal user', () => {
    const state = { auth: { user: { id: 'u-1' }, company: acme, companyUsers: memberships } }

    test('offers only the companies of the user, without asking the API', async () => {
      const { container } = renderWithProviders(<UserCompanySelector />, { state: state as never })
      expect(selected(container)).toHaveTextContent('Acme')
      open(container)
      expect(await option('Globex')).toBeInTheDocument()
      expect(CompanyService.getAll).not.toHaveBeenCalled()
    })

    test('renders nothing when the user has no company', () => {
      const { container } = renderWithProviders(<UserCompanySelector />, { state: { auth: { user: { id: 'u-1' } } } })
      expect(container).toBeEmptyDOMElement()
    })

    test('shows an empty selection when no company is selected', () => {
      const { container } = renderWithProviders(<UserCompanySelector />, {
        state: { auth: { companyUsers: memberships } } as never,
      })
      expect(selected(container)).toBeEmptyDOMElement()
    })

    test('switching saves the last visited company and reloads the backend', async () => {
      vi.mocked(AuthService.updateMe).mockResolvedValue({} as never)
      const { container } = renderWithProviders(<UserCompanySelector />, { state: state as never })
      open(container)
      fireEvent.click(await option('Globex'))
      expect(AuthService.updateMe).toHaveBeenCalledExactlyOnceWith({ lastVisitCompanyId: 'co-2' })
      await waitFor(() => expect(window.location.href).toBe(BACK_END_URL))
    })

    test('a failed switch stays on the current company and reports the error', async () => {
      vi.mocked(AuthService.updateMe).mockRejectedValue(apiError('nope'))
      const { container } = renderWithProviders(<UserCompanySelector />, { state: state as never })
      open(container)
      fireEvent.click(await option('Globex'))
      await waitFor(() => expect(message.error).toHaveBeenCalledWith('nope'))
      expect(window.location.href).toBe('/start')
      expect(selected(container)).toHaveTextContent('Acme')
    })

    // Known bug: filterOption reads option.children but options only carry label, so every search comes back empty.
    test.fails('search finds a company by name', async () => {
      const { container } = renderWithProviders(<UserCompanySelector />, { state: state as never })
      open(container)
      await option('Globex')
      type(container.querySelector('input') as HTMLElement, 'glo')
      expect(await option('Globex')).toBeInTheDocument()
    })
  })

  describe('for a super admin', () => {
    const state = { auth: { user: { id: 'u-1', isSuperAdmin: true }, company: acme } }

    test('offers every active company from the API', async () => {
      vi.mocked(CompanyService.getAll).mockResolvedValue({ data: [acme, globex] } as never)
      const { container } = renderWithProviders(<UserCompanySelector />, { state: state as never })
      await waitFor(() => expect(selected(container)).toHaveTextContent('Acme'))
      expect(CompanyService.getAll).toHaveBeenCalledExactlyOnceWith({
        where: JSON.stringify({ isActive: true }),
        perPage: 9999,
        currentPage: 1,
      })
      open(container)
      expect(await option('Globex')).toBeInTheDocument()
    })

    test('renders nothing when the API returns no data', async () => {
      vi.mocked(CompanyService.getAll).mockResolvedValue({} as never)
      const { container } = renderWithProviders(<UserCompanySelector />, { state: state as never })
      await act(async () => undefined)
      expect(container).toBeEmptyDOMElement()
    })

    test('reports a load failure', async () => {
      vi.mocked(CompanyService.getAll).mockRejectedValue(apiError('down'))
      renderWithProviders(<UserCompanySelector />, { state: state as never })
      await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error: down'))
    })

    test('ignores a response or failure after unmounting', async () => {
      const ok = deferred<never>()
      const bad = deferred<never>()
      vi.mocked(CompanyService.getAll).mockReturnValueOnce(ok.promise).mockReturnValueOnce(bad.promise)
      renderWithProviders(<UserCompanySelector />, { state: state as never }).unmount()
      renderWithProviders(<UserCompanySelector />, { state: state as never }).unmount()
      await act(async () => {
        ok.resolve({ data: [acme] } as never)
        bad.reject(apiError('late'))
      })
      expect(message.error).not.toHaveBeenCalled()
    })
  })
})

describe('CompanyInvalidNotice', () => {
  const updatedAt = '2024-03-05T12:00:00.000Z'

  test.each([
    ['no company', undefined],
    ['a company of unknown status', { id: 'co-1' }],
  ])('explains %s is invalid', (_name, company) => {
    renderWithProviders(<CompanyInvalidNotice company={company as never} />)
    expect(screen.getByText('Invalid Company')).toBeInTheDocument()
    expect(screen.getByText('Unfortunately, the company is invalid.')).toBeInTheDocument()
  })

  test('explains when a company was deleted', () => {
    const company = { id: 'co-1', name: 'Acme', isActive: false, updatedAt }
    renderWithProviders(<CompanyInvalidNotice company={company as never} />)
    expect(screen.getByText('Company Deleted')).toBeInTheDocument()
    expect(screen.getByText(`Acme has been deleted @ ${moment(updatedAt).format('lll')}`)).toBeInTheDocument()
  })

  test('formats the deleted date in English for an English user', () => {
    const company = { id: 'co-1', name: 'Acme', isActive: false, updatedAt: '2024-03-05T12:00:00' }
    renderWithProviders(<CompanyInvalidNotice company={company as never} />)
    expect(screen.getByText('Acme has been deleted @ Mar 5, 2024 12:00 PM')).toBeInTheDocument()
  })

  test('falls back to a plain title for an active company', () => {
    renderWithProviders(<CompanyInvalidNotice company={{ id: 'co-1', name: 'Acme', isActive: 1 } as never} />)
    expect(screen.getByText('Invalid Company')).toBeInTheDocument()
    expect(screen.queryByText(/has been deleted/)).not.toBeInTheDocument()
  })

  test('offers a way out: another company or back to the dashboard', () => {
    renderWithProviders(<CompanyInvalidNotice />, { state: { auth: { companyUsers: memberships } } as never })
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', BACK_END_URL)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
