import React from 'react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { vi } from 'vitest'
import { apiError, deferred, stubMatchMedia, type, typeInline } from '../Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import CompanyAuthorPopup from '../../../Components/Company/CompanyAuthorPopup'
import CompanyAuthors from '../../../Components/Company/CompanyAuthors'
import CompanyDeleteBtn from '../../../Components/Company/CompanyDeleteBtn'
import CompanyEditor from '../../../Components/Company/CompanyEditor'
import CompanyTags from '../../../Components/Company/CompanyTags'
import AuthorService from '../../../Services/AuthorService'
import CompanyService from '../../../Services/CompanyService'
import TagService from '../../../Services/TagService'
import message from '../../../Components/Form/message'

const { crud } = vi.hoisted(() => ({
  crud: () => ({ default: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), deactivate: vi.fn() } }),
}))
vi.mock('../../../Services/AuthorService', () => crud())
vi.mock('../../../Services/CompanyService', () => crud())
vi.mock('../../../Services/TagService', () => crud())
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../../../Components/Form/SingleImageUploader', () => ({
  default: ({ onChange, onSetIsSaving, initImgUrl }: { onChange: (asset: object | null) => void; onSetIsSaving: (s: boolean) => void; initImgUrl: string }) => (
    <div>
      <span>logo:{initImgUrl}</span>
      <button onClick={() => onChange({ id: 'asset-1' })}>upload</button>
      <button onClick={() => onChange(null)}>remove</button>
      <button onClick={() => onSetIsSaving(true)}>start upload</button>
    </div>
  ),
}))
vi.mock('../../../Components/Form/InlineRichTextEditor', () => ({
  default: ({ onChange, value, height }: { onChange: (v: string) => void; value: string; height: number }) => (
    <textarea
      aria-label={height === 180 ? 'description' : 'footer'}
      defaultValue={value}
      onBlur={(e) => onChange(e.target.value)}
    />
  ),
}))

beforeAll(() => stubMatchMedia())

