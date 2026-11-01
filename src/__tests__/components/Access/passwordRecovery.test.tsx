import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { apiError, deferred, stubMatchMedia, type } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import ForgotPasswordPage from '../../../Pages/Auth/ForgotPasswordPage'
import LoginPage from '../../../Pages/Auth/LoginPage'
import ResetPasswordPage from '../../../Pages/Auth/ResetPasswordPage'
import ConfirmEmailPage from '../../../Pages/Auth/ConfirmEmailPage'
import AuthService from '../../../Services/AuthService'
import WeChatService from '../../../Services/WeChatService'
import Locale from '../../../Components/Form/Locale'
import message from '../../../Components/Form/message'
import { messages } from '../../../i18n/messages'
import { CONFIRM_EMAIL_URL, FORGOT_PASSWORD_URL, LOGIN_URL, RESET_PASSWORD_URL } from '../../../UrlMap'

vi.mock('../../../Services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/AuthService')>()
  return { default: { ...actual.default, retrievePassword: vi.fn(), resetPassword: vi.fn(), confirmEmail: vi.fn() } }
})
vi.mock('../../../Services/WeChatService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/WeChatService')>()
  return { default: { ...actual.default, goToWeChatLogin: vi.fn() } }
})
vi.mock('../../../Components/Form/message', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

const NEUTRAL = 'If that email has an account, a reset link is on its way. Check your inbox and spam folder.'
const rateLimited = () => Object.assign(apiError('Request failed with status code 429'), { response: { status: 429 } })
const badRequest = (text = 'Token expired') =>
  Object.assign(apiError(text), { response: { status: 400, data: { message: text } } })

beforeAll(() => stubMatchMedia())

describe('forgot password', () => {
  const retrieve = () => vi.mocked(AuthService.retrievePassword)
  const renderForm = () => {
    renderWithProviders(<ForgotPasswordPage />, { route: FORGOT_PASSWORD_URL })
    return screen.getByPlaceholderText('Email')
  }
  const submit = (email: string) => {
    type(renderForm(), email)
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/ }))
  }

  test.each([
    ['an account', { success: true }],
    ['no account', { success: true }],
    ['an unexpected body', { success: false }],
  ])('shows the same neutral result for %s', async (_name, body) => {
    retrieve().mockResolvedValue(body)
    submit('ann@example.com')
    expect(await screen.findByText(NEUTRAL)).toBeInTheDocument()
    expect(retrieve()).toHaveBeenCalledExactlyOnceWith('ann@example.com')
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
  })

  test.each([
    ['empty', '', 'Please input your email!'],
    ['malformed', 'not-an-email', 'Please provide a valid email address.'],
  ])('refuses an %s address without calling the API', async (_name, email, error) => {
    submit(email)
    expect(await screen.findByText(error)).toBeInTheDocument()
    expect(retrieve()).not.toHaveBeenCalled()
  })

  test('explains a 429 and keeps the address for another try', async () => {
    retrieve().mockRejectedValue(rateLimited())
    submit('ann@example.com')
    expect(await screen.findByText('Too many requests. Please wait a few minutes and try again.')).toBeInTheDocument()
    expect(screen.queryByText('Request failed with status code 429')).not.toBeInTheDocument()
    expect(screen.queryByText(NEUTRAL)).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toHaveValue('ann@example.com')
  })

  test('explains a network failure, which has no response', async () => {
    retrieve().mockRejectedValue(new Error('Network Error'))
    submit('ann@example.com')
    expect(await screen.findByText('The request could not be sent. Please try again.')).toBeInTheDocument()
    expect(screen.getByText('Network Error')).toBeInTheDocument()
    expect(screen.queryByText(NEUTRAL)).not.toBeInTheDocument()
  })

  test('clears an earlier error when trying again', async () => {
    retrieve().mockRejectedValueOnce(new Error('Network Error'))
    submit('ann@example.com')
    await screen.findByText('Network Error')
    const pending = deferred<never>()
    retrieve().mockReturnValue(pending.promise)
    fireEvent.click(screen.getByRole('button', { name: /Send reset link/ }))
    await waitFor(() => expect(screen.queryByText('Network Error')).not.toBeInTheDocument())
  })

  test('leads back to the password form', () => {
    renderForm()
    expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute('href', `${LOGIN_URL}?password=1`)
  })
})

