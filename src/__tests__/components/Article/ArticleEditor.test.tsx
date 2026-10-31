import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ArticleEditor from '../../../Components/Article/ArticleEditor'
import ArticleService from '../../../Services/ArticleService'
import { renderWithProviders } from '../../testUtils'
import { deferred, makeArticle, signedIn } from './fixtures'

vi.mock('../../../Services/ArticleService')
vi.mock('../../../Components/Form/InlineRichTextEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <button onClick={() => onChange('<p>new</p>')}>rich text: {value}</button>
  ),
}))
vi.mock('../../../Components/Article/ArticleEditorSideOptions', () => ({
  default: ({
    onUpdate,
    onSetIsSaving,
  }: {
    onUpdate: (field: string, value: boolean) => void
    onSetIsSaving: (saving: boolean) => void
  }) => (
    <>
      <button onClick={() => onUpdate('enableGTranslateFlag', true)}>toggle flag</button>
      <button onClick={() => onSetIsSaving(true)}>start saving</button>
    </>
  ),
}))

const service = vi.mocked(ArticleService)
const article = makeArticle({ content: '<p>old</p>' })
const render = (overrides = article, onUpdated?: () => void) =>
  renderWithProviders(<ArticleEditor article={overrides} onUpdated={onUpdated} />, { state: signedIn })

describe('ArticleEditor', () => {
  test('shows the title and content of the article', () => {
    render()
    expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument()
    expect(screen.getByText(/rich text: <p>old<\/p>/)).toBeInTheDocument()
  })

  test('saves an edited title on blur', async () => {
    const saved = makeArticle({ title: 'Changed' })
    service.update.mockResolvedValue(saved)
    const onUpdated = vi.fn()
    render(article, onUpdated)
    const input = screen.getByDisplayValue('Hello world')
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.blur(input)

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(saved))
    expect(service.update).toHaveBeenCalledWith('art-1', { title: 'Changed' }, expect.anything())
    expect(await screen.findByText('Content updated.')).toBeInTheDocument()
  })

  test('saves nothing when the title is unchanged', () => {
    render()
    fireEvent.blur(screen.getByDisplayValue('Hello world'))
    expect(service.update).not.toHaveBeenCalled()
  })

  test('saves content changes and works without onUpdated', async () => {
    service.update.mockResolvedValue(article)
    render()
    fireEvent.click(screen.getByRole('button', { name: /rich text/ }))
    expect(await screen.findByText('Content updated.')).toBeInTheDocument()
    expect(service.update).toHaveBeenCalledWith('art-1', { content: '<p>new</p>' }, expect.anything())
  })

  test('saves side option changes', async () => {
    service.update.mockResolvedValue(article)
    render()
    fireEvent.click(screen.getByRole('button', { name: 'toggle flag' }))
    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith('art-1', { enableGTranslateFlag: true }, expect.anything()),
    )
  })

  test('spins while saving and stops afterwards', async () => {
    const request = deferred<typeof article>()
    service.update.mockReturnValue(request.promise)
    const { container } = render()
    fireEvent.click(screen.getByRole('button', { name: /rich text/ }))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(article)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('the side options can start the spinner', async () => {
    const { container } = render()
    fireEvent.click(screen.getByRole('button', { name: 'start saving' }))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
  })

  test('shows a save failure and does not report an update', async () => {
    service.update.mockRejectedValue(new Error('nope'))
    const onUpdated = vi.fn()
    const { container } = render(article, onUpdated)
    fireEvent.click(screen.getByRole('button', { name: /rich text/ }))

    expect(await screen.findByText('Error: nope')).toBeInTheDocument()
    expect(onUpdated).not.toHaveBeenCalled()
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('refuses to save an article that has no id', async () => {
    render(makeArticle({ id: '' }))
    fireEvent.click(screen.getByRole('button', { name: /rich text/ }))
    expect(await screen.findByText(/Invalid content/)).toBeInTheDocument()
    expect(service.update).not.toHaveBeenCalled()
  })

  // Bug: a Promise from getItemById is passed as `headers`, firing a stray GET /item/<companyId> on every save.
  test.fails('makes only the update request when saving', async () => {
    service.update.mockResolvedValue(article)
    render()
    fireEvent.click(screen.getByRole('button', { name: /rich text/ }))
    await waitFor(() => expect(service.update).toHaveBeenCalled())
    expect(service.getItemById).not.toHaveBeenCalled()
  })
})
