import React from 'react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { vi } from 'vitest'
import { apiError, stubMatchMedia } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import LoginPage from '../../../Pages/Auth/LoginPage'
import AuthService from '../../../Services/AuthService'
import LocalStorageService, {
  AUTO_LOGIN_DONE,
  AUTO_LOGIN_FAILED,
  AUTO_LOGIN_SENT,
} from '../../../Services/LocalStorageService'
import WeChatService from '../../../Services/WeChatService'
import { ARTICLE_LIST_URL, BACK_END_URL, LOGIN_URL } from '../../../UrlMap'
import { messages } from '../../../i18n/messages'
import Locale from '../../../Components/Form/Locale'

vi.mock('../../../Services/WeChatService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/WeChatService')>()
  return {
    ...actual,
    default: { ...actual.default, goToWeChatLogin: vi.fn(), getUserFromQrcode: vi.fn() },
  }
})

const inWeChat = { weChat: { isInWeChat: true } }
const FAILED_MESSAGE = messages[Locale.enUS.locale]['wechat-login-failed']
const EXPIRED_MESSAGE = messages[Locale.enUS.locale]['session-expired']
const goTo = () => vi.mocked(WeChatService.goToWeChatLogin)
const getUser = () => vi.mocked(WeChatService.getUserFromQrcode)

const Address = () => {
  const { pathname, search } = useLocation()
  return <div>address {`${pathname}${search}`}</div>
}

const renderLogin = (route: string = LOGIN_URL, state: object = inWeChat) =>
  renderWithProviders(
    <>
      <Routes>
        <Route path={BACK_END_URL} element={<div>backend</div>} />
        <Route path={ARTICLE_LIST_URL} element={<div>articles</div>} />
        <Route path='*' element={<LoginPage />} />
      </Routes>
      <Address />
    </>,
    { route, state },
  )
const loginForm = () => screen.findByPlaceholderText('Email')

beforeAll(() => stubMatchMedia())
beforeEach(() => {
  sessionStorage.clear()
  goTo().mockReturnValue(new Promise(() => undefined))
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('going to WeChat', () => {
  test('goes straight to authorize, without showing the sign-in page', async () => {
    renderLogin()
    await waitFor(() => expect(goTo()).toHaveBeenCalledExactlyOnceWith(null))
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
    expect(LocalStorageService.getAutoLoginMark()).toBe(AUTO_LOGIN_SENT)
  })

  test('also goes from the root address', async () => {
    renderLogin('/')
    await waitFor(() => expect(goTo()).toHaveBeenCalled())
  })

  test('keeps the wanted page from the protected route', async () => {
    renderWithProviders(
      <Routes>
        <Route path='*' element={<LoginPage />} />
      </Routes>,
      {
        state: inWeChat,
        route: { pathname: LOGIN_URL, state: { from: ARTICLE_LIST_URL } } as never,
      },
    )
    await waitFor(() => expect(goTo()).toHaveBeenCalledExactlyOnceWith(ARTICLE_LIST_URL))
  })

  test('does nothing in a normal browser', async () => {
    renderLogin(LOGIN_URL, {})
    expect(await loginForm()).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
    expect(LocalStorageService.getAutoLoginMark()).toBeNull()
  })

  test('ignores state in a normal browser', async () => {
    renderLogin(`${LOGIN_URL}?state=abc`, {})
    expect(await loginForm()).toBeInTheDocument()
    expect(getUser()).not.toHaveBeenCalled()
    expect(screen.getByText(`address ${LOGIN_URL}?state=abc`)).toBeInTheDocument()
  })

  test('does nothing when already signed in', async () => {
    AuthService.setLocalAuthToken('tok')
    renderLogin()
    expect(await screen.findByText('backend')).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
  })

  test('?password=1 shows the password form with a WeChat button', async () => {
    renderLogin(`${LOGIN_URL}?password=1`)
    expect(await loginForm()).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /WeChat/ })).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
  })
})

