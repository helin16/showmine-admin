import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { deferred, stubMatchMedia, typeInline } from '../../components/Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import CompanyNewChannelPage from '../../../Pages/Channel/CompanyNewChannelPage'
import ChannelScriptService from '../../../Services/ChannelScriptService'
import ChannelService from '../../../Services/ChannelService'
import { COMPANY_CHANNEL_NEW_URL, COMPANY_CHANNELS_URL } from '../../../UrlMap'

vi.mock('../../../Services/ChannelScriptService', () => ({ default: { getAll: vi.fn() } }))
vi.mock('../../../Services/ChannelService', () => ({ default: { create: vi.fn() } }))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

const wechat = { id: 's-1', name: 'WeChatOfficial', script: 'WeChatOfficial', authType: '' }
const wordpress = { id: 's-2', name: 'WordPress', script: 'WordPress', authType: '' }
const scripts = vi.mocked(ChannelScriptService)
const typeRow = 'ShowMine WeChat Official Account'

const renderPage = () =>
  renderWithProviders(
    <Routes>
      <Route path={COMPANY_CHANNELS_URL} element={<div>channels page</div>} />
      <Route path='*' element={<CompanyNewChannelPage />} />
    </Routes>,
    { route: COMPANY_CHANNEL_NEW_URL },
  )

beforeAll(() => stubMatchMedia())

test('asks for paged scripts, because /channelScript answers a bare array otherwise', async () => {
  scripts.getAll.mockResolvedValue({ data: [] } as never)
  renderPage()
  await waitFor(() =>
    expect(scripts.getAll).toHaveBeenCalledExactlyOnceWith({
      where: JSON.stringify({ isActive: true }),
      perPage: 9999,
      currentPage: 1,
    }),
  )
})

test('shows a spinner while loading', async () => {
  scripts.getAll.mockReturnValue(deferred<never>().promise)
  renderPage()
  await waitFor(() => expect(document.querySelector('.ant-spin-spinning')).toBeInTheDocument())
})

test('offers only scripts with a working editor', async () => {
  scripts.getAll.mockResolvedValue({ data: [wechat, wordpress] } as never)
  renderPage()
  expect(await screen.findByText(typeRow, { selector: '.ant-list-item-meta-title' })).toBeInTheDocument()
  expect(screen.queryByText('WordPress')).not.toBeInTheDocument()
  expect(document.querySelectorAll('.channel-list-item')).toHaveLength(1)
})

test('shows an empty list when the API has no usable script', async () => {
  scripts.getAll.mockResolvedValue({ data: [wordpress] } as never)
  renderPage()
  expect(await screen.findByText('No data')).toBeInTheDocument()
})

test('a load failure is an error and leaves the way back', async () => {
  scripts.getAll.mockRejectedValue(new Error('Network Error'))
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent('Error when getting channels: Network Error.')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.getByText('channels page')).toBeInTheDocument()
})

test('ignores a failure after leaving the page', async () => {
  const request = deferred<never>()
  scripts.getAll.mockReturnValue(request.promise)
  const { unmount, container } = renderPage()
  unmount()
  request.reject(new Error('late'))
  await request.promise.catch(() => undefined)
  expect(container).toBeEmptyDOMElement()
})

test('ignores a response after leaving the page', async () => {
  const request = deferred<never>()
  scripts.getAll.mockReturnValue(request.promise)
  const { unmount, container } = renderPage()
  unmount()
  request.resolve({ data: [wechat] } as never)
  await request.promise
  expect(container).toBeEmptyDOMElement()
})

test('picking a script connects a channel and returns to the channels page', async () => {
  scripts.getAll.mockResolvedValue({ data: [wechat] } as never)
  vi.mocked(ChannelService.create).mockResolvedValue({ id: 'ch-1' } as never)
  renderPage()
  fireEvent.click(await screen.findByText(typeRow, { selector: '.ant-list-item-meta-title' }))
  typeInline(screen.getByPlaceholderText(/Your own name/), 'Blog')
  fireEvent.click(screen.getByRole('button', { name: /Connect/ }))
  expect(await screen.findByText('channels page')).toBeInTheDocument()
  expect(ChannelService.create).toHaveBeenCalledExactlyOnceWith({ name: 'Blog', scriptId: 's-1' })
})

test('cancelling the form goes back to the list of types', async () => {
  scripts.getAll.mockResolvedValue({ data: [wechat] } as never)
  renderPage()
  fireEvent.click(await screen.findByText(typeRow, { selector: '.ant-list-item-meta-title' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(await screen.findByText(typeRow, { selector: '.ant-list-item-meta-title' })).toBeInTheDocument()
})
