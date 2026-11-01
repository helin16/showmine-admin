import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import { apiError, deferred, stubMatchMedia, typeInline } from '../Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import ChannelEditor from '../../../Components/Channel/ChannelEditor'
import ChannelIcon from '../../../Components/Channel/ChannelIcon'
import ChannelList from '../../../Components/Channel/ChannelList'
import ShowMineChannelEditor from '../../../Components/Channel/Wizard/ShowMineChannelEditor'
import message from '../../../Components/Form/message'
import ChannelService from '../../../Services/ChannelService'

vi.mock('../../../Services/ChannelService', () => ({
  default: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

const blog = { id: 'ch-1', name: 'Blog', scriptId: 's-1', isOnBoarded: false, companyId: 'co-1' }
const main = { id: 'ch-2', name: 'Main WeChatChannel', scriptId: 's-1', isOnBoarded: true, companyId: 'co-1' }
const services = vi.mocked(ChannelService)
const nameInput = () => screen.getByPlaceholderText(/Your own name/)
const listOf = (data: object[]) => ({ data } as never)
// A network failure has no response, which the old `err.response.data.message` crashed on.
const offline = new Error('Network Error')

beforeAll(() => stubMatchMedia())

describe('ChannelList', () => {
  test('asks for every active channel: the API hides nothing itself and pages by 10', async () => {
    services.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<ChannelList />)
    await waitFor(() =>
      expect(services.getAll).toHaveBeenCalledExactlyOnceWith({
        where: JSON.stringify({ isActive: true }),
        perPage: 9999,
        currentPage: 1,
        sort: 'name:ASC',
      }),
    )
  })

  test('shows a spinner while loading', async () => {
    services.getAll.mockReturnValue(deferred<never>().promise)
    renderWithProviders(<ChannelList />)
    await waitFor(() => expect(document.querySelector('.ant-spin-spinning')).toBeInTheDocument())
  })

  test('lists channels without crashing on the API shape, which has no channel type', async () => {
    services.getAll.mockResolvedValue(listOf([blog]))
    renderWithProviders(<ChannelList />)
    expect(await screen.findByText('Blog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument()
  })

  test('shows an empty list', async () => {
    services.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<ChannelList />)
    expect(await screen.findByText('No data')).toBeInTheDocument()
  })

  test('a load failure is an error, not an empty list', async () => {
    services.getAll.mockRejectedValue(offline)
    renderWithProviders(<ChannelList />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Error when getting channels: Network Error.')
    expect(screen.queryByText('No data')).not.toBeInTheDocument()
  })

  test.each([
    ['response', (request: ReturnType<typeof deferred<never>>) => request.resolve(listOf([blog]))],
    ['failure', (request: ReturnType<typeof deferred<never>>) => request.reject(offline)],
  ])('ignores a %s after unmounting', async (_name, settle) => {
    const request = deferred<never>()
    services.getAll.mockReturnValue(request.promise)
    const { container, unmount } = renderWithProviders(<ChannelList />)
    unmount()
    settle(request)
    await request.promise.catch(() => undefined)
    expect(container).toBeEmptyDOMElement()
  })

  const deleteBlog = async () => {
    fireEvent.click(await screen.findByRole('button', { name: /Delete/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))
  }

  test('asks before deleting, then removes the channel from the list', async () => {
    services.getAll.mockResolvedValue(listOf([blog]))
    services.deactivate.mockResolvedValue({ id: 'ch-1' } as never)
    renderWithProviders(<ChannelList />)
    expect(await screen.findByText('Blog')).toBeInTheDocument()
    expect(services.deactivate).not.toHaveBeenCalled()
    await deleteBlog()
    await waitFor(() => expect(screen.queryByText('Blog')).not.toBeInTheDocument())
    expect(services.deactivate).toHaveBeenCalledExactlyOnceWith('ch-1')
    expect(message.success).toHaveBeenCalledWith('Channel Blog deleted.')
  })

  test('a failed delete keeps the channel and survives a network error', async () => {
    services.getAll.mockResolvedValue(listOf([blog]))
    services.deactivate.mockRejectedValue(offline)
    renderWithProviders(<ChannelList />)
    await deleteBlog()
    await waitFor(() =>
      expect(message.error).toHaveBeenCalledWith('Error when deleting Channel Blog: Network Error.'),
    )
    expect(screen.getByText('Blog')).toBeInTheDocument()
  })

  test('the main channel cannot be deleted', async () => {
    services.getAll.mockResolvedValue(listOf([main]))
    renderWithProviders(<ChannelList />)
    expect(await screen.findByText('Main WeChatChannel')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
  })

  test('renaming a channel updates its row and leaves the others', async () => {
    services.getAll.mockResolvedValue(listOf([blog, main]))
    services.update.mockResolvedValue({ ...blog, name: 'News' } as never)
    renderWithProviders(<ChannelList />)
    fireEvent.click(await screen.findByText('Blog'))
    const dialog = await screen.findByRole('dialog')
    typeInline(within(dialog).getByPlaceholderText(/Your own name/), 'News')
    fireEvent.click(within(dialog).getByRole('button', { name: /Save/ }))
    expect(await screen.findByText('News')).toBeInTheDocument()
    expect(screen.getByText('Main WeChatChannel')).toBeInTheDocument()
    expect(services.update).toHaveBeenCalledExactlyOnceWith('ch-1', { name: 'News' })
  })
})

describe('ChannelEditor', () => {
  test('needs a channel', () => {
    const { container } = renderWithProviders(<ChannelEditor />)
    expect(container).toBeEmptyDOMElement()
  })

  test('edits the channel it is given', () => {
    renderWithProviders(<ChannelEditor channel={blog} />)
    expect(nameInput()).toHaveValue('Blog')
  })
})

describe('ShowMineChannelEditor', () => {
  const save = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))
  const fresh = { name: '', scriptId: 's-1' }

  test('a name is required: nothing is saved without one', () => {
    renderWithProviders(<ShowMineChannelEditor channel={fresh} />)
    typeInline(nameInput(), '   ')
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    save(/Connect/)
    expect(services.create).not.toHaveBeenCalled()
  })

  test('clicking Connect on an untouched form reports the missing name', () => {
    renderWithProviders(<ShowMineChannelEditor channel={fresh} />)
    save(/Connect/)
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    typeInline(nameInput(), 'Blog')
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  test('creates with only the fields the API needs', async () => {
    const onSaved = vi.fn()
    services.create.mockResolvedValue(blog as never)
    renderWithProviders(<ShowMineChannelEditor channel={fresh} onSaved={onSaved} />)
    typeInline(nameInput(), ' Blog ')
    save(/Connect/)
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(blog))
    expect(services.create).toHaveBeenCalledExactlyOnceWith({ name: 'Blog', scriptId: 's-1' })
    expect(message.success).toHaveBeenCalledWith('Channel connected successfully.')
  })

  test('updating sends only the name, never the stored settings', async () => {
    services.update.mockResolvedValue(blog as never)
    renderWithProviders(<ShowMineChannelEditor channel={{ ...blog, settings: { auth: {} } } as never} />)
    save(/Save/)
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Channel Blog updated.'))
    expect(services.update).toHaveBeenCalledExactlyOnceWith('ch-1', { name: 'Blog' })
  })

  test('a failed create reports the error and can be retried', async () => {
    services.create.mockRejectedValue(offline)
    renderWithProviders(<ShowMineChannelEditor channel={{ ...fresh, name: 'Blog' }} />)
    save(/Connect/)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error when connecting: Network Error'))
    await waitFor(() => expect(screen.getByRole('button', { name: /Connect/ })).not.toHaveClass('ant-btn-loading'))
  })

  test('a failed update shows the API message', async () => {
    services.update.mockRejectedValue(apiError('nope'))
    renderWithProviders(<ShowMineChannelEditor channel={blog} />)
    save(/Save/)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error when updating Channel Blog: nope.'))
  })

  test('cancel is only offered with a handler', () => {
    const onCancel = vi.fn()
    const { unmount } = renderWithProviders(<ShowMineChannelEditor channel={fresh} />)
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    unmount()
    renderWithProviders(<ShowMineChannelEditor channel={fresh} onCancel={onCancel} />)
    save(/Cancel/)
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

test('ChannelIcon falls back to the app logo for a channel without a type', () => {
  const { container } = render(<ChannelIcon channel={blog} />)
  expect(container.querySelector('img')).toHaveAttribute('src', '/img/logo-1.png')
})
