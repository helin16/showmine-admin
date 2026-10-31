import React, { useState } from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import ArticlePublishBtn from '../../../Components/Article/ArticlePublishBtn'
import message from '../../../Components/Form/message'
import ArticleService from '../../../Services/ArticleService'
import ChannelService from '../../../Services/ChannelService'
import IChannel from '../../../Types/Channel/IChannel'
import { renderWithProviders } from '../../testUtils'
import { deferred, listOf, makeArticle, signedIn } from './fixtures'

vi.mock('../../../Services/ArticleService')
vi.mock('../../../Services/ChannelService')
vi.mock('../../../Components/Channel/ChannelIcon', () => ({ default: () => <i>icon</i> }))
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))

const articles = vi.mocked(ArticleService)
const channels = vi.mocked(ChannelService)
const FROZEN = new Date('2024-03-15T12:00:00.000Z')
const web = { id: 'ch-1', name: 'Web' } as IChannel
const wechat = { id: 'ch-2', name: 'WeChat' } as IChannel
const article = makeArticle()

const dialog = () => screen.getByRole('dialog')
const open = (name = /^publish$/i) => fireEvent.click(screen.getByRole('button', { name }))
const confirm = () => fireEvent.click(within(dialog()).getByRole('button', { name: /yes/i }))
const checkboxes = () => within(dialog()).getAllByRole('checkbox')
const rowCheckbox = (name: string) => within(dialog()).getByText(name).closest('tr')?.querySelector('input') as Element

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FROZEN)
  channels.getAll.mockResolvedValue(listOf([web, wechat]))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('ArticlePublishBtn', () => {
  test('renders nothing without an article', () => {
    const { container } = renderWithProviders(<ArticlePublishBtn />, { state: signedIn })
    expect(container).toBeEmptyDOMElement()
  })

  test('labels drafts Publish and published articles Re-Publish', async () => {
    const { unmount } = renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    expect(await screen.findByRole('button', { name: 'Publish' })).toBeInTheDocument()
    unmount()
    renderWithProviders(<ArticlePublishBtn article={makeArticle({ isPublished: true })} />, { state: signedIn })
    expect(await screen.findByRole('button', { name: 'Re-Publish' })).toBeInTheDocument()
  })

  test('shows custom children', () => {
    renderWithProviders(<ArticlePublishBtn article={article}>Go live</ArticlePublishBtn>, { state: signedIn })
    expect(screen.getByRole('button', { name: 'Go live' })).toBeInTheDocument()
  })

  test('does not load channels until the dialog opens', () => {
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    expect(channels.getAll).not.toHaveBeenCalled()
  })

  test('lists the channels with all of them selected', async () => {
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()

    expect(await within(dialog()).findByText('Web')).toBeInTheDocument()
    expect(within(dialog()).getByText('WeChat')).toBeInTheDocument()
    checkboxes().forEach((box) => expect(box).toBeChecked())
    expect(within(dialog()).getByText('2')).toBeInTheDocument()
  })

  test('publishes with the current time, user and every selected channel', async () => {
    const saved = makeArticle({ isPublished: true })
    articles.update.mockResolvedValue(saved)
    const onPublished = vi.fn()
    renderWithProviders(<ArticlePublishBtn article={article} onPublished={onPublished} />, { state: signedIn })
    open()
    await within(dialog()).findByText('Web')
    confirm()

    await waitFor(() => expect(onPublished).toHaveBeenCalledWith(saved))
    expect(articles.update).toHaveBeenCalledWith('art-1', {
      publishedAt: FROZEN.toISOString(),
      publishedById: 'user-1',
      selectedChannel: ['ch-1', 'ch-2'],
    })
    expect(message.success).toHaveBeenCalledWith(expect.stringContaining('Publish'))
  })

  test('works without an onPublished callback', async () => {
    articles.update.mockResolvedValue(article)
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    await within(dialog()).findByText('Web')
    confirm()
    await waitFor(() => expect(message.success).toHaveBeenCalled())
  })

  test('publishes only to the channels left selected', async () => {
    articles.update.mockResolvedValue(article)
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    await within(dialog()).findByText('Web')
    fireEvent.click(rowCheckbox('Web'))
    expect(within(dialog()).getByText('1')).toBeInTheDocument()
    confirm()

    await waitFor(() => expect(articles.update).toHaveBeenCalled())
    expect(articles.update.mock.calls[0][1].selectedChannel).toEqual(['ch-2'])
  })

  test('sends an empty channel list when everything is deselected', async () => {
    articles.update.mockResolvedValue(article)
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    await within(dialog()).findByText('Web')
    fireEvent.click(rowCheckbox('Web'))
    fireEvent.click(rowCheckbox('WeChat'))
    confirm()

    await waitFor(() => expect(articles.update).toHaveBeenCalled())
    expect(articles.update.mock.calls[0][1].selectedChannel).toEqual([])
  })

  test('reports a failure, keeps the dialog and allows a retry', async () => {
    articles.update.mockRejectedValue(new Error('nope'))
    const onPublished = vi.fn()
    renderWithProviders(<ArticlePublishBtn article={article} onPublished={onPublished} />, { state: signedIn })
    open()
    await within(dialog()).findByText('Web')
    confirm()

    await waitFor(() => expect(message.error).toHaveBeenCalledWith(expect.stringContaining('nope')))
    expect(onPublished).not.toHaveBeenCalled()
    await waitFor(() => expect(within(dialog()).getByRole('button', { name: /yes/i })).not.toHaveClass('ant-btn-loading'))
  })

  test('shows channel load errors in the dialog', async () => {
    channels.getAll.mockRejectedValue(new Error('channels down'))
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    expect(await within(dialog()).findByRole('alert')).toHaveTextContent('channels down')
    expect(within(dialog()).queryByRole('table')).not.toBeInTheDocument()
  })

  test('does not publish without a signed-in user', async () => {
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: { auth: { company: signedIn.auth.company } } })
    open()
    await within(dialog()).findByText('Web')
    confirm()
    expect(articles.update).not.toHaveBeenCalled()
  })

  test('does not publish an article that has no id', async () => {
    renderWithProviders(<ArticlePublishBtn article={makeArticle({ id: ' ' })} />, { state: signedIn })
    open()
    await within(dialog()).findByText('Web')
    confirm()
    expect(articles.update).not.toHaveBeenCalled()
  })

  test('does not load channels without a company', () => {
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: { auth: { user: signedIn.auth.user } } })
    open()
    expect(channels.getAll).not.toHaveBeenCalled()
  })

  test('cancel closes the dialog and ignores a channel reply that arrives late', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    channels.getAll.mockReturnValue(request.promise as never)
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    fireEvent.click(within(dialog()).getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    request.resolve(listOf([web]))
    await request.promise
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(articles.update).not.toHaveBeenCalled()
  })

  test('ignores a channel failure that arrives after cancel', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    channels.getAll.mockReturnValue(request.promise as never)
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    fireEvent.click(within(dialog()).getByRole('button', { name: /cancel/i }))
    request.reject(new Error('late'))
    await request.promise.catch(() => undefined)

    open()
    expect(screen.queryByText(/late/)).not.toBeInTheDocument()
  })

  test('closes the dialog when the parent passes a refreshed article', async () => {
    const Parent = () => {
      const [current, setCurrent] = useState(article)
      return (
        <>
          <button onClick={() => setCurrent(makeArticle({ isPublished: true }))}>refresh</button>
          <ArticlePublishBtn article={current} />
        </>
      )
    }
    renderWithProviders(<Parent />, { state: signedIn })
    open()
    fireEvent.click(screen.getByText('refresh'))
    expect(await screen.findByRole('button', { name: 'Re-Publish' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // Bug: the channel request sets channelLoading to false when it starts, so no spinner ever shows.
  test.fails('shows a spinner while channels load', async () => {
    channels.getAll.mockReturnValue(deferred<never>().promise)
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    await waitFor(() => expect(dialog().querySelector('.ant-spin-spinning')).toBeInTheDocument(), { timeout: 100 })
  })

  // Bug: confirm stays enabled while channels load, so a quick click publishes to no channels at all.
  test.fails('does not publish before the channels have loaded', async () => {
    channels.getAll.mockReturnValue(deferred<never>().promise)
    articles.update.mockResolvedValue(article)
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    confirm()
    expect(articles.update).not.toHaveBeenCalled()
  })

  // Bug: the English check-confirm-1 message uses {state.publishText}, which is never supplied, so the text is broken.
  test.fails('shows a readable confirmation sentence', async () => {
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: signedIn })
    open()
    await within(dialog()).findByText('Web')
    expect(within(dialog()).getByText(/Are you sure you want Publish the content/)).toBeInTheDocument()
  })

  // Bug: with no signed-in user the confirm button silently does nothing.
  test.fails('tells the user why publishing did not happen', async () => {
    renderWithProviders(<ArticlePublishBtn article={article} />, { state: { auth: { company: signedIn.auth.company } } })
    open()
    await within(dialog()).findByText('Web')
    confirm()
    expect(message.error).toHaveBeenCalled()
  })
})