describe('reset password', () => {
  const reset = () => vi.mocked(AuthService.resetPassword)
  const INVALID = 'This reset link is invalid or has expired.'
  const goToLink = (search = '?token=reset-token') => window.history.pushState({ idx: 3 }, '', `${RESET_PASSWORD_URL}${search}`)
  const renderPage = (state = {}) =>
    renderWithProviders(
      <Routes>
        <Route path={LOGIN_URL} element={<LoginPage />} />
        <Route path='*' element={<ResetPasswordPage />} />
      </Routes>,
      { route: RESET_PASSWORD_URL, state },
    )
  const fill = (password: string, confirm = password) => {
    type(screen.getByPlaceholderText('New Password'), password)
    type(screen.getByPlaceholderText('Confirm Password'), confirm)
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/ }))
  }

  beforeEach(() => goToLink())
  afterAll(() => window.history.pushState({}, '', '/'))

  test('removes the token from the address and keeps the router state', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    renderPage()
    expect(window.location.pathname).toBe(RESET_PASSWORD_URL)
    expect(window.location.search).toBe('')
    expect(window.history.state).toEqual({ idx: 3 })
    expect(JSON.stringify(replaceState.mock.calls)).not.toContain('reset-token')
  })

  test('sends the token from the address with the new password', async () => {
    reset().mockReturnValue(new Promise(() => undefined))
    renderPage()
    fill('long-enough')
    await waitFor(() => expect(reset()).toHaveBeenCalledExactlyOnceWith('reset-token', 'long-enough'))
  })

  test('a reset signs out and lands on the password form', async () => {
    AuthService.setLocalAuthToken('old-session')
    reset().mockResolvedValue({ success: true })
    renderPage()
    fill('long-enough')
    expect(await screen.findByPlaceholderText('Email')).toBeInTheDocument()
    expect(AuthService.getLocalAuthToken()).toBeNull()
    expect(message.success).toHaveBeenCalledWith('Your password has been reset. Please sign in.')
  })

  test('in WeChat, nothing redirects: not on this page and not after the reset', async () => {
    reset().mockResolvedValue({ success: true })
    renderPage({ weChat: { isInWeChat: true } })
    expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument()
    fill('long-enough')
    expect(await screen.findByPlaceholderText('Email')).toBeInTheDocument()
    expect(WeChatService.goToWeChatLogin).not.toHaveBeenCalled()
  })

  test.each([
    ['short', 'seven77', 'seven77', 'Password must be at least 8 characters.'],
    ['space-padded', '  seven77  ', '  seven77  ', 'Password must be at least 8 characters.'],
    ['spaces-only', '          ', '          ', 'Password must be at least 8 characters.'],
    ['mismatched', 'long-enough', 'long-enough-2', 'Confirmed password is different'],
  ])('refuses a %s password without calling the API', async (_name, password, confirm, error) => {
    renderPage()
    fill(password, confirm)
    expect(await screen.findByText(error)).toBeInTheDocument()
    expect(reset()).not.toHaveBeenCalled()
  })

  test('accepts exactly 8 characters', async () => {
    reset().mockReturnValue(new Promise(() => undefined))
    renderPage()
    fill('eight888')
    await waitFor(() => expect(reset()).toHaveBeenCalled())
  })

  test('a refused link says so, shows why and offers a new one', async () => {
    reset().mockRejectedValue(badRequest())
    renderPage()
    fill('long-enough')
    expect(await screen.findByText(INVALID)).toBeInTheDocument()
    expect(screen.getByText('Token expired')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', FORGOT_PASSWORD_URL)
    expect(screen.queryByPlaceholderText('New Password')).not.toBeInTheDocument()
  })

  test.each([
    ['no token', ''],
    ['an empty token', '?token='],
  ])('%s shows the invalid link message without a form', (_name, search) => {
    goToLink(search)
    renderPage()
    expect(screen.getByText(INVALID)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('New Password')).not.toBeInTheDocument()
  })

  test('a network failure is not called an invalid link, and the form stays to try again', async () => {
    reset().mockRejectedValue(new Error('Network Error'))
    renderPage()
    fill('long-enough')
    expect(await screen.findByText('Network Error')).toBeInTheDocument()
    expect(screen.queryByText(INVALID)).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reset Password/ })).toBeEnabled()
  })
})

