import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import { stubMatchMedia } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import ProtectedRoute from '../../../Components/Route/ProtectedRoute'
import LoginPage from '../../../Pages/Auth/LoginPage'
import AppService from '../../../Services/AppService'
import AuthService from '../../../Services/AuthService'
import LocalStorageService from '../../../Services/LocalStorageService'
import WeChatService from '../../../Services/WeChatService'
import { useSelector } from 'react-redux'
import { RootState } from '../../../Redux/makeReduxStore'
import { LOGIN_URL } from '../../../UrlMap'

vi.mock('../../../Services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/AuthService')>()
  return { default: { ...actual.default, getMe: vi.fn(), login: vi.fn() } }
})
vi.mock('../../../Services/WeChatService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/WeChatService')>()
  return { ...actual, default: { ...actual.default, goToWeChatLogin: vi.fn(), getUserFromQrcode: vi.fn() } }
})

const LINK = '/b/articles/art-1?company=co-2&comment=c-1'
const acme = { id: 'co-1', name: 'Acme' }
const globex = { id: 'co-2', name: 'Globex' }
const initech = { id: 'co-3', name: 'Initech' }
const session = (overrides = {}) =>
  ({
    user: { id: 'u-1', languageCode: 'en', LastVisitCompany: acme },
    companies: [
      { companyId: acme.id, Company: acme },
      { companyId: globex.id, Company: globex },
    ],
    pendingCompanies: [{ id: initech.id, name: initech.name }],
    ...overrides,
  }) as never

// What a page's first API call would send, read the moment it renders.
const Page = () => {
  const { pathname, search } = useLocation()
  const { company } = useSelector((s: RootState) => s.auth)
  return (
    <div>
      at {`${pathname}${search}`} in {company?.name} sending {LocalStorageService.getCompanyId()}
    </div>
  )
}

const renderApp = (route: string, state = {}) =>
  renderWithProviders(
    <Routes>
      <Route path={LOGIN_URL} element={<LoginPage />} />
      <Route
        path='/b/articles/:id'
        element={
          <ProtectedRoute>
            <Page />
          </ProtectedRoute>
        }
      />
      <Route path='/b/' element={<div>dashboard</div>} />
    </Routes>,
    { route, state },
  )

beforeAll(() => stubMatchMedia())
beforeEach(() => {
  sessionStorage.clear()
  vi.mocked(WeChatService.goToWeChatLogin).mockReturnValue(new Promise(() => undefined))
})
afterEach(() => vi.restoreAllMocks())

describe('choosing the company from the link', () => {
  test('an approved company is selected before the page renders', async () => {
    LocalStorageService.setToken('tok')
    vi.mocked(AuthService.getMe).mockResolvedValue(session())
    renderApp(LINK)
    expect(await screen.findByText(`at ${LINK} in Globex sending co-2`)).toBeInTheDocument()
  })

  test.each([
    ['one the user is not in', '?company=co-9'],
    ['one still pending', '?company=co-3'],
    ['an empty one', '?company='],
    ['none', ''],
  ])('%s keeps the current company', async (_name, search) => {
    LocalStorageService.setToken('tok')
    vi.mocked(AuthService.getMe).mockResolvedValue(session())
    renderApp(`/b/articles/art-1${search}`)
    expect(await screen.findByText(/in Acme sending co-1/)).toBeInTheDocument()
  })

  test('without a last company, the first approved one still applies', async () => {
    LocalStorageService.setToken('tok')
    const { user, companies } = session() as never as { user: object; companies: object[] }
    vi.mocked(AuthService.getMe).mockResolvedValue({
      user: { ...user, LastVisitCompany: null },
      companies,
    } as never)
    renderApp('/b/articles/art-1?company=co-9')
    expect(await screen.findByText(/in Acme sending co-1/)).toBeInTheDocument()
  })
})

describe('signing in on the way', () => {
  test('the password form comes back to the whole link', async () => {
    vi.mocked(AuthService.getMe).mockRejectedValueOnce(new Error('no token')).mockResolvedValue(session())
    vi.mocked(AuthService.login).mockResolvedValue({ token: 'tok' })
    renderApp(LINK)

    fireEvent.change(await screen.findByPlaceholderText('Email'), { target: { value: 'ann@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'password1' } })
    fireEvent.click(document.querySelector('button[type="submit"]') as HTMLElement)

    expect(await screen.findByText(`at ${LINK} in Globex sending co-2`)).toBeInTheDocument()
  })

  test('WeChat sign-in is sent the whole link', async () => {
    vi.mocked(AuthService.getMe).mockRejectedValue(new Error('no token'))
    renderApp(LINK, { weChat: { isInWeChat: true } })
    await waitFor(() => expect(WeChatService.goToWeChatLogin).toHaveBeenCalledWith(LINK))
  })

  test('the address WeChat returns to holds it, past the API adding state', async () => {
    const get = vi.spyOn(AppService, 'get').mockResolvedValue({ data: { url: 'u' } } as never)
    await WeChatService.getWeChatInAppLoginUrl(LINK)

    const { uiUrl } = get.mock.calls[0][1] as { uiUrl: string }
    const returned = new URL(uiUrl)
    returned.searchParams.set('state', 'abc')
    expect(returned.searchParams.get('from')).toBe(LINK)
    expect(returned.pathname).toBe(LOGIN_URL)
  })

  test('coming back from WeChat lands on the whole link', async () => {
    vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValue({ token: 'tok' })
    vi.mocked(AuthService.getMe).mockResolvedValue(session())
    renderApp(`${LOGIN_URL}?${new URLSearchParams({ from: LINK, state: 'abc' })}`, { weChat: { isInWeChat: true } })

    expect(await screen.findByText(`at ${LINK} in Globex sending co-2`)).toBeInTheDocument()
  })

  test('the safe path check leaves it alone', () => {
    expect(WeChatService.getSafeReturnPath(LINK)).toBe(LINK)
  })
})
