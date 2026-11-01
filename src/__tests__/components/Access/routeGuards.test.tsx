import React, { useEffect } from 'react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import { apiError, deferred, stubMatchMedia } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import ProtectedRoute from '../../../Components/Route/ProtectedRoute'
import CompanyAdminRoute from '../../../Components/Route/CompanyAdminRoute'
import SuperAdminRoute from '../../../Components/Route/SuperAdminRoute'
import AuthService from '../../../Services/AuthService'
import LocalStorageService from '../../../Services/LocalStorageService'
import Locale from '../../../Components/Form/Locale'
import { ARTICLE_LIST_URL, BACK_END_URL, LOGIN_URL } from '../../../UrlMap'
import { ROLE_ADMIN, ROLE_NON_ADMIN } from '../../../Types/Company/ICompanyUser'

vi.mock('../../../Services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/AuthService')>()
  return { default: { ...actual.default, getMe: vi.fn() } }
})

const acme = { id: 'co-1', name: 'Acme' }
const globex = { id: 'co-2', name: 'Globex' }
const me = { id: 'u-1', languageCode: 'en' }
const session = (overrides = {}, companies: object[] = []) =>
  ({ user: { ...me, ...overrides }, companies }) as never

const renderProtected = (children: React.ReactNode = <div>secret</div>, state = {}) =>
  renderWithProviders(
    <Routes>
      <Route path={LOGIN_URL} element={<div>login page</div>} />
      <Route path='*' element={<ProtectedRoute>{children}</ProtectedRoute>} />
    </Routes>,
    { route: BACK_END_URL, state },
  )

const WantedPage = () => <div>wanted {useLocation().state?.from}</div>

beforeAll(() => stubMatchMedia())

describe('ProtectedRoute', () => {
  test('allows a loaded user straight through without fetching', () => {
    renderProtected(undefined, { auth: { user: me } })
    expect(screen.getByText('secret')).toBeInTheDocument()
    expect(AuthService.getMe).not.toHaveBeenCalled()
  })

  test('shows the loading panel while the session is being fetched', async () => {
    vi.mocked(AuthService.getMe).mockReturnValue(new Promise(() => undefined))
    renderProtected()
    expect(await screen.findByText('Fetching your account details...')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
  })

  test('allows the user once the session loads', async () => {
    vi.mocked(AuthService.getMe).mockResolvedValue(session())
    const { store } = renderProtected()
    expect(await screen.findByText('secret')).toBeInTheDocument()
    expect(store.getState().auth).toMatchObject({ user: me, isAuthenticated: true, isAuthenticating: false })
  })

  test('denies a failed session: token and store are cleared and the user lands on login', async () => {
    AuthService.setLocalAuthToken('stale')
    vi.mocked(AuthService.getMe).mockRejectedValue(apiError('401'))
    const { store } = renderProtected(undefined, { auth: { company: acme } })
    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('secret')).not.toBeInTheDocument()
    expect(AuthService.getLocalAuthToken()).toBeNull()
    expect(store.getState().auth.user).toBeUndefined()
    expect(store.getState().auth.company).toBeUndefined()
    expect(store.getState().auth.isAuthenticating).toBe(false)
  })

  test('tells the login page which page was wanted', async () => {
    vi.mocked(AuthService.getMe).mockRejectedValue(apiError('401'))
    renderWithProviders(
      <Routes>
        <Route path={LOGIN_URL} element={<WantedPage />} />
        <Route path='*' element={<ProtectedRoute>secret</ProtectedRoute>} />
      </Routes>,
      { route: `${ARTICLE_LIST_URL}?page=2` },
    )
    expect(await screen.findByText(`wanted ${ARTICLE_LIST_URL}?page=2`)).toBeInTheDocument()
  })

  test('clears the stored company id when the session fails', async () => {
    LocalStorageService.setCompanyId('co-1')
    vi.mocked(AuthService.getMe).mockRejectedValue(apiError('401'))
    renderProtected()
    await screen.findByText('login page')
    expect(LocalStorageService.getCompanyId()).toBeNull()
  })

  test('does not mount protected content before the session is known', async () => {
    const mounted = vi.fn()
    const Child = () => {
      useEffect(() => mounted(), [])
      return <div>secret</div>
    }
    vi.mocked(AuthService.getMe).mockReturnValue(new Promise(() => undefined))
    renderProtected(<Child />)
    await screen.findByText('Fetching your account details...')
    expect(mounted).not.toHaveBeenCalled()
  })

  test('picks the English locale from the user language', async () => {
    vi.mocked(AuthService.getMe).mockResolvedValue(session({ languageCode: Locale.enUS.locale }))
    const { store } = renderProtected(undefined, { app: { locale: Locale.zhCN } })
    await screen.findByText('secret')
    expect(store.getState().app.locale).toBe(Locale.enUS)
  })

  test('picks the Chinese locale for any other language', async () => {
    vi.mocked(AuthService.getMe).mockResolvedValue(session({ languageCode: Locale.zhCN.locale }))
    const { store } = renderProtected()
    await screen.findByText('secret')
    expect(store.getState().app.locale).toBe(Locale.zhCN)
  })

  test('ignores a session that arrives after leaving the page', async () => {
    const pending = deferred<never>()
    vi.mocked(AuthService.getMe).mockReturnValue(pending.promise)
    const { store, unmount } = renderProtected()
    unmount()
    await act(async () => pending.resolve(session()))
    expect(store.getState().auth.user).toBeUndefined()
    expect(LocalStorageService.getCompanyId()).toBeNull()
  })

  test('ignores a failure that arrives after leaving the page', async () => {
    AuthService.setLocalAuthToken('tok')
    const pending = deferred<never>()
    vi.mocked(AuthService.getMe).mockReturnValue(pending.promise)
    const { unmount } = renderProtected()
    unmount()
    await act(async () => pending.reject(apiError('late')))
    expect(AuthService.getLocalAuthToken()).toBe('tok')
  })

  describe('company selection', () => {
    const companies = [{ Company: globex }, { Company: acme }]

    test('prefers the last visited company', async () => {
      vi.mocked(AuthService.getMe).mockResolvedValue(session({ LastVisitCompany: acme }, companies))
      const { store } = renderProtected()
      await screen.findByText('secret')
      expect(store.getState().auth.company).toEqual(acme)
      expect(LocalStorageService.getCompanyId()).toBe('co-1')
    })

    test('falls back to the first company of the user', async () => {
      vi.mocked(AuthService.getMe).mockResolvedValue(session({}, companies))
      const { store } = renderProtected()
      await screen.findByText('secret')
      expect(store.getState().auth.company).toEqual(globex)
      expect(store.getState().auth.companyUsers).toEqual(companies)
      expect(LocalStorageService.getCompanyId()).toBe('co-2')
    })

    test('stores an empty company id for a user with no company', async () => {
      LocalStorageService.setCompanyId('previous')
      vi.mocked(AuthService.getMe).mockResolvedValue(session())
      const { store } = renderProtected()
      await screen.findByText('secret')
      expect(store.getState().auth.company).toBeUndefined()
      expect(LocalStorageService.getCompanyId()).toBe('')
    })
  })
})

