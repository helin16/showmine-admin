import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { apiError, deferred, stubMatchMedia, type } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import InvitePage from '../../../Pages/Auth/InvitePage'
import AuthService from '../../../Services/AuthService'
import Locale from '../../../Components/Form/Locale'
import { messages } from '../../../i18n/messages'
import { BACK_END_URL, INVITE_URL, PASSWORD_LOGIN_URL } from '../../../UrlMap'

vi.mock('../../../Services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/AuthService')>()
  return {
    default: {
      ...actual.default,
      checkInvite: vi.fn(),
      acceptInvite: vi.fn(),
      joinInvite: vi.fn(),
      login: vi.fn(),
    },
  }
})

const invite = { companyName: 'Acme', email: 'amy@example.com' }
const withStatus = (status: number, text = 'refused') =>
  Object.assign(apiError(text), { response: { status, data: { message: text } } })

beforeAll(() => stubMatchMedia())

const open = async (search = '?token=tok') => {
  window.history.replaceState({ idx: 3 }, '', `${INVITE_URL}${search}`)
  renderWithProviders(<InvitePage />, { route: INVITE_URL })
}

const openForm = async () => {
  vi.mocked(AuthService.checkInvite).mockResolvedValue(invite)
  await open()
  await screen.findByRole('heading', { name: 'Join Acme' })
}

const fillNewPerson = (password = 'long-enough') => {
  type(screen.getByLabelText('First Name'), 'Amy')
  type(screen.getByLabelText('Last Name'), 'Ng')
  type(screen.getByLabelText('New Password'), password)
  type(screen.getByLabelText('Confirm Password'), password)
}
const submitNewPerson = () => fireEvent.click(screen.getByRole('button', { name: 'Request to join' }))

const showSignIn = () => fireEvent.click(screen.getByRole('button', { name: 'I already have an account' }))
const signIn = () => {
  type(screen.getByLabelText('Email'), 'Amy@Example.com')
  type(screen.getByLabelText('Password'), 'the-password')
  fireEvent.click(screen.getByRole('button', { name: 'Sign in and join' }))
}

