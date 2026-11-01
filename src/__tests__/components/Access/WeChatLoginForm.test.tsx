import React from 'react'
import { act, fireEvent, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { apiError, stubMatchMedia } from './domHelpers'
import { renderWithProviders } from '../../testUtils'
import WeChatLoginForm from '../../../Components/Auth/WeChatLoginForm'
import AuthService from '../../../Services/AuthService'
import WeChatService from '../../../Services/WeChatService'
import message from '../../../Components/Form/message'
import { BACK_END_URL } from '../../../UrlMap'

vi.mock('../../../Services/WeChatService', () => ({
  default: { getLoginQrCodeUrl: vi.fn(), getUserFromQrcode: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('qrcode.react', () => ({ default: ({ value }: { value: string }) => <div>qr:{value}</div> }))

const qr = { url: 'https://wx.test/qr', token: 'login-token' }
const waiting = { userId: null, error: null, token: '' }

const renderForm = () =>
  renderWithProviders(
    <Routes>
      <Route path={BACK_END_URL} element={<div>backend</div>} />
      <Route path='*' element={<WeChatLoginForm />} />
    </Routes>,
    { route: '/login' },
  )

const flush = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms))
const refresh = () => screen.getByRole('button', { name: 'Refresh' })

beforeAll(() => stubMatchMedia())
beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(WeChatService.getLoginQrCodeUrl).mockResolvedValue(qr)
})
afterEach(() => {
  vi.useRealTimers()
})

test('shows a placeholder until the QR code arrives', async () => {
  vi.mocked(WeChatService.getLoginQrCodeUrl).mockReturnValue(new Promise(() => undefined))
  const { container } = renderForm()
  await flush()
  expect(container.querySelector('.ant-skeleton')).toBeInTheDocument()
  expect(WeChatService.getUserFromQrcode).not.toHaveBeenCalled()
})

test('shows the QR code, then polls with the login token every second', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValue(waiting)
  renderForm()
  await flush()
  expect(screen.getByText(`qr:${qr.url}`)).toBeInTheDocument()
  expect(WeChatService.getUserFromQrcode).not.toHaveBeenCalled()
  await flush(1000)
  expect(WeChatService.getUserFromQrcode).toHaveBeenCalledExactlyOnceWith(qr.token)
  await flush(1000)
  expect(WeChatService.getUserFromQrcode).toHaveBeenCalledTimes(2)
})

test('stores the token and enters the backend once scanned', async () => {
  vi.mocked(WeChatService.getUserFromQrcode)
    .mockResolvedValueOnce(waiting)
    .mockResolvedValueOnce({ userId: 'u-1', error: null, token: ' user-token ' })
  renderForm()
  await flush()
  await flush(2000)
  expect(screen.getByText('backend')).toBeInTheDocument()
  expect(AuthService.getLocalAuthToken()).toBe('user-token')
})

test('offers a refresh after three minutes without a scan', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValue(waiting)
  renderForm()
  await flush()
  await flush(180 * 1000)
  expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument()
  await flush(1000)
  expect(refresh()).toBeInTheDocument()
  expect(WeChatService.getUserFromQrcode).toHaveBeenCalledTimes(181)
})

test('reports a scan error and refresh loads a new QR code', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValueOnce({ ...waiting, error: { message: 'Expired' } })
  renderForm()
  await flush()
  await flush(1000)
  expect(message.error).toHaveBeenCalledWith('Expired')

  vi.mocked(WeChatService.getLoginQrCodeUrl).mockResolvedValue({ url: 'https://wx.test/qr2', token: 'token-2' })
  vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValue(waiting)
  fireEvent.click(refresh())
  await flush()
  expect(screen.getByText('qr:https://wx.test/qr2')).toBeInTheDocument()
  await flush(1000)
  expect(WeChatService.getUserFromQrcode).toHaveBeenLastCalledWith('token-2')
})

test('uses a generic message for a scan error without text', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValue({ ...waiting, error: {} })
  renderForm()
  await flush()
  await flush(1000)
  expect(message.error).toHaveBeenCalledWith('Error Occurred')
})

test('offers a refresh when the user id came back with no token', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValue({ ...waiting, userId: 'u-1' })
  renderForm()
  await flush()
  await flush(1000)
  expect(refresh()).toBeInTheDocument()
  expect(message.error).not.toHaveBeenCalled()
})

test('offers a refresh when the API returns no QR url', async () => {
  vi.mocked(WeChatService.getLoginQrCodeUrl).mockResolvedValue({})
  renderForm()
  await flush()
  await flush(5000)
  expect(refresh()).toBeInTheDocument()
  expect(WeChatService.getUserFromQrcode).not.toHaveBeenCalled()
})

test('reports a failure to load the QR code', async () => {
  vi.mocked(WeChatService.getLoginQrCodeUrl).mockRejectedValue(apiError('qr down'))
  renderForm()
  await flush()
  expect(message.error).toHaveBeenCalledWith('qr down')
})

test('reports a polling failure', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockRejectedValue(apiError('poll down'))
  renderForm()
  await flush()
  await flush(1000)
  expect(message.error).toHaveBeenCalledWith('poll down')
})

test('offers a refresh after a polling failure', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockRejectedValue(apiError('poll down'))
  renderForm()
  await flush()
  await flush(1000)
  expect(refresh()).toBeInTheDocument()
})

test('ignores results that arrive after leaving the page', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValue({ ...waiting, token: 'late' })
  const { unmount } = renderForm()
  await flush()
  unmount()
  await flush(1000)
  expect(AuthService.getLocalAuthToken()).toBeNull()
})

test('ignores a QR response or poll failure that arrives after leaving the page', async () => {
  vi.mocked(WeChatService.getLoginQrCodeUrl).mockRejectedValue(apiError('late'))
  renderForm().unmount()
  await flush()
  expect(message.error).not.toHaveBeenCalled()

  vi.mocked(WeChatService.getLoginQrCodeUrl).mockResolvedValue(qr)
  vi.mocked(WeChatService.getUserFromQrcode).mockRejectedValue(apiError('late'))
  const second = renderForm()
  await flush()
  second.unmount()
  await flush(1000)
  expect(message.error).not.toHaveBeenCalled()
})

test('sends no poll request after leaving the page', async () => {
  vi.mocked(WeChatService.getUserFromQrcode).mockResolvedValue(waiting)
  const { unmount } = renderForm()
  await flush()
  unmount()
  await flush(1000)
  expect(WeChatService.getUserFromQrcode).not.toHaveBeenCalled()
})