describe('never looping', () => {
  test('after logging out there is a WeChat button and no redirect or message', async () => {
    LocalStorageService.setAutoLoginMark(AUTO_LOGIN_DONE)
    renderLogin()
    expect(await loginForm()).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /WeChat/ })).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
    expect(screen.queryByText(FAILED_MESSAGE)).not.toBeInTheDocument()
  })

  test.each([[AUTO_LOGIN_SENT], [AUTO_LOGIN_FAILED]])(
    'coming back without state after %s shows the message and does not go again',
    async (mark) => {
      LocalStorageService.setAutoLoginMark(mark)
      renderLogin()
      expect(await screen.findByText(FAILED_MESSAGE)).toBeInTheDocument()
      expect(await loginForm()).toBeInTheDocument()
      expect(goTo()).not.toHaveBeenCalled()
      expect(LocalStorageService.getAutoLoginMark()).toBe(AUTO_LOGIN_FAILED)
    },
  )

  test('a failure to reach the API shows the message and does not go again', async () => {
    goTo().mockRejectedValue(apiError('down'))
    renderLogin()
    expect(await screen.findByText(FAILED_MESSAGE)).toBeInTheDocument()
    expect(goTo()).toHaveBeenCalledTimes(1)
    expect(LocalStorageService.getAutoLoginMark()).toBe(AUTO_LOGIN_FAILED)
  })

  test('returning from the back-forward cache shows the sign-in page', async () => {
    renderLogin()
    await waitFor(() => expect(goTo()).toHaveBeenCalled())
    await act(async () => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    })
    expect(await screen.findByText(FAILED_MESSAGE)).toBeInTheDocument()
  })

  test('a first page show does not count as a return', async () => {
    renderLogin()
    await waitFor(() => expect(goTo()).toHaveBeenCalled())
    await act(async () => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }))
    })
    expect(screen.queryByText(FAILED_MESSAGE)).not.toBeInTheDocument()
  })

  test('without working storage it never redirects', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    renderLogin()
    expect(await loginForm()).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
  })
})

describe('returning with state', () => {
  test('signs in, cleans the address and lands on the wanted page', async () => {
    getUser().mockResolvedValue({ user: { id: 'u-1' }, token: ' user-token ' })
    renderLogin(`${LOGIN_URL}?from=${encodeURIComponent(ARTICLE_LIST_URL)}&state=abc`)
    expect(await screen.findByText('articles')).toBeInTheDocument()
    expect(getUser()).toHaveBeenCalledExactlyOnceWith('abc')
    expect(AuthService.getLocalAuthToken()).toBe('user-token')
    expect(screen.getByText(`address ${ARTICLE_LIST_URL}`)).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
  })

  test('lands on the dashboard with no wanted page', async () => {
    getUser().mockResolvedValue({ token: 'user-token' })
    renderLogin(`${LOGIN_URL}?state=abc`)
    expect(await screen.findByText('backend')).toBeInTheDocument()
  })

  test('marks the tab, so a later logout or failed session does not go again', async () => {
    getUser().mockResolvedValue({ token: 'user-token' })
    renderLogin(`${LOGIN_URL}?state=abc`)
    await screen.findByText('backend')
    expect(LocalStorageService.getAutoLoginMark()).toBe(AUTO_LOGIN_DONE)
  })

  test.each([['https://evil.test/'], ['//evil.test/'], ['/\\evil.test/']])('ignores the unsafe path %s', async (from) => {
    getUser().mockResolvedValue({ token: 'user-token' })
    renderLogin(`${LOGIN_URL}?from=${encodeURIComponent(from)}&state=abc`)
    expect(await screen.findByText('backend')).toBeInTheDocument()
  })

  test.each([
    ['expired or invalid', () => getUser().mockRejectedValue(apiError('Expired token'))],
    ['with no user attached', () => getUser().mockResolvedValue({ id: 'abc', userId: null })],
  ])('state %s shows the message, cleans the address and does not go again', async (_, arrange) => {
    arrange()
    renderLogin(`${LOGIN_URL}?from=%2Fb%2F&state=abc`)
    expect(await screen.findByText(FAILED_MESSAGE)).toBeInTheDocument()
    expect(await loginForm()).toBeInTheDocument()
    expect(screen.getByText(`address ${LOGIN_URL}?from=%2Fb%2F`)).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
    expect(LocalStorageService.getAutoLoginMark()).toBe(AUTO_LOGIN_FAILED)
    expect(AuthService.getLocalAuthToken()).toBeNull()
  })

  test('the WeChat button still works after a failure', async () => {
    getUser().mockRejectedValue(apiError('Expired token'))
    renderLogin(`${LOGIN_URL}?from=%2Fb%2Fmedia&state=abc`)
    fireEvent.click(await screen.findByRole('button', { name: /WeChat/ }))
    await waitFor(() => expect(goTo()).toHaveBeenCalledExactlyOnceWith('/b/media'))
  })
})