describe('the link', () => {
  test('removes the token from the address and keeps the router place', async () => {
    await openForm()
    expect(window.location.search).toBe('')
    expect(window.history.state).toEqual({ idx: 3 })
    expect(AuthService.checkInvite).toHaveBeenCalledExactlyOnceWith('tok')
  })

  test('shows loading while it checks', async () => {
    vi.mocked(AuthService.checkInvite).mockReturnValue(deferred<typeof invite>().promise)
    await open()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  test('without a token, says so and asks nothing of the API', async () => {
    await open('')
    expect(await screen.findByText('This invite link is invalid or has expired.')).toBeInTheDocument()
    expect(AuthService.checkInvite).not.toHaveBeenCalled()
  })

  test('a refused token asks for a new invite', async () => {
    vi.mocked(AuthService.checkInvite).mockRejectedValue(withStatus(400))
    await open()
    expect(await screen.findByText('This invite link is invalid or has expired.')).toBeInTheDocument()
    expect(screen.getByText('Please ask your company admin for a new one.')).toBeInTheDocument()
  })

  test('another failure shows why', async () => {
    vi.mocked(AuthService.checkInvite).mockRejectedValue(withStatus(429, 'Too many'))
    await open()
    expect(await screen.findByText('Too many')).toBeInTheDocument()
  })

  test('says where the invite went, and nothing about an account', async () => {
    await openForm()
    expect(screen.getByText('This invite was sent to amy@example.com.')).toBeInTheDocument()
  })

  test('has Chinese text', async () => {
    vi.mocked(AuthService.checkInvite).mockResolvedValue(invite)
    window.history.replaceState(null, '', `${INVITE_URL}?token=tok`)
    renderWithProviders(<InvitePage />, { route: INVITE_URL, state: { app: { locale: Locale.zhCN } } })
    expect(await screen.findByText(messages[Locale.zhCN.locale]['invite-accept'])).toBeInTheDocument()
  })
})

describe('a new person', () => {
  test('sets a name and password, then hears what happens next', async () => {
    await openForm()
    vi.mocked(AuthService.acceptInvite).mockResolvedValue({ success: true })
    fillNewPerson()
    submitNewPerson()
    await waitFor(() =>
      expect(AuthService.acceptInvite).toHaveBeenCalledExactlyOnceWith('tok', {
        firstName: 'Amy',
        lastName: 'Ng',
        password: 'long-enough',
      }),
    )
    expect(await screen.findByText('Thanks, your request is in')).toBeInTheDocument()
    expect(screen.getByText(/sign in with amy@example.com/)).toBeInTheDocument()
    expect(screen.getByText(/already has an account, we have emailed/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to login/ })).toHaveAttribute('href', PASSWORD_LOGIN_URL)
  })

  test('a short password stops at the form, after trimming', async () => {
    await openForm()
    fillNewPerson('  1234567  ')
    submitNewPerson()
    expect((await screen.findAllByText('Password must be at least 8 characters.')).length).toBeGreaterThan(0)
    expect(AuthService.acceptInvite).not.toHaveBeenCalled()
  })

  test('a link used up meanwhile shows as invalid', async () => {
    await openForm()
    vi.mocked(AuthService.acceptInvite).mockRejectedValue(withStatus(400))
    fillNewPerson()
    submitNewPerson()
    expect(await screen.findByText('This invite link is invalid or has expired.')).toBeInTheDocument()
  })

  test('another failure keeps the form', async () => {
    await openForm()
    vi.mocked(AuthService.acceptInvite).mockRejectedValue(apiError('down'))
    fillNewPerson()
    submitNewPerson()
    expect(await screen.findByText('down')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request to join' })).toBeInTheDocument()
  })
})

describe('someone with an account', () => {
  test('signs in, as typed, and then joins', async () => {
    await openForm()
    vi.mocked(AuthService.login).mockResolvedValue({ token: 'jwt' })
    vi.mocked(AuthService.joinInvite).mockResolvedValue({ status: 'pending' })
    showSignIn()
    signIn()
    await waitFor(() => expect(AuthService.login).toHaveBeenCalledExactlyOnceWith('Amy@Example.com', 'the-password'))
    expect(await screen.findByText('Your request is waiting for an admin to approve it.')).toBeInTheDocument()
    expect(AuthService.getLocalAuthToken()).toBe('jwt')
    expect(AuthService.joinInvite).toHaveBeenCalledExactlyOnceWith('tok')
    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('href', BACK_END_URL)
  })

  test('a failed sign-in is not a bad link', async () => {
    await openForm()
    vi.mocked(AuthService.login).mockRejectedValue(withStatus(400, 'Invalid password.'))
    showSignIn()
    signIn()
    expect(await screen.findByText('Invalid password.')).toBeInTheDocument()
    expect(AuthService.joinInvite).not.toHaveBeenCalled()
    expect(AuthService.getLocalAuthToken()).toBeNull()
  })

  test('can go back to the new person form', async () => {
    await openForm()
    showSignIn()
    fireEvent.click(screen.getByRole('button', { name: 'I need a new account' }))
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
  })

  test('someone already signed in joins with one click', async () => {
    AuthService.setLocalAuthToken('jwt')
    await openForm()
    vi.mocked(AuthService.joinInvite).mockResolvedValue({ status: 'member' })
    expect(screen.queryByLabelText('First Name')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Join with my account' }))
    expect(await screen.findByText('You are already in this company.')).toBeInTheDocument()
  })

  test('a different account hears why and can switch', async () => {
    AuthService.setLocalAuthToken('jwt')
    await openForm()
    vi.mocked(AuthService.joinInvite).mockRejectedValue(withStatus(403, 'Sent to a different address.'))
    fireEvent.click(screen.getByRole('button', { name: 'Join with my account' }))
    expect(await screen.findByText('Sent to a different address.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Use a different account' }))
    expect(AuthService.getLocalAuthToken()).toBeNull()
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.queryByText('Sent to a different address.')).not.toBeInTheDocument()
  })
})
