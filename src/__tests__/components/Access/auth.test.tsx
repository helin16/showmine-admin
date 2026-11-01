/* eslint-disable camelcase -- these are field names in API responses */
import React from 'react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { apiError, deferred, stubMatchMedia, type, typeInline } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import LoginForm from '../../../Components/Auth/LoginForm'
import LogoutBtn from '../../../Components/Auth/LogoutBtn'
import PasswordConfirm from '../../../Components/Auth/PasswordConfirm'
import WeChatInAppLoginBtn from '../../../Components/Auth/WeChatInAppLoginBtn'
import AuthService from '../../../Services/AuthService'
import LocalStorageService from '../../../Services/LocalStorageService'
import WeChatService from '../../../Services/WeChatService'
import message from '../../../Components/Form/message'
import { BACK_END_URL, LOGIN_URL, THIRD_PARTY_AUTH_URL_WE_CHAT } from '../../../UrlMap'

vi.mock('../../../Services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/AuthService')>()
  return { default: { ...actual.default, login: vi.fn(), logout: vi.fn() } }
})
vi.mock('../../../Services/WeChatService', () => ({ default: { getWeChatInAppLoginUrl: vi.fn() } }))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

beforeAll(() => stubMatchMedia())

describe('LoginForm', () => {
  const renderForm = () =>
    renderWithProviders(
      <Routes>
        <Route path={BACK_END_URL} element={<div>backend</div>} />
        <Route path='*' element={<LoginForm />} />
      </Routes>,
      { route: LOGIN_URL },
    )
  const submit = (email: string, password: string) => {
    type(screen.getByPlaceholderText('Email'), email)
    type(screen.getByPlaceholderText('password'), password)
    fireEvent.click(screen.getByRole('button', { name: /Login/ }))
  }

  test('requires both fields before calling the API', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: /Login/ }))
    expect(await screen.findByText('Please input your email!')).toBeInTheDocument()
    expect(await screen.findByText('Please input your password!')).toBeInTheDocument()
    expect(AuthService.login).not.toHaveBeenCalled()
  })

  test('rejects a malformed email', async () => {
    renderForm()
    submit('not-an-email', 'pw')
    expect(await screen.findByText('Please provide an valid email address.')).toBeInTheDocument()
    expect(AuthService.login).not.toHaveBeenCalled()
  })

  test('stores the token and enters the backend on success', async () => {
    vi.mocked(AuthService.login).mockResolvedValue({ token: 'tok' })
    renderForm()
    submit('a@b.co', 'pw')
    expect(await screen.findByText('backend')).toBeInTheDocument()
    expect(AuthService.login).toHaveBeenCalledExactlyOnceWith('a@b.co', 'pw')
    expect(AuthService.getLocalAuthToken()).toBe('tok')
  })

  test('shows the server error and stays on the form', async () => {
    vi.mocked(AuthService.login).mockRejectedValue({
      response: { data: { message: 'Wrong credentials', errors: ['locked', 'twice'] } },
    })
    renderForm()
    submit('a@b.co', 'pw')
    expect(await screen.findByText('Wrong credentials')).toBeInTheDocument()
    expect(screen.getByText('locked twice')).toBeInTheDocument()
    expect(AuthService.getLocalAuthToken()).toBeNull()
  })

  test('shows a server error that has no errors list', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
      state = { failed: false }
      static getDerivedStateFromError = () => ({ failed: true })
      render = () => (this.state.failed ? <div>crashed</div> : this.props.children)
    }
    vi.mocked(AuthService.login).mockRejectedValue({ response: { data: { message: 'Nope' } } })
    renderWithProviders(<Boundary><LoginForm /></Boundary>)
    submit('a@b.co', 'pw')
    await waitFor(() => expect(AuthService.login).toHaveBeenCalled())
    await act(async () => undefined)
    expect(screen.getByText('Nope')).toBeInTheDocument()
  })
})

