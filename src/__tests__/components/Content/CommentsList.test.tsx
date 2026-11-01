import React, { useState } from 'react'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import moment from 'moment'
import { vi } from 'vitest'
import CommentsList from '../../../Components/Comments/CommentsList'
import message from '../../../Components/Form/message'
import CommentService from '../../../Services/CommentService'
import IComment from '../../../Types/Comments/IComment'
import { renderWithProviders } from '../../testUtils'
import { FIXED_DATE, deferred, listOf } from '../Article/fixtures'

vi.mock('../../../Services/CommentService')
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))

const service = vi.mocked(CommentService)
const makeComment = (overrides: object = {}) =>
  ({
    id: 'c1',
    text: 'Nice post',
    comments: '<p>Nice post</p>',
    entityId: 'art-1',
    entityName: 'Item',
    createdAt: FIXED_DATE,
    CreatedBy: { nickName: 'Ann' },
    ...overrides,
  }) as unknown as IComment
const lastWhere = () => JSON.parse(service.getAll.mock.lastCall?.[0]?.where as string)
const openReply = async () => {
  fireEvent.click(screen.getAllByRole('button', { name: /reply/i })[0])
  return screen.findByRole('dialog')
}
const typeReply = (dialog: HTMLElement, value: string) =>
  fireEvent.change(within(dialog).getByRole('textbox', { name: 'Your reply' }), { target: { value } })
