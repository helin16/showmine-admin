import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { apiError, stubMatchMedia, type } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import LoginPage from '../../../Pages/Auth/LoginPage'
import SignUpPage from '../../../Pages/Auth/SignUpPage'
import AuthService from '../../../Services/AuthService'
import Locale from '../../../Components/Form/Locale'
import { messages } from '../../../i18n/messages'
import { LOGIN_URL, SIGN_UP_URL, WIZARD_URL } from '../../../UrlMap'

vi.mock('../../../Services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/AuthService')>()
  return {
    default: {
      ...actual.default,
      signUp: vi.fn(),
      checkSignUp: vi.fn(),
      completeSignUp: vi.fn(),
      setLocalAuthToken: vi.fn(),
    },
  }
})

const withStatus = (status: number, text = 'Nope') =>
  Object.assign(apiError(text), { response: { status, data: { message: text } } })

const renderPage = (search = '') => {
  window.history.pushState({}, '', `${SIGN_UP_URL}${search}`)
  return renderWithProviders(
    <Routes>
      <Route path={SIGN_UP_URL} element={<SignUpPage />} />
      <Route path={WIZARD_URL} element={<p>wizard</p>} />
    </Routes>,
    { route: `${SIGN_UP_URL}${search}` },
  )
}

beforeAll(() => stubMatchMedia())
beforeEach(() => vi.clearAllMocks())

test('the sign-in page links to sign-up', () => {
  renderWithProviders(<LoginPage />, { route: LOGIN_URL })
  expect(screen.getByRole('link', { name: /Sign up/ })).toHaveAttribute('href', SIGN_UP_URL)
})

describe('asking for a link', () => {
  const submit = (email: string) => {
    renderPage()
    type(screen.getByPlaceholderText('Email'), email)
    fireEvent.click(screen.getByRole('button', { name: /Send link/ }))
  }

  test('says to check the inbox, and states the Free plan first', async () => {
    vi.mocked(AuthService.signUp).mockResolvedValue({ success: true })
    renderPage()
    expect(screen.getByText(/Free plan: 1 user and 2 GB/)).toBeInTheDocument()
    type(screen.getByPlaceholderText('Email'), 'amy@example.com')
    fireEvent.click(screen.getByRole('button', { name: /Send link/ }))
    expect(await screen.findByText(/Check your inbox/)).toBeInTheDocument()
    expect(AuthService.signUp).toHaveBeenCalledExactlyOnceWith('amy@example.com')
  })

  test('explains being rate limited', async () => {
    vi.mocked(AuthService.signUp).mockRejectedValue(withStatus(429))
    submit('amy@example.com')
    expect(await screen.findByText(messages[Locale.enUS.locale]['request-too-many'])).toBeInTheDocument()
  })
})

describe('using the link', () => {
  const fill = async () => {
    vi.mocked(AuthService.checkSignUp).mockResolvedValue({ email: 'amy@example.com' })
    renderPage('?token=abc')
    expect(await screen.findByText('For amy@example.com')).toBeInTheDocument()
    type(screen.getByPlaceholderText('Name of the company'), 'Amy Co')
    type(screen.getByPlaceholderText('First Name'), 'Amy')
    type(screen.getByPlaceholderText('New Password'), 'long-enough')
    type(screen.getByPlaceholderText('Confirm Password'), 'long-enough')
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }))
  }

  test('removes the token from the address', async () => {
    vi.mocked(AuthService.checkSignUp).mockResolvedValue({ email: 'amy@example.com' })
    renderPage('?token=abc')
    await screen.findByText('For amy@example.com')
    expect(window.location.search).toBe('')
  })

  test('signs in and opens the wizard', async () => {
    vi.mocked(AuthService.completeSignUp).mockResolvedValue({ token: 'jwt' })
    await fill()
    expect(await screen.findByText('wizard')).toBeInTheDocument()
    expect(AuthService.setLocalAuthToken).toHaveBeenCalledExactlyOnceWith('jwt')
    expect(AuthService.completeSignUp).toHaveBeenCalledExactlyOnceWith(
      'abc',
      expect.objectContaining({ companyName: 'Amy Co', firstName: 'Amy', password: 'long-enough' }),
    )
  })

  test('shows a failure and keeps the form', async () => {
    vi.mocked(AuthService.completeSignUp).mockRejectedValue(withStatus(500, 'Down'))
    await fill()
    expect(await screen.findByText('Down')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument()
  })

  test('offers a new link when this one is used up', async () => {
    vi.mocked(AuthService.checkSignUp).mockRejectedValue(withStatus(400))
    renderPage('?token=abc')
    expect(await screen.findByText('This sign-up link cannot be used.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('link', { name: /Get a new link/ })).toHaveAttribute('href', SIGN_UP_URL))
  })
})

test('every message has both languages', () => {
  const ids = Object.keys(messages[Locale.enUS.locale]).filter((id) => id.startsWith('sign-up'))
  expect(ids.length).toBeGreaterThan(5)
  ids.forEach((id) => expect(messages[Locale.zhCN.locale][id]).toMatch(/[一-鿿]/))
})
