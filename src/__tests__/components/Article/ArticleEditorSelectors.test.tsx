import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ArticleEditorAuthorSelector from '../../../Components/Article/ArticleEditorAuthorSelector'
import ArticleEditorTags from '../../../Components/Article/ArticleEditorTags'
import message from '../../../Components/Form/message'
import AuthorService from '../../../Services/AuthorService'
import ItemTagService from '../../../Services/ItemTagService'
import TagService from '../../../Services/TagService'
import IAuthor from '../../../Types/Article/IAuthor'
import IItemTag from '../../../Types/Article/IItemTag'
import ITag from '../../../Types/Article/ITag'
import { renderWithProviders } from '../../testUtils'
import { httpError, listOf, makeArticle } from './fixtures'

vi.mock('../../../Services/AuthorService')
vi.mock('../../../Services/TagService')
vi.mock('../../../Services/ItemTagService')
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('../../../Components/Company/CompanyAuthorPopup', () => ({
  default: ({ onSaved, onCancel }: { onSaved: (author: { id?: string }) => void; onCancel: () => void }) => (
    <div>
      author popup
      <button onClick={() => onSaved({ id: 'a-new' })}>save author</button>
      <button onClick={() => onSaved({})}>save author without id</button>
      <button onClick={onCancel}>cancel author</button>
    </div>
  ),
}))

const authors = vi.mocked(AuthorService)
const tags = vi.mocked(TagService)
const itemTags = vi.mocked(ItemTagService)
const openSelect = () => fireEvent.mouseDown(screen.getByRole('combobox'))
const option = (text: string) =>
  screen.getAllByText(text).find((el) => el.closest('.ant-select-item-option')) as HTMLElement