describe('LogoutBtn', () => {
  const renderBtn = (state = {}) =>
    renderWithProviders(
      <Routes>
        <Route path={LOGIN_URL} element={<div>login page</div>} />
        <Route path='*' element={<LogoutBtn />} />
      </Routes>,
      { route: BACK_END_URL, state },
    )
  const confirmLogout = () => {
    fireEvent.click(screen.getByRole('button', { name: 'logout' }))
    fireEvent.click(screen.getByRole('button', { name: /Yes/ }))
  }

  test('asks for confirmation before doing anything', () => {
    renderBtn()
    fireEvent.click(screen.getByRole('button', { name: 'logout' }))
    expect(screen.getByRole('button', { name: /Yes/ })).toBeInTheDocument()
    expect(AuthService.logout).not.toHaveBeenCalled()
  })

  test('cancelling keeps the session', () => {
    AuthService.setLocalAuthToken('tok')
    renderBtn()
    fireEvent.click(screen.getByRole('button', { name: 'logout' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('button', { name: /Yes/ })).not.toBeInTheDocument()
    expect(AuthService.logout).not.toHaveBeenCalled()
    expect(AuthService.getLocalAuthToken()).toBe('tok')
  })

  test('confirming ends the session and goes to login', () => {
    AuthService.setLocalAuthToken('tok')
    const { store } = renderBtn({ auth: { user: { id: 'u-1' }, company: { id: 'co-1' } } })
    confirmLogout()
    expect(AuthService.logout).toHaveBeenCalledOnce()
    expect(AuthService.getLocalAuthToken()).toBeNull()
    expect(store.getState().auth.user).toBeUndefined()
    expect(store.getState().auth.company).toBeUndefined()
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  test('clears the stored company id', () => {
    LocalStorageService.setCompanyId('co-1')
    renderBtn()
    confirmLogout()
    expect(LocalStorageService.getCompanyId()).toBeNull()
  })

  test('clears the memberships of the signed-out user', () => {
    const { store } = renderBtn({ auth: { companyUsers: [{ companyId: 'co-1' }] } })
    confirmLogout()
    expect(store.getState().auth.companyUsers).toBeUndefined()
  })
})

describe('PasswordConfirm', () => {
  const password = () => screen.getByPlaceholderText('Password')
  const confirmation = () => screen.getByPlaceholderText('Confirm Password')

  test('only asks for confirmation once a password is typed', () => {
    renderWithProviders(<PasswordConfirm onConfirm={vi.fn()} />)
    expect(screen.queryByPlaceholderText('Confirm Password')).not.toBeInTheDocument()
    typeInline(password(), 'secret')
    expect(confirmation()).toBeInTheDocument()
  })

  test('blocks a mismatch', () => {
    const onConfirm = vi.fn()
    renderWithProviders(<PasswordConfirm onConfirm={onConfirm} />)
    typeInline(password(), 'secret')
    typeInline(confirmation(), 'other')
    expect(screen.getByText('Confirmed password is different')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
  })

  test('confirms a match and clears both fields', () => {
    const onConfirm = vi.fn()
    renderWithProviders(<PasswordConfirm onConfirm={onConfirm} />)
    typeInline(password(), 'secret')
    typeInline(confirmation(), 'secret')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith('secret', 'secret')
    expect(password()).toHaveValue('')
    expect(screen.queryByPlaceholderText('Confirm Password')).not.toBeInTheDocument()
  })

  test('clearing the password also clears the confirmation', () => {
    renderWithProviders(<PasswordConfirm onConfirm={vi.fn()} />)
    typeInline(password(), 'secret')
    typeInline(confirmation(), 'secret')
    typeInline(password(), '')
    typeInline(password(), 'next')
    expect(confirmation()).toHaveValue('')
  })

  test('supports the horizontal layout and custom labels', () => {
    const { container } = renderWithProviders(
      <PasswordConfirm onConfirm={vi.fn()} direction='horizontal' labelText='New one' btnText='Change it' />,
    )
    expect(container.querySelector('.horizontal')).toBeInTheDocument()
    typeInline(password(), 'secret')
    expect(screen.getByRole('button', { name: 'Change it' })).toBeInTheDocument()
    expect(screen.getByText('Confirm New one')).toBeInTheDocument()
  })
})

describe('WeChatInAppLoginBtn', () => {
  const inWeChat = { weChat: { isInWeChat: true } }
  const link = () => screen.getByText('WeChat').closest('a')

  test('renders nothing outside WeChat and does not fetch', () => {
    const { container } = renderWithProviders(<WeChatInAppLoginBtn />)
    expect(container).toBeEmptyDOMElement()
    expect(WeChatService.getWeChatInAppLoginUrl).not.toHaveBeenCalled()
  })

  test('links to the login url from the API', async () => {
    process.env.REACT_APP_PUBLIC_URL = 'https://admin.test'
    vi.mocked(WeChatService.getWeChatInAppLoginUrl).mockResolvedValue({ data: { auth_url: 'https://wx.test/auth' } })
    renderWithProviders(<WeChatInAppLoginBtn />, { state: inWeChat })
    await waitFor(() => expect(link()).toHaveAttribute('href', 'https://wx.test/auth'))
    expect(WeChatService.getWeChatInAppLoginUrl).toHaveBeenCalledWith(
      `https://admin.test${THIRD_PARTY_AUTH_URL_WE_CHAT}`,
      undefined,
    )
  })

  test('passes custom urls and label', async () => {
    vi.mocked(WeChatService.getWeChatInAppLoginUrl).mockResolvedValue({ data: { auth_url: 'https://wx.test/2' } })
    renderWithProviders(<WeChatInAppLoginBtn redirectUrl='/r' originUrl='/o' btnText='Scan' />, { state: inWeChat })
    await waitFor(() => expect(screen.getByText('Scan').closest('a')).toHaveAttribute('href', 'https://wx.test/2'))
    expect(WeChatService.getWeChatInAppLoginUrl).toHaveBeenCalledWith('/r', '/o')
  })

  test('reports a failure', async () => {
    vi.mocked(WeChatService.getWeChatInAppLoginUrl).mockRejectedValue(apiError('down'))
    renderWithProviders(<WeChatInAppLoginBtn />, { state: inWeChat })
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error when fetch login url down'))
  })

  test('stops loading after a failure', async () => {
    vi.mocked(WeChatService.getWeChatInAppLoginUrl).mockRejectedValue(apiError('down'))
    renderWithProviders(<WeChatInAppLoginBtn />, { state: inWeChat })
    await waitFor(() => expect(message.error).toHaveBeenCalled())
    await act(async () => undefined)
    expect(link()).not.toHaveClass('ant-btn-loading')
  })

  test('ignores a response or failure after unmounting', async () => {
    const ok = deferred<never>()
    const bad = deferred<never>()
    vi.mocked(WeChatService.getWeChatInAppLoginUrl).mockReturnValueOnce(ok.promise).mockReturnValueOnce(bad.promise)
    renderWithProviders(<WeChatInAppLoginBtn />, { state: inWeChat }).unmount()
    renderWithProviders(<WeChatInAppLoginBtn />, { state: inWeChat }).unmount()
    await act(async () => {
      ok.resolve({ data: { auth_url: 'late' } } as never)
      bad.reject(apiError('late'))
    })
    expect(message.error).not.toHaveBeenCalled()
  })
})
