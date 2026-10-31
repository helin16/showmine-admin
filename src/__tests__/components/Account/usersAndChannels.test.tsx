import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import { apiError, deferred, stubMatchMedia, typeInline } from '../Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import UserAvatar from '../../../Components/User/UserAvatar'
import CompanyUserStats from '../../../Components/User/CompanyUserStats'
import CompanyUserList from '../../../Components/User/CompanyUserList'
import UserProfileEditor from '../../../Components/User/UserProfileEditor'
import ChannelIcon from '../../../Components/Channel/ChannelIcon'
import ChannelPopupEditor from '../../../Components/Channel/ChannelPopupEditor'
import CompanyChannelStats from '../../../Components/Channel/CompanyChannelStats'
import AuthService from '../../../Services/AuthService'
import ChannelService from '../../../Services/ChannelService'
import CompanyUserService from '../../../Services/CompanyUserService'
import message from '../../../Components/Form/message'
import Locale from '../../../Components/Form/Locale'
import { ROLE_ADMIN, ROLE_NON_ADMIN } from '../../../Types/Company/ICompanyUser'
import { COMPANY_CHANNELS_URL, COMPANY_USERS_URL } from '../../../UrlMap'

vi.mock('../../../Services/AuthService', () => ({ default: { updateMe: vi.fn() } }))
vi.mock('../../../Services/ChannelService', () => ({ default: { getAll: vi.fn() } }))
vi.mock('../../../Services/CompanyUserService', () => ({
  default: { getAll: vi.fn(), update: vi.fn(), deactivate: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../../../Components/Form/SingleImageUploader', () => ({
  default: ({ onChange, onSetIsSaving }: { onChange: (asset: object | null) => void; onSetIsSaving: (s: boolean) => void }) => (
    <div>
      <button onClick={() => onChange({ id: 'asset-1' })}>upload</button>
      <button onClick={() => onChange(null)}>remove</button>
      <button onClick={() => onSetIsSaving(true)}>start upload</button>
    </div>
  ),
}))
vi.mock('../../../Components/Form/Modal', () => ({
  default: ({ open, title, children, onCancel }: { open: boolean; title: string; children: React.ReactNode; onCancel: () => void }) =>
    open ? (
      <div role='dialog'>
        {title}
        {children}
        <button onClick={onCancel}>Close</button>
      </div>
    ) : null,
}))
vi.mock('../../../Components/Channel/ChannelEditor', () => ({
  default: ({ onSaved, onCancel }: { onSaved: (c: object) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onSaved({ id: 'new' })}>editor save</button>
      <button onClick={onCancel}>editor cancel</button>
    </div>
  ),
}))

beforeAll(() => stubMatchMedia())

describe('UserAvatar', () => {
  test('falls back to an icon without a user', () => {
    const { container } = render(<UserAvatar user={null} />)
    expect(container.querySelector('.anticon-user')).toBeInTheDocument()
  })

  test('shows the avatar image', () => {
    render(<UserAvatar user={{ AvatarAsset: { url: 'me.png' }, nickName: 'Me' } as never} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'me.png')
  })

  test('shows the nickname without an image', () => {
    render(<UserAvatar user={{ nickName: 'Me' } as never} size='small' />)
    expect(screen.getByText('Me')).toBeInTheDocument()
  })
})

describe.each([
  ['CompanyUserStats', CompanyUserStats, CompanyUserService, 'Users', COMPANY_USERS_URL],
  ['CompanyChannelStats', CompanyChannelStats, ChannelService, 'Channels', COMPANY_CHANNELS_URL],
])('%s', (_name, Stats, service, title, url) => {
  const params = { where: JSON.stringify({ isActive: true }), perPage: 1, currentPage: 1 }

  test('shows the total against an unlimited plan', async () => {
    vi.mocked(service.getAll).mockResolvedValue({ total: 7 } as never)
    renderWithProviders(<Stats />)
    expect(await screen.findByText('7')).toBeInTheDocument()
    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText('/ Unlimited')).toBeInTheDocument()
    expect(service.getAll).toHaveBeenCalledExactlyOnceWith(params)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('links through for a super admin', async () => {
    vi.mocked(service.getAll).mockResolvedValue({ total: 7 } as never)
    renderWithProviders(<Stats />, { state: { auth: { user: { isSuperAdmin: true } } } })
    await screen.findByText('7')
    expect(screen.getByRole('link')).toHaveAttribute('href', url)
  })

  test('reports a failure', async () => {
    vi.mocked(service.getAll).mockRejectedValue(apiError('down'))
    renderWithProviders(<Stats />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('down'))
  })
})

describe('CompanyUserList', () => {
  const zed = { id: 'cu-1', userId: 'u-1', isPending: false, role: ROLE_ADMIN, User: { nickName: 'Zed' } }
  const amy = { id: 'cu-2', userId: 'u-2', isPending: true, role: ROLE_NON_ADMIN, User: { nickName: 'Amy' } }
  const state = { auth: { user: { id: 'u-1' } } }
  const load = (data: object[] = [zed, amy]) =>
    vi.mocked(CompanyUserService.getAll).mockResolvedValue({ data } as never)
  const findName = (name: string) => screen.findByText(name, { selector: 'h4' })
  const row = async (name: string) => (await findName(name)).closest('.ant-list-item') as HTMLElement
  const confirmPopup = async () => fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))

  test('asks for the active users', async () => {
    load()
    renderWithProviders(<CompanyUserList />, { state })
    await findName('Amy')
    expect(CompanyUserService.getAll).toHaveBeenCalledExactlyOnceWith({
      where: JSON.stringify({ isActive: true }),
      include: 'User',
    })
  })

  // Known bug: the comparator never returns a negative number, so Array.sort leaves the list in API order.
  test.fails('sorts the users by nickname', async () => {
    load()
    const { container } = renderWithProviders(<CompanyUserList />, { state })
    await findName('Amy')
    const names = [...container.querySelectorAll('.ant-list-item-meta-title')].map((el) => el.textContent)
    expect(names).toEqual(['Amy', 'Zed'])
  })

  test('protects the current user from changes', async () => {
    load()
    renderWithProviders(<CompanyUserList />, { state })
    const mine = await row('Zed')
    expect(within(mine).getByRole('switch')).toBeDisabled()
    expect(within(mine).queryByRole('button', { name: /Approve/ })).not.toBeInTheDocument()
    expect(within(mine).getByText('delete').closest('button')).toHaveStyle({ visibility: 'hidden' })
  })

  test('treats everyone as the current user when nobody is signed in', async () => {
    load()
    renderWithProviders(<CompanyUserList />)
    expect(within(await row('Amy')).getByRole('switch')).toBeDisabled()
  })

  test('approves a pending user and reloads', async () => {
    load()
    vi.mocked(CompanyUserService.update).mockResolvedValue({} as never)
    renderWithProviders(<CompanyUserList />, { state })
    fireEvent.click(within(await row('Amy')).getByRole('button', { name: /Approve/ }))
    await confirmPopup()
    expect(CompanyUserService.update).toHaveBeenCalledExactlyOnceWith('cu-2', { isPending: false })
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('User (Amy) updated.'))
    await waitFor(() => expect(CompanyUserService.getAll).toHaveBeenCalledTimes(2))
  })

  test.each([
    ['promotes', amy, ROLE_ADMIN],
    ['demotes', { ...amy, role: ROLE_ADMIN }, ROLE_NON_ADMIN],
  ])('%s a user with the admin switch', async (_name, member, role) => {
    load([member])
    vi.mocked(CompanyUserService.update).mockResolvedValue({} as never)
    renderWithProviders(<CompanyUserList />, { state })
    fireEvent.click(within(await row('Amy')).getByRole('switch'))
    expect(CompanyUserService.update).toHaveBeenCalledExactlyOnceWith('cu-2', { role })
    await waitFor(() => expect(CompanyUserService.getAll).toHaveBeenCalledTimes(2))
  })

  test('reports a failed update', async () => {
    load()
    vi.mocked(CompanyUserService.update).mockRejectedValue(apiError('denied'))
    renderWithProviders(<CompanyUserList />, { state })
    fireEvent.click(within(await row('Amy')).getByRole('switch'))
    await waitFor(() =>
      expect(message.error).toHaveBeenCalledWith('Error Ocurred when updating User (Amy): denied'),
    )
  })

  test('removes a user and reloads', async () => {
    load()
    vi.mocked(CompanyUserService.deactivate).mockResolvedValue({} as never)
    renderWithProviders(<CompanyUserList />, { state })
    fireEvent.click(within(await row('Amy')).getByText('delete'))
    await confirmPopup()
    expect(CompanyUserService.deactivate).toHaveBeenCalledExactlyOnceWith('cu-2')
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('User (Amy) removed.'))
    await waitFor(() => expect(CompanyUserService.getAll).toHaveBeenCalledTimes(2))
  })

  test('reports a failed removal', async () => {
    load()
    vi.mocked(CompanyUserService.deactivate).mockRejectedValue(apiError('denied'))
    renderWithProviders(<CompanyUserList />, { state })
    fireEvent.click(within(await row('Amy')).getByText('delete'))
    await confirmPopup()
    await waitFor(() =>
      expect(message.error).toHaveBeenCalledWith('Error Ocurred when removing User (Amy): denied'),
    )
  })

  test('skips changes for a member without an id', async () => {
    load([{ ...amy, id: undefined }])
    renderWithProviders(<CompanyUserList />, { state })
    const noId = await row('Amy')
    fireEvent.click(within(noId).getByRole('switch'))
    fireEvent.click(within(noId).getByText('delete'))
    await confirmPopup()
    expect(CompanyUserService.update).not.toHaveBeenCalled()
    expect(CompanyUserService.deactivate).not.toHaveBeenCalled()
  })

  test('reports a load failure', async () => {
    vi.mocked(CompanyUserService.getAll).mockRejectedValue({ data: { message: 'down' } })
    renderWithProviders(<CompanyUserList />, { state })
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('down'))
  })

  test('ignores a late failure after unmounting', async () => {
    const pending = deferred<never>()
    vi.mocked(CompanyUserService.getAll).mockReturnValue(pending.promise)
    renderWithProviders(<CompanyUserList />, { state }).unmount()
    await act(async () => pending.reject({ data: { message: 'late' } }))
    expect(message.error).not.toHaveBeenCalled()
  })
})

