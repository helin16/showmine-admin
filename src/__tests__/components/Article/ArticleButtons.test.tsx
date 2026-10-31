import React from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import ArticleDeleteBtn from '../../../Components/Article/Buttons/ArticleDeleteBtn'
import ArticleHistoryBtn from '../../../Components/Article/Buttons/ArticleHistoryBtn'
import ArticleMoreOptionsBtn from '../../../Components/Article/Buttons/ArticleMoreOptionsBtn'
import ArticlePreviewBtn from '../../../Components/Article/Buttons/ArticlePreviewBtn'
import ArticleStatsBtn from '../../../Components/Article/Buttons/ArticleStatsBtn'
import ArticleSyncBtn from '../../../Components/Article/Buttons/ArticleSyncBtn'
import ArticleUnPublishBtn from '../../../Components/Article/Buttons/ArticleUnPublishBtn'
import message from '../../../Components/Form/message'
import ArticleService from '../../../Services/ArticleService'
import { LOCALES } from '../../../Constants'
import { messages } from '../../../i18n/messages'
import { renderWithProviders } from '../../testUtils'
import { makeArticle, signedIn } from './fixtures'

vi.mock('../../../Services/ArticleService')
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('../../../Components/Stats/VisitStats', () => ({
  default: ({ article }: { article?: { id: string } }) => <div>visit stats for {article?.id ?? 'whole company'}</div>,
}))
vi.mock('../../../Components/Article/ArticleEditorSideOptions', () => ({
  default: ({ onUpdate }: { onUpdate: (field: string, value: string) => void }) => (
    <button onClick={() => onUpdate('title', 'New title')}>change title</button>
  ),
}))

const service = vi.mocked(ArticleService)
const article = makeArticle()
const openBtn = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const dialog = () => screen.getByRole('dialog')

describe('ArticleDeleteBtn', () => {
  test('renders nothing without an article', () => {
    const { container } = renderWithProviders(<ArticleDeleteBtn />)
    expect(container).toBeEmptyDOMElement()
  })

  test('shows custom children in place of the default label', async () => {
    renderWithProviders(<ArticleDeleteBtn article={article}>Remove</ArticleDeleteBtn>)
    expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  test('asks first, and cancelling deletes nothing', async () => {
    renderWithProviders(<ArticleDeleteBtn article={article} />)
    fireEvent.click(await screen.findByRole('button', { name: /delete/i }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(service.deactivate).not.toHaveBeenCalled()
  })

  test('deletes on confirm, reports it and closes the dialog', async () => {
    const deleted = makeArticle({ isActive: false })
    service.deactivate.mockResolvedValue(deleted)
    const onDeleted = vi.fn()
    renderWithProviders(<ArticleDeleteBtn article={article} onDeleted={onDeleted} />)
    fireEvent.click(await screen.findByRole('button', { name: /delete/i }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /yes/i }))

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(deleted))
    expect(service.deactivate).toHaveBeenCalledWith('art-1')
    expect(message.success).toHaveBeenCalledWith('Content deleted.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('works without an onDeleted callback', async () => {
    service.deactivate.mockResolvedValue(article)
    renderWithProviders(<ArticleDeleteBtn article={article} />)
    fireEvent.click(await screen.findByRole('button', { name: /delete/i }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /yes/i }))
    await waitFor(() => expect(message.success).toHaveBeenCalled())
  })

  test('reports a failed delete and does not tell the parent it worked', async () => {
    service.deactivate.mockRejectedValue(new Error('nope'))
    const onDeleted = vi.fn()
    renderWithProviders(<ArticleDeleteBtn article={article} onDeleted={onDeleted} />)
    fireEvent.click(await screen.findByRole('button', { name: /delete/i }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /yes/i }))

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error when deleting nope'))
    expect(onDeleted).not.toHaveBeenCalled()
  })

  // Bug: the failure path never clears `deleting`, so the confirm button spins until the dialog is cancelled.
  test.fails('lets the user retry after a failed delete', async () => {
    service.deactivate.mockRejectedValue(new Error('nope'))
    renderWithProviders(<ArticleDeleteBtn article={article} />)
    fireEvent.click(await screen.findByRole('button', { name: /delete/i }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /yes/i }))
    await waitFor(() => expect(message.error).toHaveBeenCalled())
    expect(within(dialog()).getByRole('button', { name: /yes/i })).not.toHaveClass('ant-btn-loading')
  })

  test('does nothing for an article that has no id', async () => {
    renderWithProviders(<ArticleDeleteBtn article={makeArticle({ id: '' })} />)
    fireEvent.click(await screen.findByRole('button', { name: /delete/i }))
    fireEvent.click(within(dialog()).getByRole('button', { name: /yes/i }))
    expect(service.deactivate).not.toHaveBeenCalled()
  })
})

