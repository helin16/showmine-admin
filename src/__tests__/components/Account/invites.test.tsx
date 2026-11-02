import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import { apiError, stubMatchMedia, type } from '../Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import CompanyUserInvitePanel from '../../../Components/User/CompanyUserInvitePanel'
import CompanyUserPendingList from '../../../Components/User/CompanyUserPendingList'
import CompanyUserService from '../../../Services/CompanyUserService'
import Locale from '../../../Components/Form/Locale'
import message from '../../../Components/Form/message'
import { messages } from '../../../i18n/messages'

vi.mock('../../../Services/CompanyUserService', () => ({
  default: { getAll: vi.fn(), invite: vi.fn(), getInviteQr: vi.fn(), getPending: vi.fn(), approve: vi.fn(), reject: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('qrcode.react', () => ({ QRCodeCanvas: ({ value }: { value: string }) => <div>qr for {value}</div> }))

beforeAll(() => stubMatchMedia())

describe('CompanyUserInvitePanel', () => {
  test('replaces the invite form when the plan is full', async () => {
    vi.mocked(CompanyUserService.getAll).mockResolvedValue({ total: 1 } as never)
    renderWithProviders(<CompanyUserInvitePanel />, { state: { auth: { company: { maxUsers: 1 } } } })
    expect(await screen.findByText(/Your plan allows 1 user\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Send invite/ })).not.toBeInTheDocument()
  })

  test('keeps the invite form while the plan has room', async () => {
    vi.mocked(CompanyUserService.getAll).mockResolvedValue({ total: 3 } as never)
    renderWithProviders(<CompanyUserInvitePanel />, { state: { auth: { company: { maxUsers: 10 } } } })
    await waitFor(() => expect(CompanyUserService.getAll).toHaveBeenCalled())
    expect(screen.queryByText(/Your plan allows/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument()
  })

  const email = () => screen.getByRole('textbox', { name: 'Email' })
  const sendBtn = () => screen.getByRole('button', { name: /Send invite/ })

  test('sends the invite, says so neutrally, and clears the field', async () => {
    vi.mocked(CompanyUserService.invite).mockResolvedValue({ success: true })
    renderWithProviders(<CompanyUserInvitePanel />)
    type(email(), 'amy@example.com')
    fireEvent.click(sendBtn())
    await waitFor(() =>
      expect(CompanyUserService.invite).toHaveBeenCalledExactlyOnceWith('amy@example.com'),
    )
    await waitFor(() =>
      expect(message.success).toHaveBeenCalledWith(
        'If amy@example.com is not in this company yet, an invite is on its way.',
      ),
    )
    await waitFor(() => expect(email()).toHaveValue(''))
  })

  test('checks the address first', async () => {
    renderWithProviders(<CompanyUserInvitePanel />)
    type(email(), 'nope')
    fireEvent.click(sendBtn())
    expect(await screen.findByText('Please provide a valid email address.')).toBeInTheDocument()
    expect(CompanyUserService.invite).not.toHaveBeenCalled()
  })

  test('reports a failure and keeps the address', async () => {
    vi.mocked(CompanyUserService.invite).mockRejectedValue(apiError('not set up'))
    renderWithProviders(<CompanyUserInvitePanel />)
    type(email(), 'amy@example.com')
    fireEvent.click(sendBtn())
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('not set up'))
    expect(email()).toHaveValue('amy@example.com')
  })

  test('shows the QR code and how long it lasts', async () => {
    vi.mocked(CompanyUserService.getInviteQr).mockResolvedValue({ url: 'https://wx/q', expiresInSeconds: 900 })
    renderWithProviders(<CompanyUserInvitePanel />)
    fireEvent.click(screen.getByRole('button', { name: /WeChat QR code/ }))
    expect(await screen.findByText('qr for https://wx/q')).toBeInTheDocument()
    expect(screen.getByText(/works for 15 minutes/)).toBeInTheDocument()
  })

  test('reports a QR failure', async () => {
    vi.mocked(CompanyUserService.getInviteQr).mockRejectedValue(apiError('WeChat request failed.'))
    renderWithProviders(<CompanyUserInvitePanel />)
    fireEvent.click(screen.getByRole('button', { name: /WeChat QR code/ }))
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('WeChat request failed.'))
    expect(screen.queryByText(/works for/)).not.toBeInTheDocument()
  })
})

describe('CompanyUserPendingList', () => {
  const amy = { id: 'cu-1', createdAt: '2026-11-01', User: { nickName: 'Amy', email: 'amy@example.com' } }
  const named = { id: 'cu-2', createdAt: '2026-11-01', User: { nickName: '', firstName: 'Bo', lastName: 'Li' } }
  const scanned = { id: 'cu-3', createdAt: '2026-11-01', User: { nickName: '', firstName: '', lastName: '' } }
  const load = (rows: object[] = [amy]) => vi.mocked(CompanyUserService.getPending).mockResolvedValue(rows as never)
  const row = async (name: string) => (await screen.findByText(name)).closest('.ant-list-item') as HTMLElement

  test('names people by nickname, then name, then email, then as a WeChat user', async () => {
    load([amy, named, scanned, { ...amy, id: 'cu-4', User: { email: 'only@example.com' } }])
    renderWithProviders(<CompanyUserPendingList onChanged={vi.fn()} />)
    expect(await screen.findByText('Amy')).toBeInTheDocument()
    expect(screen.getByText('Bo Li')).toBeInTheDocument()
    expect(screen.getByText('WeChat user')).toBeInTheDocument()
    expect(screen.getAllByText('only@example.com').length).toBeGreaterThan(0)
  })

  test('says when nobody is waiting', async () => {
    load([])
    renderWithProviders(<CompanyUserPendingList onChanged={vi.fn()} />)
    expect(await screen.findByText('Nobody is waiting for approval.')).toBeInTheDocument()
  })

  test('approves, reloads, and tells the page', async () => {
    load()
    vi.mocked(CompanyUserService.approve).mockResolvedValue({ success: true })
    const onChanged = vi.fn()
    renderWithProviders(<CompanyUserPendingList onChanged={onChanged} />)
    fireEvent.click(within(await row('Amy')).getByRole('button', { name: /Approve/ }))
    await waitFor(() => expect(CompanyUserService.approve).toHaveBeenCalledExactlyOnceWith('cu-1'))
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Amy can now use this company.'))
    expect(onChanged).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(CompanyUserService.getPending).toHaveBeenCalledTimes(2))
  })

  test('rejects only after confirming', async () => {
    load()
    vi.mocked(CompanyUserService.reject).mockResolvedValue({ success: true })
    renderWithProviders(<CompanyUserPendingList onChanged={vi.fn()} />)
    fireEvent.click(within(await row('Amy')).getByRole('button', { name: /Reject/ }))
    expect(CompanyUserService.reject).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))
    await waitFor(() => expect(CompanyUserService.reject).toHaveBeenCalledExactlyOnceWith('cu-1'))
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Amy\'s request was rejected.'))
  })

  test('reports a failed decision and keeps the page as it was', async () => {
    load()
    vi.mocked(CompanyUserService.approve).mockRejectedValue(apiError('gone'))
    const onChanged = vi.fn()
    renderWithProviders(<CompanyUserPendingList onChanged={onChanged} />)
    fireEvent.click(within(await row('Amy')).getByRole('button', { name: /Approve/ }))
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('gone'))
    expect(onChanged).not.toHaveBeenCalled()
  })

  test('reports a failed load', async () => {
    vi.mocked(CompanyUserService.getPending).mockRejectedValue(apiError('down'))
    renderWithProviders(<CompanyUserPendingList onChanged={vi.fn()} />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('down'))
  })

  test('refreshes on request, for people who just scanned', async () => {
    load([])
    renderWithProviders(<CompanyUserPendingList onChanged={vi.fn()} />)
    await screen.findByText('Nobody is waiting for approval.')
    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }))
    await waitFor(() => expect(CompanyUserService.getPending).toHaveBeenCalledTimes(2))
  })

  test('has Chinese text', async () => {
    load([])
    renderWithProviders(<CompanyUserPendingList onChanged={vi.fn()} />, { state: { app: { locale: Locale.zhCN } } })
    expect(await screen.findByText(messages[Locale.zhCN.locale]['pending-none'])).toBeInTheDocument()
  })
})