describe('UserProfileEditor', () => {
  const user = { id: 'u-1', nickName: 'Me', firstName: 'A', lastName: 'B', email: 'a@b.co', mobile: '1', languageCode: 'en' }
  const renderEditor = (props = user) => renderWithProviders(<UserProfileEditor user={props as never} />, {
    state: { auth: { user: props, company: { id: 'co-1' } } } as never,
  })

  test.each([
    ['The name that will shown to public', 'nickName'],
    ['First Name', 'firstName'],
    ['Last Name', 'lastName'],
    ['The email address', 'email'],
    ['Mobile number, like +1 232 323 232', 'mobile'],
  ])('editing "%s" saves %s and refreshes the session', async (placeholder, field) => {
    const updated = { ...user, [field]: 'new' }
    vi.mocked(AuthService.updateMe).mockResolvedValue({ user: updated } as never)
    const { store } = renderEditor()
    typeInline(screen.getByPlaceholderText(placeholder), 'new')
    expect(AuthService.updateMe).toHaveBeenCalledExactlyOnceWith({ [field]: 'new' })
    await waitFor(() => expect(store.getState().auth.user).toEqual(updated))
    expect(store.getState().auth.company).toEqual({ id: 'co-1' })
    expect(message.success).toHaveBeenCalledWith('Profile updated.')
  })

  test('renders blanks for a sparse profile', () => {
    renderEditor({ id: 'u-1' } as never)
    expect(screen.getByPlaceholderText('First Name')).toHaveValue('')
  })

  test('changing the language saves it and switches the app locale', async () => {
    vi.mocked(AuthService.updateMe).mockResolvedValue({ user: { ...user, languageCode: Locale.zhCN.locale } } as never)
    const { store } = renderEditor()
    fireEvent.click(screen.getByRole('radio', { name: /中文/ }))
    expect(AuthService.updateMe).toHaveBeenCalledExactlyOnceWith({ languageCode: Locale.zhCN.locale })
    await waitFor(() => expect(store.getState().app.locale).toBe(Locale.zhCN))
  })

  test('keeps English when the saved language is English', async () => {
    vi.mocked(AuthService.updateMe).mockResolvedValue({ user } as never)
    const { store } = renderEditor()
    fireEvent.click(screen.getByText('upload'))
    await waitFor(() => expect(message.success).toHaveBeenCalled())
    expect(store.getState().app.locale).toBe(Locale.enUS)
  })

  test('saves and clears the avatar', () => {
    vi.mocked(AuthService.updateMe).mockReturnValue(new Promise(() => undefined))
    renderEditor()
    fireEvent.click(screen.getByText('upload'))
    expect(AuthService.updateMe).toHaveBeenLastCalledWith({ avatarAssetId: 'asset-1' })
    fireEvent.click(screen.getByText('remove'))
    expect(AuthService.updateMe).toHaveBeenLastCalledWith({ avatarAssetId: null })
  })

  test('shows the spinner during an upload', async () => {
    const { container } = renderEditor()
    fireEvent.click(screen.getByText('start upload'))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
  })

  test('changes the password through the confirm form', () => {
    vi.mocked(AuthService.updateMe).mockReturnValue(new Promise(() => undefined))
    renderEditor()
    typeInline(screen.getByPlaceholderText('Password'), 'secret')
    typeInline(screen.getByPlaceholderText('Confirm Password'), 'secret')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(AuthService.updateMe).toHaveBeenCalledExactlyOnceWith({ password: 'secret' })
  })

  test('reports a failed save and leaves the session alone', async () => {
    vi.mocked(AuthService.updateMe).mockRejectedValue(apiError('taken'))
    const { store, container } = renderEditor()
    typeInline(screen.getByPlaceholderText('The email address'), 'x@y.co')
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('taken'))
    expect(store.getState().auth.user).toEqual(user)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })
})