const clickOk = (dialog: HTMLElement) => fireEvent.click(within(dialog).getByRole('button', { name: 'Send reply' }))

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
    expect(lastWhere()).toEqual({ isActive: true, entityName: 'Item', replyToId: null })
    expect(service.getAll.mock.lastCall?.[0]).toMatchObject({
      currentPage: 1,
      include: 'CreatedBy,Replys.CreatedBy',
      sort: 'createdAt:DESC',
    })
  })

  test('fetches only the comments of the given article', async () => {
    service.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<CommentsList itemId="art-1" />)
    await screen.findByText('No data', { selector: '.ant-empty-description' })
    expect(lastWhere()).toEqual({ isActive: true, entityName: 'Item', replyToId: null, entityId: 'art-1' })
  })

  test('spins during the first load', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(request.promise as never)
    const { container } = renderWithProviders(<CommentsList />)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(listOf([]))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('shows the plain text, never stored HTML', async () => {
    const stored = '<img src=x onerror="window.hacked = 1"><script>window.hacked = 1</script>'
    service.getAll.mockResolvedValue(listOf([makeComment({ text: stored, comments: stored })]))
    const { container } = renderWithProviders(<CommentsList />)

    expect(await screen.findByText(stored)).toBeInTheDocument()
    expect(container.querySelector('img[src="x"]')).not.toBeInTheDocument()
    expect(container.querySelector('script')).not.toBeInTheDocument()
  })

  test('shows active replies under a comment, oldest first, as plain text', async () => {
    const stored = '<img src=x onerror="window.hacked = 1">'
    const later = '2024-03-16T00:00:00.000Z'
    const Replys = [
      makeComment({ id: 'r2', text: 'Second reply', createdAt: later, CreatedBy: { nickName: 'Staff' } }),
      makeComment({ id: 'r1', text: stored, comments: stored }),
      makeComment({ id: 'r3', text: 'Deleted long ago', isActive: false }),
    ]
    service.getAll.mockResolvedValue(listOf([makeComment({ Replys })]))
    const { container } = renderWithProviders(<CommentsList />)

    const texts = (await screen.findAllByText(/Second reply|onerror/)).map((node) => node.textContent)
    expect(texts).toEqual([stored, 'Second reply'])
    expect(screen.getAllByText('Staff').length).toBeGreaterThan(0)
    expect(screen.queryByText('Deleted long ago')).not.toBeInTheDocument()
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
      .mockResolvedValueOnce(listOf([makeComment({ id: 'c2', text: 'Second' })], { currentPage: 2, pages: 2 }))
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

  test('has no way to delete', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment({ Replys: [makeComment({ id: 'r1', text: 'A reply' })] })]))
    renderWithProviders(<CommentsList />)
    await screen.findByText('A reply')
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  test('hides a comment, marks it, and offers to show it again', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    service.hide.mockResolvedValue(makeComment({ isHidden: true }))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    fireEvent.click(screen.getByRole('button', { name: /Hide/ }))

    expect(await screen.findByText('Hidden from readers')).toBeInTheDocument()
    expect(service.hide).toHaveBeenCalledWith('c1', true)
    expect(screen.getByText('Nice post')).toBeInTheDocument()

    service.hide.mockResolvedValue(makeComment({ isHidden: false }))
    fireEvent.click(screen.getByRole('button', { name: /Show/ }))
    await waitFor(() => expect(screen.queryByText('Hidden from readers')).not.toBeInTheDocument())
    expect(service.hide).toHaveBeenLastCalledWith('c1', false)
  })

  test('hides a reply, and leaves its comment alone', async () => {
    const reply = makeComment({ id: 'r1', text: 'A reply', replyToId: 'c1' })
    service.getAll.mockResolvedValue(listOf([makeComment({ Replys: [reply] })]))
    service.hide.mockResolvedValue({ ...reply, isHidden: true })
    renderWithProviders(<CommentsList />)
    await screen.findByText('A reply')
    fireEvent.click(screen.getAllByRole('button', { name: /Hide/ })[1])

    expect(await screen.findByText('Hidden from readers')).toBeInTheDocument()
    expect(service.hide).toHaveBeenCalledWith('r1', true)
    expect(screen.getAllByRole('button', { name: /Hide/ })).toHaveLength(1)
  })

  test('keeps the comment as it was when hiding fails', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    service.hide.mockRejectedValue(new Error('nope'))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    fireEvent.click(screen.getByRole('button', { name: /Hide/ }))

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Failed to update the comment: nope'))
    expect(screen.queryByText('Hidden from readers')).not.toBeInTheDocument()
  })

  test('a reply goes out, shows under its comment, and closes the dialog', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    service.reply.mockResolvedValue(makeComment({ id: 'r1', text: 'Thanks', replyToId: 'c1' }))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    const dialog = await openReply()
    typeReply(dialog, '  Thanks  ')
    clickOk(dialog)

    expect(await screen.findByText('Thanks')).toBeInTheDocument()
    expect(service.reply).toHaveBeenCalledWith('c1', 'Thanks')
    expect(message.success).toHaveBeenCalledWith('Reply sent.')
    expect(document.querySelector('.ant-modal')?.className).toMatch(/leave/)
  })

  test('sends no empty reply', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    const dialog = await openReply()
    typeReply(dialog, '   ')
    clickOk(dialog)
    expect(service.reply).not.toHaveBeenCalled()
  })

  test('a failed reply keeps the dialog and the text', async () => {
    service.getAll.mockResolvedValue(listOf([makeComment()]))
    service.reply.mockRejectedValue(new Error('nope'))
    renderWithProviders(<CommentsList />)
    await screen.findByText('Nice post')
    const dialog = await openReply()
    typeReply(dialog, 'Thanks')
    clickOk(dialog)

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Failed to send the reply: nope'))
    expect(within(dialog).getByRole('textbox', { name: 'Your reply' })).toHaveValue('Thanks')
  })

  test('offers no reply on a hidden comment or on a reply', async () => {
    const reply = makeComment({ id: 'r1', text: 'A reply', replyToId: 'c1' })
    service.getAll.mockResolvedValue(
      listOf([makeComment({ isHidden: true, Replys: [reply] }), makeComment({ id: 'c2', text: 'Open' })]),
    )
    renderWithProviders(<CommentsList />)
    await screen.findByText('Open')
    expect(screen.getAllByRole('button', { name: /reply/i })).toHaveLength(1)
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
      .mockResolvedValueOnce(listOf([makeComment({ id: 'c2', text: 'Other article' })]))
    renderWithProviders(<Parent />)
    await screen.findByText('Nice post')
    fireEvent.click(screen.getByRole('button', { name: 'next article' }))
    await screen.findByText('Other article')
    expect(screen.queryByText('Nice post')).not.toBeInTheDocument()
  })

  describe('opening a link to a comment', () => {
    let scrollIntoView: ReturnType<typeof vi.fn>

    beforeEach(() => {
      scrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoView as never
    })

    const open = async (rows: IComment[], commentId?: string) => {
      service.getAll.mockResolvedValue(listOf(rows))
      const view = renderWithProviders(<CommentsList itemId="art-1" commentId={commentId} />)
      await screen.findByText('Nice post')
      return view
    }

    test('scrolls to the comment and highlights it, and only it', async () => {
      const { container } = await open([makeComment(), makeComment({ id: 'c2', text: 'Other' })], 'c2')

      const target = container.querySelector('#comment-c2')
      expect(target).toHaveTextContent('Other')
      expect(target).toHaveClass('comment-highlight')
      expect(container.querySelector('#comment-c1')).not.toHaveClass('comment-highlight')
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
      expect(scrollIntoView.mock.contexts[0]).toBe(target)
    })

    test('scrolls once more when the editor above has grown', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      await open([makeComment()], 'c1')
      vi.advanceTimersByTime(2000)
      expect(scrollIntoView).toHaveBeenCalledTimes(2)
      vi.useRealTimers()
    })

    test('leaves the list as it is when the comment is not on the page', async () => {
      const { container } = await open([makeComment()], 'c9')
      expect(scrollIntoView).not.toHaveBeenCalled()
      expect(container.querySelector('.comment-highlight')).not.toBeInTheDocument()
    })

    test('does nothing without a comment in the link', async () => {
      await open([makeComment()])
      expect(scrollIntoView).not.toHaveBeenCalled()
    })

    test('hiding the comment afterwards does not scroll again', async () => {
      service.hide.mockResolvedValue(makeComment({ isHidden: true }))
      await open([makeComment()], 'c1')
      fireEvent.click(screen.getByRole('button', { name: /Hide/ }))
      await screen.findByText('Hidden from readers')
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
    })

    test('the newest comes first, so a new comment is on the first page', async () => {
      await open([makeComment()], 'c1')
      expect(service.getAll.mock.lastCall?.[0]).toMatchObject({ sort: 'createdAt:DESC', currentPage: 1 })
    })
  })
})
