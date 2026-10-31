import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ArticleEditorSideOptions from '../../../Components/Article/ArticleEditorSideOptions'
import message from '../../../Components/Form/message'
import ArticleService from '../../../Services/ArticleService'
import IArticle from '../../../Types/Article/IArticle'
import IAsset from '../../../Types/Asset/IAsset'
import { renderWithProviders } from '../../testUtils'
import { deferred, makeArticle } from './fixtures'

vi.mock('../../../Services/ArticleService')
vi.mock('../../../Components/Article/ArticleEditorTags', () => ({ default: () => <div>tags</div> }))
vi.mock('../../../Components/Article/ArticleEditorAuthorSelector', () => ({ default: () => <div>authors</div> }))
vi.mock('../../../Components/Form/InlineRichTextEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <button onClick={() => onChange('new excerpt')}>excerpt: {value}</button>
  ),
}))
vi.mock('../../../Components/Form/SingleImageUploader', () => ({
  default: ({ onChange, initImgUrl }: { onChange: (asset: IAsset | null) => void; initImgUrl: string }) => (
    <>
      <span>cover url: {initImgUrl}</span>
      <button onClick={() => onChange({ id: 'asset-1' } as IAsset)}>upload</button>
      <button onClick={() => onChange(null)}>remove</button>
    </>
  ),
}))
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))

const service = vi.mocked(ArticleService)
const article = makeArticle({ excerpt: 'short', enableGTranslateFlag: false })
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('ArticleEditorSideOptions', () => {
  test('shows the current cover and excerpt', () => {
    const covered = makeArticle({ CoverAsset: { url: ' https://x.test/c.png ' } as IArticle['CoverAsset'] })
    renderWithProviders(<ArticleEditorSideOptions article={covered} onUpdate={vi.fn()} />)
    expect(screen.getByText('cover url: https://x.test/c.png')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /excerpt/ })).toBeInTheDocument()
  })

  test('saves a new cover and tells the parent', async () => {
    const saved = makeArticle({ coverAssetId: 'asset-1' })
    service.update.mockResolvedValue(saved)
    const onUpdated = vi.fn()
    const onSetIsSaving = vi.fn()
    renderWithProviders(
      <ArticleEditorSideOptions article={article} onUpdate={vi.fn()} onUpdated={onUpdated} onSetIsSaving={onSetIsSaving} />,
    )
    click('upload')

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(saved))
    expect(service.update).toHaveBeenCalledWith('art-1', { coverAssetId: 'asset-1' })
    expect(message.success).toHaveBeenCalledWith('Cover image updated.')
    await waitFor(() => expect(onSetIsSaving.mock.calls).toEqual([[true], [false]]))
  })

  test('removes the cover', async () => {
    service.update.mockResolvedValue(article)
    renderWithProviders(<ArticleEditorSideOptions article={article} onUpdate={vi.fn()} />)
    click('remove')
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Cover image removed'))
    expect(service.update).toHaveBeenCalledWith('art-1', { coverAssetId: null })
  })

  test('uses its own spinner when the parent gives no saving callback', async () => {
    const request = deferred<typeof article>()
    service.update.mockReturnValue(request.promise)
    const { container } = renderWithProviders(<ArticleEditorSideOptions article={article} onUpdate={vi.fn()} />)
    click('upload')
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(article)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('reports a failed cover update and stops saving', async () => {
    service.update.mockRejectedValue(new Error('nope'))
    const onUpdated = vi.fn()
    const onSetIsSaving = vi.fn()
    renderWithProviders(
      <ArticleEditorSideOptions article={article} onUpdate={vi.fn()} onUpdated={onUpdated} onSetIsSaving={onSetIsSaving} />,
    )
    click('upload')

    await waitFor(() => expect(message.error).toHaveBeenCalledWith(expect.stringContaining('nope')))
    expect(onUpdated).not.toHaveBeenCalled()
    await waitFor(() => expect(onSetIsSaving).toHaveBeenLastCalledWith(false))
  })

  test('ignores a cover change for an article that has no id', () => {
    renderWithProviders(<ArticleEditorSideOptions article={makeArticle({ id: '' })} onUpdate={vi.fn()} />)
    click('upload')
    expect(service.update).not.toHaveBeenCalled()
  })

  test('passes excerpt and translate flag changes up', () => {
    const onUpdate = vi.fn()
    renderWithProviders(<ArticleEditorSideOptions article={article} onUpdate={onUpdate} />)
    click(/excerpt/)
    fireEvent.click(screen.getByRole('switch'))
    expect(onUpdate).toHaveBeenCalledWith('excerpt', 'new excerpt')
    expect(onUpdate).toHaveBeenCalledWith('enableGTranslateFlag', true)
  })
})