describe('ChannelIcon', () => {
  test.each([
    ['Facebook', '.anticon-facebook'],
    ['Google', '.anticon-google-square'],
    ['Twitter', '.anticon-twitter-square'],
    ['LinkedIn', '.anticon-linkedin'],
    ['WordPress', '[data-icon="wordpress"]'],
  ])('shows the %s icon', (type, selector) => {
    const { container } = render(<ChannelIcon channel={{ type }} />)
    expect(container.querySelector(selector)).toBeInTheDocument()
    expect(container.querySelector(`.${type.toLowerCase()}`)).toBeInTheDocument()
  })

  test('falls back to the app logo', () => {
    const { container } = render(<ChannelIcon channel={{ type: 'Showmine' }} />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/img/logo-1.png')
  })
})

describe('ChannelPopupEditor', () => {
  const open = () => fireEvent.click(screen.getByText('open me'))

  test('is closed until its child is clicked', () => {
    renderWithProviders(<ChannelPopupEditor>open me</ChannelPopupEditor>)
    expect(screen.queryByText('Creating a Channel:')).not.toBeInTheDocument()
    open()
    expect(screen.getByText('Creating a Channel:')).toBeInTheDocument()
  })

  test('titles an existing channel by name', () => {
    renderWithProviders(<ChannelPopupEditor channel={{ id: 'c-1', name: 'Blog' } as never}>open me</ChannelPopupEditor>)
    open()
    expect(screen.getByText('Editing Blog:')).toBeInTheDocument()
  })

  test('closes on cancel', () => {
    renderWithProviders(<ChannelPopupEditor>open me</ChannelPopupEditor>)
    open()
    fireEvent.click(screen.getByText('editor cancel'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('closes the modal from its own close button', () => {
    renderWithProviders(<ChannelPopupEditor>open me</ChannelPopupEditor>)
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('closes after saving and passes the channel on', () => {
    const onSaved = vi.fn()
    renderWithProviders(<ChannelPopupEditor onSaved={onSaved}>open me</ChannelPopupEditor>)
    open()
    fireEvent.click(screen.getByText('editor save'))
    expect(onSaved).toHaveBeenCalledWith({ id: 'new' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('saving works without a callback', () => {
    renderWithProviders(<ChannelPopupEditor>open me</ChannelPopupEditor>)
    open()
    fireEvent.click(screen.getByText('editor save'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
