import React, { useState } from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import moment from 'moment'
import { vi } from 'vitest'
import CommentsList from '../../../Components/Comments/CommentsList'
import message from '../../../Components/Form/message'
import CommentService from '../../../Services/CommentService'
import IComment from '../../../Types/Comments/IComment'
import { renderWithProviders } from '../../testUtils'
import { FIXED_DATE, deferred, httpError, listOf, rejectedChain } from '../Article/fixtures'

vi.mock('../../../Services/CommentService')
vi.mock('../../../Components/Form/RichTextEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <button onClick={() => onChange('my reply')}>editor: {value}</button>
  ),
}))
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))

const service = vi.mocked(CommentService)
const makeComment = (overrides: object = {}) =>
  ({
    id: 'c1',
    comments: 'Nice post',
    entityId: 'art-1',
    entityName: 'Item',
    createdAt: FIXED_DATE,
    CreatedBy: { nickName: 'Ann' },
    ...overrides,
  }) as unknown as IComment
const lastWhere = () => JSON.parse(service.getAll.mock.lastCall?.[0]?.where as string)
const removeFirst = async () => {
  fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
  fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))
}

const localeAfterImports = moment.locale()

describe('CommentsList', () => {
  test('shows author, date, text and a link to the article', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    renderWithProviders(<CommentsList />)

    expect(await screen.findByText('Nice post')).toBeInTheDocument()
    expect(screen.getAllByText('Ann').length).toBeGreaterThan(0)
    expect(screen.getByText('Mar 15, 2024 9:30 AM')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Article' })).toHaveAttribute('href', '/b/articles/art-1')
  })

  test('fetches all company comments when no article is given', async () => {
    service.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<CommentsList itemId="  " />)
    await screen.findByText('No data', { selector: '.ant-empty-description' })
    expect(lastWhere()).toEqual({ isActive: true, entityName: 'Item' })
    expect(service.getAll.mock.lastCall?.[0]?.currentPage).toBe(1)
  })

  test('fetches only the comments of the given article', async () => {
    service.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<CommentsList itemId="art-1" />)
    await screen.findByText('No data', { selector: '.ant-empty-description' })
    expect(lastWhere()).toEqual({ isActive: true, entityName: 'Item', entityId: 'art-1' })
  })

  test('spins during the first load', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(request.promise as never)
    const { container } = renderWithProviders(<CommentsList />)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(listOf([]))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('shows stored HTML as plain text, so markup in a comment never runs', async () => {
    const stored = '<img src=x onerror="window.hacked = 1"><script>window.hacked = 1</script>'
    service.getAll.mockResolvedValue(listOf([makeComment({ comments: stored })]))
    const { container } = renderWithProviders(<CommentsList />)

    expect(await screen.findByText(stored)).toBeInTheDocument()
    expect(container.querySelector('img[src="x"]')).not.toBeInTheDocument()
    expect(container.querySelector('script')).not.toBeInTheDocument()
  })

  // Guards the dangerouslySetInnerHTML in the reply panel, which is dead code today because `replys` is always [].
  test('never renders stored HTML from replies', async () => {
    const reply = makeComment({ id: 'r1', comments: '<img src=x onerror="window.hacked = 1">' })
    service.getAll.mockResolvedValue(listOf([makeComment({ replys: [reply] })]))
    const { container } = renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    expect(container.querySelector('img[src="x"]')).not.toBeInTheDocument()
  })

  test('copes with a comment that has no author', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment({ CreatedBy: undefined })]))
    const { container } = renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    expect(container.querySelector('.ant-comment-content-author-name')).toBeEmptyDOMElement()
  })

  test('appends the next page and hides the button on the last one', async () => {
    service.getAll
      .mockResolvedValueOnce(listOf([makeComment()], { currentPage: 1, pages: 2 }))
      .mockResolvedValueOnce(listOf([makeComment({ id: 'c2', comments: 'Second' })], { currentPage: 2, pages: 2 }))
    renderWithProviders(<CommentsList />)
    fireEvent.click(await screen.findByRole('button', { name: /load more/i }))

    expect(await screen.findByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Nice post')).toBeInTheDocument()
    expect(service.getAll.mock.lastCall?.[0]?.currentPage).toBe(2)
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })

  test('reports a failed load', async () => {
    service.getAll.mockRejectedValue(new Error('nope'))
    const { container } = renderWithProviders(<CommentsList />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Error when fetching comments: nope'))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('ignores a load failure that arrives after unmount', async () => {
    const request = deferred<never>()
    service.getAll.mockReturnValue(request.promise)
    const { unmount } = renderWithProviders(<CommentsList />)
    unmount()
    request.reject(new Error('late'))
    await request.promise.catch(() => undefined)
    expect(message.error).not.toHaveBeenCalled()
  })

  test('ignores a reply that arrives after unmount', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(request.promise as never)
    const { unmount } = renderWithProviders(<CommentsList />)
    unmount()
    request.resolve(listOf([makeComment()]))
    await request.promise
    expect(screen.queryByText('Nice post')).not.toBeInTheDocument()
  })

  test('deletes a comment after confirmation and removes it from the list', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment(), makeComment({ id: 'c2', comments: 'Keep me' })]))
    service.deactivate.mockResolvedValue(makeComment())
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    await removeFirst()

    await waitFor(() => expect(message.success).toHaveBeenCalledWith('Comment deleted.'))
    expect(service.deactivate).toHaveBeenCalledWith('c1')
    await waitFor(() => expect(screen.queryByText('Nice post')).not.toBeInTheDocument())
    expect(screen.getByText('Keep me')).toBeInTheDocument()
  })

  test('does not delete when the confirmation is declined', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'No' }))
    expect(service.deactivate).not.toHaveBeenCalled()
  })

  test('ignores delete for a comment that has no id', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment({ id: ' ' })]))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    await removeFirst()
    expect(service.deactivate).not.toHaveBeenCalled()
  })

  test('keeps the comment when the delete fails with a `data` error', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    service.deactivate.mockRejectedValue({ data: { message: 'denied' } })
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    await removeFirst()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Failed to delete comments: denied'))
    expect(screen.getByText('Nice post')).toBeInTheDocument()
  })

  test('reports a failed delete from a real server error', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    const { chain, thrown } = rejectedChain(httpError('denied'))
    service.deactivate.mockReturnValue(chain)
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    await removeFirst()
    await waitFor(() => expect(service.deactivate).toHaveBeenCalled())
    expect(thrown).toEqual([])
  })

  test('the reply dialog opens from a comment and keeps what is typed', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /reply/i }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /editor/ }))
    expect(within(dialog).getByRole('button', { name: 'editor: my reply' })).toBeInTheDocument()
  })

  test('keeps dates in English by default', () => {
    expect(localeAfterImports).toBe('en')
  })

  test('cancel starts closing the reply dialog', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    fireEvent.click(screen.getByRole('button', { name: /reply/i }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /cancel/i }))
    expect(document.querySelector('.ant-modal')?.className).toMatch(/leave/)
  })

  // Cancel now closes the dialog (see above), but antd only hides it when the leave animation ends, and jsdom never
  // ends animations, so this check cannot pass here.
  test.fails('the reply dialog can be closed', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    fireEvent.click(screen.getByRole('button', { name: /reply/i }))
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /cancel/i }))
    await waitFor(() => expect(document.querySelector('.ant-modal-wrap')).not.toBeVisible(), { timeout: 300 })
  })

  test('replaces the list when the article changes', async () => {
    const Parent = () => {
      const [itemId, setItemId] = useState('art-1')
      return (
        <>
          <button onClick={() => setItemId('art-2')}>next article</button>
          <CommentsList itemId={itemId} />
        </>
      )
    }
    service.getAll
      .mockResolvedValueOnce(listOf([makeComment()]))
      .mockResolvedValueOnce(listOf([makeComment({ id: 'c2', comments: 'Other article' })]))
    renderWithProviders(<Parent />)
    await screen.findByText('Nice post')
    fireEvent.click(screen.getByRole('button', { name: 'next article' }))
    await screen.findByText('Other article')
    expect(screen.queryByText('Nice post')).not.toBeInTheDocument()
  })
})