describe('ArticleEditorAuthorSelector', () => {
  const ann = { id: 'a1', name: 'Ann', url: 'https://ann.test' } as IAuthor
  const bob = { id: 'a2', name: 'Bob', url: '' } as IAuthor
  const onUpdate = vi.fn()
  const render = (showCreate = false, authorId: string | null = 'a1') =>
    renderWithProviders(
      <ArticleEditorAuthorSelector article={makeArticle({ authorId })} showCreate={showCreate} onUpdate={onUpdate} />,
    )

  beforeEach(() => {
    authors.getAll.mockResolvedValue(listOf([ann, bob]))
  })

  test('loads active authors and links to the selected one', async () => {
    render()
    const link = await screen.findByRole('link', { name: 'https://ann.test' })
    expect(link).toHaveAttribute('href', 'https://ann.test')
    expect(authors.getAll).toHaveBeenCalledWith({ where: JSON.stringify({ isActive: true }) })
  })

  test('shows no link for an author without a url', async () => {
    render(false, 'a2')
    await waitFor(() => expect(authors.getAll).toHaveBeenCalled())
    await screen.findAllByText('Bob')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('reports the chosen author', async () => {
    render()
    await screen.findByRole('link')
    openSelect()
    fireEvent.click(option('Bob'))
    expect(onUpdate).toHaveBeenCalledWith('authorId', 'a2')
  })

  test('hides the create option unless asked for', async () => {
    render()
    await screen.findByRole('link')
    openSelect()
    expect(screen.queryByText('Create New Author')).not.toBeInTheDocument()
  })

  test('searching filters by name or url, ignoring case, and hides unknown options', async () => {
    render(true, null)
    await waitFor(() => expect(authors.getAll).toHaveBeenCalled())
    openSelect()
    await waitFor(() => expect(option('Bob')).toBeInTheDocument())

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ANN.TEST' } })
    await waitFor(() => expect(screen.queryByText('Bob')).not.toBeInTheDocument())
    expect(option('Ann')).toBeInTheDocument()
    expect(screen.queryByText('Create New Author')).not.toBeInTheDocument()
  })

  test('creating an author reloads the list and selects it', async () => {
    render(true)
    await screen.findByRole('link')
    openSelect()
    fireEvent.click(option('Create New Author'))
    expect(onUpdate).not.toHaveBeenCalled()

    fireEvent.click(await screen.findByRole('button', { name: 'save author' }))
    expect(onUpdate).toHaveBeenCalledWith('authorId', 'a-new')
    await waitFor(() => expect(authors.getAll).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByText('author popup')).not.toBeInTheDocument())
  })

  test('selects nothing when the new author comes back without an id', async () => {
    render(true)
    await screen.findByRole('link')
    openSelect()
    fireEvent.click(option('Create New Author'))
    fireEvent.click(await screen.findByRole('button', { name: 'save author without id' }))
    expect(onUpdate).not.toHaveBeenCalled()
  })

  test('cancelling the popup closes it', async () => {
    render(true)
    await screen.findByRole('link')
    openSelect()
    fireEvent.click(option('Create New Author'))
    fireEvent.click(await screen.findByRole('button', { name: 'cancel author' }))
    expect(screen.queryByText('author popup')).not.toBeInTheDocument()
  })

  test('reports a load failure', async () => {
    authors.getAll.mockRejectedValue(httpError('denied'))
    render()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error: denied'))
  })

  test('survives a failure with no server response', async () => {
    authors.getAll.mockRejectedValue(new Error('Network Error'))
    render()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error: '))
  })

  test('ignores replies that arrive after unmount', async () => {
    const replied = Promise.resolve(listOf([ann]))
    authors.getAll.mockReturnValue(replied)
    const { unmount } = render()
    unmount()
    await replied
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test('ignores failures that arrive after unmount', async () => {
    const failed = Promise.reject(httpError('late'))
    authors.getAll.mockReturnValue(failed)
    const { unmount } = render()
    unmount()
    await failed.catch(() => undefined)
    expect(message.error).not.toHaveBeenCalled()
  })
})

describe('ArticleEditorTags', () => {
  const news = { id: 't1', name: 'News' } as ITag
  const tech = { id: 't2', name: 'Tech' } as ITag
  const linkNews = { id: 'it1', tagId: 't1' } as IItemTag
  const article = makeArticle()
  const render = () => renderWithProviders(<ArticleEditorTags article={article} />)

  beforeEach(() => {
    tags.getAll.mockResolvedValue(listOf([news, tech]))
    itemTags.getAll.mockResolvedValue(listOf([linkNews]))
  })

  test('loads the tags of this article', async () => {
    render()
    expect(await screen.findByText('News')).toBeInTheDocument()
    expect(itemTags.getAll).toHaveBeenCalledWith({
      where: JSON.stringify({ isActive: true, itemId: 'art-1' }),
      perPage: 99999,
    })
  })

  test('copes with empty replies', async () => {
    tags.getAll.mockResolvedValue({ data: undefined } as never)
    itemTags.getAll.mockResolvedValue({ data: undefined } as never)
    const { container } = render()
    await waitFor(() => expect(tags.getAll).toHaveBeenCalled())
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
    expect(screen.getByText('Tags:...')).toBeInTheDocument()
  })

  test('adding a tag links it, reports success and reloads', async () => {
    itemTags.create.mockResolvedValue({} as IItemTag)
    render()
    await screen.findByText('News')
    openSelect()
    fireEvent.click(option('Tech'))

    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Tags updated.'))
    expect(itemTags.create).toHaveBeenCalledWith({ itemId: 'art-1', tagId: 't2' })
    expect(itemTags.deactivate).not.toHaveBeenCalled()
    await waitFor(() => expect(tags.getAll).toHaveBeenCalledTimes(2))
  })

  test('removing a tag deactivates every link to it', async () => {
    itemTags.getAll.mockResolvedValue(listOf([linkNews, { id: 'it2', tagId: 't1' } as IItemTag]))
    itemTags.deactivate.mockResolvedValue({} as IItemTag)
    const { container } = render()
    await screen.findByText('News')
    fireEvent.click(container.querySelector('.ant-select-selection-item-remove') as Element)

    await waitFor(() => expect(message.success).toHaveBeenCalled())
    expect(itemTags.deactivate.mock.calls.map(([id]) => id)).toEqual(['it1', 'it2'])
    expect(itemTags.create).not.toHaveBeenCalled()
  })

  test('reports a failed load', async () => {
    tags.getAll.mockRejectedValue(httpError('denied'))
    render()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('denied'))
  })

  test('reports a failed save', async () => {
    itemTags.create.mockRejectedValue(httpError('cannot tag'))
    render()
    await screen.findByText('News')
    openSelect()
    fireEvent.click(option('Tech'))
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('cannot tag'))
    expect(message.success).not.toHaveBeenCalled()
  })

  test('ignores replies and failures that arrive after unmount', async () => {
    const { unmount } = render()
    unmount()
    await new Promise((resolve) => setTimeout(resolve))
    expect(message.error).not.toHaveBeenCalled()

    tags.getAll.mockRejectedValue(httpError('late'))
    render().unmount()
    await new Promise((resolve) => setTimeout(resolve))
    expect(message.error).not.toHaveBeenCalled()
  })

  test('does not send free text as a tag id', async () => {
    itemTags.create.mockResolvedValue({} as IItemTag)
    render()
    await screen.findByText('News')
    const box = screen.getByRole('combobox')
    fireEvent.change(box, { target: { value: 'Brand new' } })
    fireEvent.keyDown(box, { key: 'Enter', keyCode: 13, which: 13 })
    await waitFor(() => expect(message.success).toHaveBeenCalled())
    expect(itemTags.create).not.toHaveBeenCalledWith({ itemId: 'art-1', tagId: 'Brand new' })
  })
})