describe('CompanyAuthorPopup', () => {
  const props = () => ({ isShowing: true, onSaved: vi.fn(), onCancel: vi.fn() })
  const save = () => fireEvent.click(screen.getByRole('button', { name: /Save/ }))
  const name = () => screen.getByPlaceholderText('Author Name')
  const url = () => screen.getByPlaceholderText('The url')

  test('renders nothing until an author is chosen', () => {
    const { baseElement } = renderWithProviders(<CompanyAuthorPopup {...props()} companyAuthor={undefined} />)
    expect(baseElement.querySelector('.ant-modal')).not.toBeInTheDocument()
  })

  test('requires a name', () => {
    renderWithProviders(<CompanyAuthorPopup {...props()} companyAuthor={null} />)
    expect(screen.getByText('Create Author')).toBeInTheDocument()
    save()
    expect(screen.getByText('Author Name is required')).toBeInTheDocument()
    expect(message.error).toHaveBeenCalledWith('Error Occurred')
    expect(AuthorService.create).not.toHaveBeenCalled()
  })

  test('rejects an invalid link', () => {
    renderWithProviders(<CompanyAuthorPopup {...props()} companyAuthor={null} />)
    type(name(), 'Ann')
    type(url(), 'not a url')
    save()
    expect(screen.getByText('Link is invalid URL')).toBeInTheDocument()
    expect(AuthorService.create).not.toHaveBeenCalled()
  })

  test('creates a new author', async () => {
    const callbacks = { ...props(), onPreSave: vi.fn(), onPostSave: vi.fn() }
    const saved = { id: 'a-1', name: 'Ann' }
    vi.mocked(AuthorService.create).mockResolvedValue(saved as never)
    renderWithProviders(<CompanyAuthorPopup {...callbacks} companyAuthor={null} />)
    type(name(), 'Ann')
    type(url(), 'https://ann.test')
    save()
    expect(AuthorService.create).toHaveBeenCalledExactlyOnceWith({ name: 'Ann', url: 'https://ann.test' })
    expect(callbacks.onPreSave).toHaveBeenCalledWith(true)
    await waitFor(() => expect(callbacks.onSaved).toHaveBeenCalledWith(saved))
    expect(message.success).toHaveBeenCalledWith('Author "Ann" Saved')
    expect(callbacks.onPostSave).toHaveBeenCalledWith(false)
  })

  test('updates an existing author and reports a failure', async () => {
    const callbacks = props()
    vi.mocked(AuthorService.update).mockRejectedValue(apiError('taken'))
    renderWithProviders(<CompanyAuthorPopup {...callbacks} companyAuthor={{ id: 'a-1', name: 'Ann' } as never} />)
    expect(screen.getByText('Update Author')).toBeInTheDocument()
    expect(name()).toHaveValue('Ann')
    type(name(), 'Anna')
    save()
    expect(AuthorService.update).toHaveBeenCalledExactlyOnceWith('a-1', { id: 'a-1', name: 'Anna' })
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('taken'))
    expect(callbacks.onSaved).not.toHaveBeenCalled()
  })

  test('cancel is passed to the parent', () => {
    const callbacks = props()
    renderWithProviders(<CompanyAuthorPopup {...callbacks} companyAuthor={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(callbacks.onCancel).toHaveBeenCalledOnce()
  })
})

describe('CompanyAuthors', () => {
  const ann = { id: 'a-1', name: 'Ann' }
  const load = (data: object[] = [ann]) => vi.mocked(AuthorService.getAll).mockResolvedValue({ data } as never)
  const closeTag = (text: string) =>
    fireEvent.click(screen.getByText(text).querySelector('.anticon-close') as Element)

  test('lists the active authors', async () => {
    load()
    renderWithProviders(<CompanyAuthors />)
    expect(await screen.findByText('Ann')).toBeInTheDocument()
    expect(AuthorService.getAll).toHaveBeenCalledExactlyOnceWith({
      where: JSON.stringify({ isActive: true }),
      perPage: 99999,
    })
  })

  test('copes with an empty response', async () => {
    vi.mocked(AuthorService.getAll).mockResolvedValue({} as never)
    renderWithProviders(<CompanyAuthors />)
    expect(await screen.findByText('New Author')).toBeInTheDocument()
    await waitFor(() => expect(document.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('reports a load failure', async () => {
    vi.mocked(AuthorService.getAll).mockRejectedValue(new Error('down'))
    renderWithProviders(<CompanyAuthors />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('down'))
  })

  test('opens the popup for a new author, and cancel closes it', async () => {
    load()
    renderWithProviders(<CompanyAuthors />)
    await screen.findByText('Ann')
    fireEvent.click(screen.getByText('New Author'))
    expect(screen.getByText('Create Author')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Create Author')).not.toBeInTheDocument()
  })

  test('editing an author saves and reloads the list', async () => {
    load()
    vi.mocked(AuthorService.update).mockResolvedValue({ id: 'a-1', name: 'Anna' } as never)
    renderWithProviders(<CompanyAuthors />)
    fireEvent.click(await screen.findByText('Ann'))
    expect(screen.getByText('Update Author')).toBeInTheDocument()
    load([{ id: 'a-1', name: 'Anna' }])
    fireEvent.click(screen.getByRole('button', { name: /Save/ }))
    expect(await screen.findByText('Anna')).toBeInTheDocument()
    expect(AuthorService.getAll).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Update Author')).not.toBeInTheDocument()
  })

  test('deleting an author deactivates it without opening the editor', async () => {
    load()
    vi.mocked(AuthorService.deactivate).mockResolvedValue(ann as never)
    renderWithProviders(<CompanyAuthors />)
    await screen.findByText('Ann')
    load([])
    closeTag('Ann')
    expect(AuthorService.deactivate).toHaveBeenCalledExactlyOnceWith('a-1')
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Author Deleted'))
    await waitFor(() => expect(AuthorService.getAll).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Update Author')).not.toBeInTheDocument()
  })

  test('reports a failed delete and reloads', async () => {
    load()
    vi.mocked(AuthorService.deactivate).mockRejectedValue(apiError('in use'))
    renderWithProviders(<CompanyAuthors />)
    await screen.findByText('Ann')
    closeTag('Ann')
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('in use'))
    await waitFor(() => expect(AuthorService.getAll).toHaveBeenCalledTimes(2))
  })

  test('skips the delete for an author without an id', async () => {
    load([{ name: 'Draft' }])
    renderWithProviders(<CompanyAuthors />)
    await screen.findByText('Draft')
    closeTag('Draft')
    expect(AuthorService.deactivate).not.toHaveBeenCalled()
  })
})

describe('CompanyTags', () => {
  const news = { id: 't-1', name: 'News' }
  const load = (data: object[] = [news]) => vi.mocked(TagService.getAll).mockResolvedValue({ data } as never)
  const input = () => screen.getByPlaceholderText('New Tag Name ...')
  const openInput = async () => fireEvent.click(await screen.findByText('New Tag'))
  const pressEnter = () => fireEvent.keyDown(input(), { key: 'Enter', keyCode: 13 })
  const closeTag = (text: string) =>
    fireEvent.click(screen.getByText(text).querySelector('.anticon-close') as Element)

  test('lists the active tags', async () => {
    load()
    renderWithProviders(<CompanyTags />)
    expect(await screen.findByText('News')).toBeInTheDocument()
    expect(TagService.getAll).toHaveBeenCalledExactlyOnceWith({
      where: JSON.stringify({ isActive: true }),
      perPage: 99999,
    })
  })

  test('reports a load failure', async () => {
    vi.mocked(TagService.getAll).mockRejectedValue(apiError('down'))
    renderWithProviders(<CompanyTags />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('down'))
  })

  test('ignores a response or failure after unmounting', async () => {
    const ok = deferred<never>()
    const bad = deferred<never>()
    vi.mocked(TagService.getAll).mockReturnValueOnce(ok.promise).mockReturnValueOnce(bad.promise)
    renderWithProviders(<CompanyTags />).unmount()
    renderWithProviders(<CompanyTags />).unmount()
    await act(async () => {
      ok.resolve({ data: [news] } as never)
      bad.reject(apiError('late'))
    })
    expect(message.error).not.toHaveBeenCalled()
  })

  test('creates a trimmed tag on Enter and returns to the button', async () => {
    load([])
    vi.mocked(TagService.create).mockResolvedValue(news as never)
    renderWithProviders(<CompanyTags />)
    await openInput()
    type(input(), '  News ')
    load()
    pressEnter()
    expect(TagService.create).toHaveBeenCalledExactlyOnceWith({ name: 'News' })
    expect(await screen.findByText('News')).toBeInTheDocument()
    expect(message.success).toHaveBeenCalledWith('Tag (=News) created!')
    expect(screen.getByText('New Tag')).toBeInTheDocument()
  })

  test('refuses an empty tag', async () => {
    load([])
    renderWithProviders(<CompanyTags />)
    await openInput()
    type(input(), '   ')
    pressEnter()
    expect(message.error).toHaveBeenCalledWith('Tag can NOT be empty')
    expect(TagService.create).not.toHaveBeenCalled()
  })

  test('refuses a duplicate tag', async () => {
    load()
    renderWithProviders(<CompanyTags />)
    await openInput()
    type(input(), 'News')
    pressEnter()
    expect(message.error).toHaveBeenCalledWith('Tag (=News) already exists!')
    expect(TagService.create).not.toHaveBeenCalled()
  })

  test('reports a failed create', async () => {
    load([])
    vi.mocked(TagService.create).mockRejectedValue(apiError('bad tag'))
    renderWithProviders(<CompanyTags />)
    await openInput()
    type(input(), 'News')
    pressEnter()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('bad tag'))
  })

  test('the close button hides the input', async () => {
    load([])
    renderWithProviders(<CompanyTags />)
    await openInput()
    fireEvent.click(within(input().closest('.app-Tag') as HTMLElement).getByRole('button'))
    expect(screen.queryByPlaceholderText('New Tag Name ...')).not.toBeInTheDocument()
  })

  // Known bug: closing the input keeps the typed name, so Enter on the reopened empty box creates the old tag.
  test.fails('forgets the typed name when the input is closed', async () => {
    load([])
    vi.mocked(TagService.create).mockResolvedValue(news as never)
    renderWithProviders(<CompanyTags />)
    await openInput()
    type(input(), 'Abandoned')
    fireEvent.click(within(input().closest('.app-Tag') as HTMLElement).getByRole('button'))
    await openInput()
    pressEnter()
    expect(TagService.create).not.toHaveBeenCalled()
  })

  test('deletes a tag and reloads', async () => {
    load()
    vi.mocked(TagService.deactivate).mockResolvedValue(news as never)
    renderWithProviders(<CompanyTags />)
    await screen.findByText('News')
    closeTag('News')
    expect(TagService.deactivate).toHaveBeenCalledExactlyOnceWith('t-1')
    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Tag (=News) deleted!'))
    await waitFor(() => expect(TagService.getAll).toHaveBeenCalledTimes(2))
  })

  test('reports a failed delete', async () => {
    load()
    vi.mocked(TagService.deactivate).mockRejectedValue(apiError('in use'))
    renderWithProviders(<CompanyTags />)
    await screen.findByText('News')
    closeTag('News')
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('in use'))
  })

  test('skips the delete for a tag without an id', async () => {
    load([{ name: 'Draft' }])
    renderWithProviders(<CompanyTags />)
    await screen.findByText('Draft')
    closeTag('Draft')
    expect(TagService.deactivate).not.toHaveBeenCalled()
  })
})

describe('CompanyDeleteBtn', () => {
  const company = { id: 'co-1', name: 'Acme' } as never
  const confirmInput = () => screen.getByPlaceholderText('Type in the company name to confirm')
  const confirmDelete = () => fireEvent.click(screen.getByRole('button', { name: /Confirm Delete/ }))
  const openModal = () => fireEvent.click(screen.getByRole('button', { name: /Delete$/ }))
  // jsdom never finishes the closing animation, so the leave class is the sign that the modal is closing.
  const expectClosing = () => expect(document.querySelector('.ant-modal')?.className).toMatch(/leave/)

  test('asks for the company name first', () => {
    renderWithProviders(<CompanyDeleteBtn company={company} />)
    openModal()
    expect(screen.getByText('Deleting this company?')).toBeInTheDocument()
    confirmDelete()
    expect(screen.getByText('Please type in the company name to confirm')).toBeInTheDocument()
    expect(CompanyService.deactivate).not.toHaveBeenCalled()
  })

  test('refuses a different name', () => {
    renderWithProviders(<CompanyDeleteBtn company={company} />)
    openModal()
    type(confirmInput(), 'Acm')
    confirmDelete()
    expect(screen.getByText('Provided name is different from company name')).toBeInTheDocument()
    expect(CompanyService.deactivate).not.toHaveBeenCalled()
  })

  test('deletes with the right name', async () => {
    const onDeleted = vi.fn()
    const deleted = { id: 'co-1', isActive: false }
    vi.mocked(CompanyService.deactivate).mockResolvedValue(deleted as never)
    renderWithProviders(<CompanyDeleteBtn company={company} onDeleted={onDeleted} />)
    openModal()
    type(confirmInput(), 'Acme')
    confirmDelete()
    expect(CompanyService.deactivate).toHaveBeenCalledExactlyOnceWith('co-1')
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(deleted))
    expect(message.success).toHaveBeenCalledWith('Company deleted successfully.')
  })

  // Known bug: the second setState reuses the stale state, so the modal stays open after a successful delete.
  test.fails('closes the modal after deleting', async () => {
    vi.mocked(CompanyService.deactivate).mockResolvedValue({} as never)
    renderWithProviders(<CompanyDeleteBtn company={company} />)
    openModal()
    type(confirmInput(), 'Acme')
    confirmDelete()
    await waitFor(() => expect(message.success).toHaveBeenCalled())
    await act(async () => undefined)
    expectClosing()
  })

  test('reports a failed delete', async () => {
    const onDeleted = vi.fn()
    vi.mocked(CompanyService.deactivate).mockRejectedValue(new Error('locked'))
    renderWithProviders(<CompanyDeleteBtn company={company} onDeleted={onDeleted} />)
    openModal()
    type(confirmInput(), 'Acme')
    confirmDelete()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error when deleting company: locked'))
    expect(onDeleted).not.toHaveBeenCalled()
  })

  test('does nothing for a company without an id', () => {
    renderWithProviders(<CompanyDeleteBtn company={{ name: 'Acme' } as never} />)
    openModal()
    type(confirmInput(), 'Acme')
    confirmDelete()
    expect(CompanyService.deactivate).not.toHaveBeenCalled()
  })

  test('cancel closes the modal', async () => {
    renderWithProviders(<CompanyDeleteBtn company={company} />)
    openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(expectClosing)
  })

  test('supports a custom label and an icon-only mode', () => {
    const { rerender } = renderWithProviders(<CompanyDeleteBtn company={company}>Remove</CompanyDeleteBtn>)
    expect(screen.getByRole('button', { name: /Remove/ })).toBeInTheDocument()
    rerender(<div />)
    renderWithProviders(<CompanyDeleteBtn company={company} noText />)
    expect(screen.getByRole('button', { name: 'delete' })).toBeInTheDocument()
  })
})

describe('CompanyEditor', () => {
  const company = {
    id: 'co-1',
    name: 'Acme',
    LogoAsset: { url: 'logo.png' },
    description: 'desc',
    itemDefaultFooter: 'foot',
  } as never
  const renderEditor = (onSaved = vi.fn(), value = company) => {
    vi.mocked(AuthorService.getAll).mockResolvedValue({ data: [] } as never)
    vi.mocked(TagService.getAll).mockResolvedValue({ data: [] } as never)
    return { onSaved, ...renderWithProviders(<CompanyEditor company={value} onSaved={onSaved} />) }
  }
  const saved = { id: 'co-1', name: 'New' }

  test.each([
    ['Name of the company', 'name'],
    ['Company Number, like ABN, ACN...', 'companyNumber'],
    ['The Url of the company', 'websiteUrl'],
    ['The email of the company', 'email'],
    ['The contact number of the company', 'contactNumber'],
  ])('saving "%s" updates %s', async (placeholder, field) => {
    vi.mocked(CompanyService.update).mockResolvedValue(saved as never)
    const { onSaved } = renderEditor()
    typeInline(screen.getByPlaceholderText(placeholder), 'changed')
    expect(CompanyService.update).toHaveBeenCalledExactlyOnceWith('co-1', { [field]: 'changed' })
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved))
    expect(message.success).toHaveBeenCalledWith('Company (New) updated.')
  })

  test('saves the description and the footer', async () => {
    vi.mocked(CompanyService.update).mockResolvedValue(saved as never)
    renderEditor()
    fireEvent.blur(screen.getByLabelText('description'), { target: { value: 'd2' } })
    expect(CompanyService.update).toHaveBeenLastCalledWith('co-1', { description: 'd2' })
    fireEvent.blur(screen.getByLabelText('footer'), { target: { value: 'f2' } })
    expect(CompanyService.update).toHaveBeenLastCalledWith('co-1', { itemDefaultFooter: 'f2' })
    await waitFor(() => expect(message.success).toHaveBeenCalledTimes(2))
  })

  test('saves the uploaded logo and clears a removed one', async () => {
    vi.mocked(CompanyService.update).mockResolvedValue(saved as never)
    renderEditor()
    expect(screen.getByText('logo:logo.png')).toBeInTheDocument()
    fireEvent.click(screen.getByText('upload'))
    expect(CompanyService.update).toHaveBeenLastCalledWith('co-1', { logoAssetId: 'asset-1' })
    fireEvent.click(screen.getByText('remove'))
    expect(CompanyService.update).toHaveBeenLastCalledWith('co-1', { logoAssetId: null })
    await waitFor(() => expect(message.success).toHaveBeenCalledTimes(2))
  })

  test('shows the spinner during an upload', async () => {
    const { container } = renderEditor()
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
    fireEvent.click(screen.getByText('start upload'))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
  })

  test('reports a failed save', async () => {
    vi.mocked(CompanyService.update).mockRejectedValue(new Error('rejected'))
    const { onSaved } = renderEditor()
    typeInline(screen.getByPlaceholderText('Name of the company'), 'changed')
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('rejected'))
    expect(onSaved).not.toHaveBeenCalled()
  })

  test('does not save a company without an id', () => {
    renderEditor(vi.fn(), { name: 'Draft' } as never)
    typeInline(screen.getByPlaceholderText('Name of the company'), 'changed')
    expect(CompanyService.update).not.toHaveBeenCalled()
  })
})