describe('confirm email', () => {
  const confirmEmail = () => vi.mocked(AuthService.confirmEmail)
  const INVALID = 'This confirmation link cannot be used.'
  const renderPage = (search = '?token=email-token') => {
    window.history.pushState({ idx: 3 }, '', `${CONFIRM_EMAIL_URL}${search}`)
    renderWithProviders(<ConfirmEmailPage />, { route: CONFIRM_EMAIL_URL })
  }
  const clickConfirm = () => fireEvent.click(screen.getByRole('button', { name: /Confirm/ }))

  afterAll(() => window.history.pushState({}, '', '/'))

  test('removes the token from the address, and uses it only on a click', () => {
    renderPage()
    expect(window.location.search).toBe('')
    expect(window.history.state).toEqual({ idx: 3 })
    expect(confirmEmail()).not.toHaveBeenCalled()
  })

  test('says the email changed', async () => {
    confirmEmail().mockResolvedValue({ success: true })
    renderPage()
    clickConfirm()
    expect(await screen.findByText('Your email has been changed.')).toBeInTheDocument()
    expect(confirmEmail()).toHaveBeenCalledExactlyOnceWith('email-token')
  })

  test('a link with no token cannot be used', () => {
    renderPage('')
    expect(screen.getByText(INVALID)).toBeInTheDocument()
  })

  test('shows why the API refused the link', async () => {
    confirmEmail().mockRejectedValue(badRequest('This email cannot be used.'))
    renderPage()
    clickConfirm()
    expect(await screen.findByText(INVALID)).toBeInTheDocument()
    expect(screen.getByText('This email cannot be used.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Confirm/ })).not.toBeInTheDocument()
  })

  test('keeps the button after a network failure, and clears the error on another try', async () => {
    confirmEmail().mockRejectedValueOnce(new Error('Network Error'))
    renderPage()
    clickConfirm()
    expect(await screen.findByText('Network Error')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: /Confirm/ })).not.toHaveClass('ant-btn-loading'))
    confirmEmail().mockResolvedValue({ success: true })
    clickConfirm()
    expect(await screen.findByText('Your email has been changed.')).toBeInTheDocument()
    expect(screen.queryByText('Network Error')).not.toBeInTheDocument()
  })
})

test('every recovery message exists in both languages', () => {
  const ids = [
    'forgot-password',
    'forgot-password-intro',
    'forgot-password-sent',
    'send-reset-link',
    'request-too-many',
    'request-not-sent',
    'email-required',
    'email-invalid',
    'password-too-short',
    'reset-link-invalid',
    'request-new-link',
    'reset-password-done',
    'email-confirm-sent',
    'email-pending',
    'confirm-email',
    'confirm-email-intro',
    'confirm-email-done',
    'confirm-email-invalid',
    'back-to-login',
    'confirm-password-diff',
  ]
  const { enUS, zhCN } = Locale
  ids.forEach((id) => {
    expect(messages[enUS.locale][id]).toBeTruthy()
    expect(messages[zhCN.locale][id]).toMatch(/[一-鿿]/)
  })
})