describe('CompanyAdminRoute', () => {
  const member = { companyId: 'co-1', isActive: true, isPending: false, role: ROLE_ADMIN }
  const renderGuard = (auth: object) =>
    renderWithProviders(
      <Routes>
        <Route path={BACK_END_URL} element={<div>home</div>} />
        <Route path='*' element={<CompanyAdminRoute><div>admin area</div></CompanyAdminRoute>} />
      </Routes>,
      { route: '/b/company/', state: { auth } },
    )

  test('allows an active admin of the current company', () => {
    renderGuard({ user: me, company: acme, companyUsers: [member] })
    expect(screen.getByText('admin area')).toBeInTheDocument()
  })

  test('allows a super admin with no membership', () => {
    renderGuard({ user: { ...me, isSuperAdmin: true }, company: acme, companyUsers: [] })
    expect(screen.getByText('admin area')).toBeInTheDocument()
  })

  test.each([
    ['has no memberships', undefined],
    ['is a normal member', [{ ...member, role: ROLE_NON_ADMIN }]],
    ['is an admin of another company', [{ ...member, companyId: 'co-2' }]],
    ['has an inactive membership', [{ ...member, isActive: false }]],
    ['is still pending', [{ ...member, isPending: true }]],
  ])('denies a user who %s', (_name, companyUsers) => {
    renderGuard({ user: me, company: acme, companyUsers })
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.queryByText('admin area')).not.toBeInTheDocument()
  })

  test('the denied panel leads back to the dashboard', () => {
    renderGuard({ user: me, company: acme })
    fireEvent.click(screen.getByRole('button', { name: 'Back Home' }))
    expect(screen.getByText('home')).toBeInTheDocument()
  })
})

describe('SuperAdminRoute', () => {
  const renderGuard = (user?: object) =>
    renderWithProviders(<SuperAdminRoute><div>super area</div></SuperAdminRoute>, { state: { auth: { user } } })

  test('allows a super admin', () => {
    renderGuard({ ...me, isSuperAdmin: true })
    expect(screen.getByText('super area')).toBeInTheDocument()
  })

  test.each([
    ['a normal user', { ...me, isSuperAdmin: false }],
    ['an anonymous visitor', undefined],
  ])('denies %s', (_name, user) => {
    renderGuard(user)
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.queryByText('super area')).not.toBeInTheDocument()
  })
})

test('guards do not call the session API on their own', async () => {
  renderWithProviders(<SuperAdminRoute><div>x</div></SuperAdminRoute>)
  await waitFor(() => expect(screen.getByText('403')).toBeInTheDocument())
  expect(AuthService.getMe).not.toHaveBeenCalled()
})