describe('returning with wechatError', () => {
  test.each([['declined'], ['expired'], ['failed']])(
    '%s shows the message, cleans the address and does not go again',
    async (reason) => {
      LocalStorageService.setAutoLoginMark(AUTO_LOGIN_SENT)
      renderLogin(`${LOGIN_URL}?from=%2Fb%2Fmedia&wechatError=${reason}`)
      expect(await screen.findByText(FAILED_MESSAGE)).toBeInTheDocument()
      expect(await loginForm()).toBeInTheDocument()
      expect(screen.getByText(`address ${LOGIN_URL}?from=%2Fb%2Fmedia`)).toBeInTheDocument()
      expect(goTo()).not.toHaveBeenCalled()
      expect(LocalStorageService.getAutoLoginMark()).toBe(AUTO_LOGIN_FAILED)
    },
  )

  test('counts as a failure even in a fresh tab, and leaves a clean address', async () => {
    renderLogin(`${LOGIN_URL}?wechatError=declined`)
    expect(await screen.findByText(FAILED_MESSAGE)).toBeInTheDocument()
    expect(screen.getByText(`address ${LOGIN_URL}`)).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
  })

  test('counts as a failure after logging out and tapping the button', async () => {
    LocalStorageService.setAutoLoginMark(AUTO_LOGIN_DONE)
    renderLogin(`${LOGIN_URL}?wechatError=declined`)
    expect(await screen.findByText(FAILED_MESSAGE)).toBeInTheDocument()
  })

  test('wins over a state, which is never exchanged', async () => {
    renderLogin(`${LOGIN_URL}?state=abc&wechatError=failed`)
    expect(await screen.findByText(FAILED_MESSAGE)).toBeInTheDocument()
    expect(getUser()).not.toHaveBeenCalled()
    expect(screen.getByText(`address ${LOGIN_URL}`)).toBeInTheDocument()
  })

  test('the WeChat button still works afterwards', async () => {
    renderLogin(`${LOGIN_URL}?from=%2Fb%2Fmedia&wechatError=expired`)
    fireEvent.click(await screen.findByRole('button', { name: /WeChat/ }))
    await waitFor(() => expect(goTo()).toHaveBeenCalledExactlyOnceWith('/b/media'))
  })
})

test('the message exists in both languages', () => {
  expect(messages[Locale.zhCN.locale]['wechat-login-failed']).toMatch(/微信/)
  expect(FAILED_MESSAGE).toMatch(/WeChat/)
})

describe('coming back from an expired session', () => {
  const wanted = `${LOGIN_URL}?password=1&from=${encodeURIComponent(`${ARTICLE_LIST_URL}?page=2`)}`
  const signIn = async () => {
    fireEvent.change(await loginForm(), { target: { value: 'a@b.co' } })
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: 'login Login' }))
  }

  afterEach(() => localStorage.clear())

  test('stays on the form inside WeChat, with no trip to WeChat, and says why once', async () => {
    LocalStorageService.setLoginNotice(EXPIRED_MESSAGE)
    renderLogin(wanted)
    expect(await loginForm()).toBeInTheDocument()
    expect(screen.getByText(EXPIRED_MESSAGE)).toBeInTheDocument()
    expect(goTo()).not.toHaveBeenCalled()
    await waitFor(() => expect(LocalStorageService.getLoginNotice()).toBeNull())
  })

  test('the WeChat button still returns to the wanted page', async () => {
    renderLogin(wanted)
    fireEvent.click(await screen.findByRole('button', { name: /WeChat/ }))
    await waitFor(() => expect(goTo()).toHaveBeenCalledWith(`${ARTICLE_LIST_URL}?page=2`))
  })

  test('signing in with a password returns to the wanted page', async () => {
    vi.spyOn(AuthService, 'login').mockResolvedValue({ token: 'tok' })
    renderLogin(wanted)
    await signIn()
    expect(await screen.findByText('articles')).toBeInTheDocument()
    expect(screen.getByText(`address ${ARTICLE_LIST_URL}?page=2`)).toBeInTheDocument()
  })

  test('someone already signed in goes to the wanted page too', async () => {
    AuthService.setLocalAuthToken('tok')
    renderLogin(wanted)
    expect(await screen.findByText('articles')).toBeInTheDocument()
  })

  test('a return address on another site goes to the dashboard', async () => {
    vi.spyOn(AuthService, 'login').mockResolvedValue({ token: 'tok' })
    renderLogin(`${LOGIN_URL}?password=1&from=${encodeURIComponent('https://evil.test/x')}`)
    await signIn()
    expect(await screen.findByText('backend')).toBeInTheDocument()
  })
})