describe('ArticleUnPublishBtn', () => {
  const confirm = () => fireEvent.click(within(dialog()).getByRole('button', { name: /confirm/i }))

  test('renders nothing without an article', () => {
    const { container } = renderWithProviders(<ArticleUnPublishBtn />)
    expect(container).toBeEmptyDOMElement()
  })

  test('cancelling leaves the article published', () => {
    renderWithProviders(<ArticleUnPublishBtn article={article} />)
    openBtn(/unpublish/i)
    fireEvent.click(within(dialog()).getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(service.update).not.toHaveBeenCalled()
  })

  test('clears the publish fields and reports success', async () => {
    const updated = makeArticle({ publishedAt: null })
    service.update.mockResolvedValue(updated)
    const onUpdated = vi.fn()
    renderWithProviders(<ArticleUnPublishBtn article={article} onUpdated={onUpdated} />)
    openBtn(/unpublish/i)
    confirm()

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated))
    expect(service.update).toHaveBeenCalledWith('art-1', { publishedAt: null, publishedById: null })
    expect(message.success).toHaveBeenCalledWith('Content unPublished.')
  })

  // Bug: .finally spreads the stale state, which re-opens the dialog. Only a parent refetch hides it.
  test.fails('closes the dialog after success', async () => {
    service.update.mockResolvedValue(article)
    renderWithProviders(<ArticleUnPublishBtn article={article} />)
    openBtn(/unpublish/i)
    confirm()
    await waitFor(() => expect(message.success).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('reports a failure, keeps the dialog and stops spinning', async () => {
    service.update.mockRejectedValue(new Error('nope'))
    const onUpdated = vi.fn()
    renderWithProviders(<ArticleUnPublishBtn article={article} onUpdated={onUpdated} />)
    openBtn(/unpublish/i)
    confirm()

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error when unPublishing: nope'))
    expect(onUpdated).not.toHaveBeenCalled()
    await waitFor(() => expect(within(dialog()).getByRole('button', { name: /confirm/i })).not.toHaveClass('ant-btn-loading'))
  })

  test('does nothing for an article that has no id', () => {
    renderWithProviders(<ArticleUnPublishBtn article={makeArticle({ id: ' ' })} />)
    openBtn(/unpublish/i)
    confirm()
    expect(service.update).not.toHaveBeenCalled()
  })

  // Bug: the English messages have no `unPublish` key, so the button shows the raw message id.
  test.fails('has a translated button label', () => {
    expect(messages[LOCALES.ENGLISH]).toHaveProperty('unPublish')
  })
})

describe('ArticlePreviewBtn', () => {
  test('renders nothing without an article', () => {
    const { container } = renderWithProviders(<ArticlePreviewBtn />)
    expect(container).toBeEmptyDOMElement()
  })

  test('refuses to preview a draft', () => {
    service.getPreviewUrl.mockReturnValue('https://x.test/preview')
    renderWithProviders(<ArticlePreviewBtn article={article} />)
    openBtn(/preview/i)
    expect(within(dialog()).getByRole('alert')).toHaveTextContent('NOT published')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('gives published articles a web link and a QR code, and closes', () => {
    service.getPreviewUrl.mockReturnValue('https://x.test/preview')
    renderWithProviders(<ArticlePreviewBtn article={makeArticle({ isPublished: true })} />)
    openBtn(/preview/i)

    expect(service.getPreviewUrl).toHaveBeenCalledWith('art-1')
    expect(within(dialog()).getByRole('link')).toHaveAttribute('href', 'https://x.test/preview')
    expect(dialog().querySelector('svg[height="128"]')).toBeInTheDocument()

    fireEvent.click(within(dialog()).getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('shows a placeholder in place of the QR code when there is no id', () => {
    renderWithProviders(<ArticlePreviewBtn article={makeArticle({ id: '', isPublished: true })} />)
    openBtn(/preview/i)
    expect(service.getPreviewUrl).not.toHaveBeenCalled()
    expect(dialog().querySelector('.ant-skeleton-image')).toBeInTheDocument()
    expect(dialog().querySelector('svg[height="128"]')).not.toBeInTheDocument()
  })
})

describe('ArticleStatsBtn', () => {
  test('renders nothing without an article', () => {
    const { container } = renderWithProviders(<ArticleStatsBtn />)
    expect(container).toBeEmptyDOMElement()
  })

  test('opens and closes the stats dialog', () => {
    renderWithProviders(<ArticleStatsBtn article={article}>Stats</ArticleStatsBtn>)
    openBtn(/stats/i)
    expect(within(dialog()).getByText(/visit stats for/)).toBeInTheDocument()
    fireEvent.click(within(dialog()).getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // Bug: state.article is never set, so the dialog shows company-wide visits instead of this article's.
  test.fails('shows the stats of this article', () => {
    renderWithProviders(<ArticleStatsBtn article={article}>Stats</ArticleStatsBtn>)
    openBtn(/stats/i)
    expect(within(dialog()).getByText('visit stats for art-1')).toBeInTheDocument()
  })
})

describe('disabled article buttons', () => {
  test('ArticleSyncBtn renders nothing, and neither button offers an action', () => {
    const { container } = renderWithProviders(
      <>
        <ArticleSyncBtn article={article} />
        <ArticleHistoryBtn article={article} />
      </>,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container.textContent).toBe('')
  })
})

describe('ArticleMoreOptionsBtn', () => {
  const openAndChange = () => {
    openBtn(/more options/i)
    fireEvent.click(screen.getByRole('button', { name: 'change title' }))
  }

  test('renders nothing without an article', () => {
    const { container } = renderWithProviders(<ArticleMoreOptionsBtn />)
    expect(container).toBeEmptyDOMElement()
  })

  test('opens the drawer and closes it again', async () => {
    renderWithProviders(<ArticleMoreOptionsBtn article={article} />, { state: signedIn })
    openBtn(/more options/i)
    expect(screen.getByRole('button', { name: 'change title' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() => expect(document.querySelector('.ant-drawer-open')).not.toBeInTheDocument())
  })

  test('saves a field and reports success', async () => {
    const saved = makeArticle({ title: 'New title' })
    service.update.mockResolvedValue(saved)
    const onUpdated = vi.fn()
    renderWithProviders(<ArticleMoreOptionsBtn article={article} onUpdated={onUpdated} />, { state: signedIn })
    openAndChange()

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(saved))
    expect(service.update).toHaveBeenCalledWith('art-1', { title: 'New title' }, expect.anything())
    expect(await screen.findByText(/updated/i)).toBeInTheDocument()
  })

  test('shows a save failure', async () => {
    service.update.mockRejectedValue(new Error('nope'))
    const onUpdated = vi.fn()
    renderWithProviders(<ArticleMoreOptionsBtn article={article} onUpdated={onUpdated} />, { state: signedIn })
    openAndChange()

    expect(await screen.findByText(/nope/)).toBeInTheDocument()
    expect(onUpdated).not.toHaveBeenCalled()
  })

  test('refuses to save an article that has no id', async () => {
    renderWithProviders(<ArticleMoreOptionsBtn article={makeArticle({ id: '' })} />, { state: signedIn })
    openAndChange()
    expect(await screen.findByText(/Invalid content/)).toBeInTheDocument()
    expect(service.update).not.toHaveBeenCalled()
  })

  // Bug: a Promise from getItemById is passed as `headers`, firing a stray GET /item/<companyId> on every save.
  test.fails('makes only the update request when saving', async () => {
    service.update.mockResolvedValue(article)
    renderWithProviders(<ArticleMoreOptionsBtn article={article} />, { state: signedIn })
    openAndChange()
    await waitFor(() => expect(service.update).toHaveBeenCalled())
    expect(service.getItemById).not.toHaveBeenCalled()
  })
})
