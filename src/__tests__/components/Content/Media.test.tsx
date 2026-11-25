import React, { useState } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import message from '../../../Components/Form/message'
import CompanyMediaUsage from '../../../Components/Media/CompanyMediaUsage'
import MediaList from '../../../Components/Media/MediaList'
import AssetService from '../../../Services/AssetService'
import WebsiteService from '../../../Services/WebsiteService'
import IAsset from '../../../Types/Asset/IAsset'
import { renderWithProviders } from '../../testUtils'
import { FIXED_DATE, deferred, httpError, listOf } from '../Article/fixtures'

vi.mock('../../../Services/AssetService', async (importOriginal) => {
  const actual = await importOriginal<{ default: { formatFileSize: unknown } }>()
  return {
    default: { getAll: vi.fn(), getArticles: vi.fn(), getTotalSize: vi.fn(), deactivate: vi.fn(), formatFileSize: actual.default.formatFileSize },
  }
})
vi.mock('../../../Services/WebsiteService', () => ({ default: { getImageUsage: vi.fn() } }))
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))

const service = vi.mocked(AssetService)
const asset = {
  id: 'as-1',
  url: 'https://x.test/a.png',
  type: 'image/png',
  fileSize: 2500000,
  comments: 'A picture',
  createdAt: FIXED_DATE,
} as unknown as IAsset
const other = { ...asset, id: 'as-2', comments: 'Another' } as IAsset

describe('MediaList', () => {
  beforeEach(() => service.getArticles.mockResolvedValue({}))

  test('links to the articles using a file, above its type', async () => {
    service.getAll.mockResolvedValue(listOf([{ id: 'as-9', type: 'ITEM_COVER' } as IAsset]))
    service.getArticles.mockResolvedValue({ 'as-9': [{ id: 'it-1', title: 'My article' }] })
    renderWithProviders(<MediaList />)
    const link = await screen.findByRole('link', { name: 'My article' })
    expect(link).toHaveAttribute('href', '/b/articles/it-1')
    expect(link.compareDocumentPosition(screen.getByText('type: ITEM_COVER'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(service.getArticles).toHaveBeenCalledWith(['as-9'])
  })

  const removeFirst = async () => {
    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }))
  }

  test('shows the type, formatted size, date and notes', async () => {
    service.getAll.mockResolvedValue(listOf([asset]))
    renderWithProviders(<MediaList />)

    expect(await screen.findByText('type: image/png')).toBeInTheDocument()
    expect(screen.getByText('size: 2.50 MB')).toBeInTheDocument()
    expect(screen.getByText(/Mar 15, 2024 9:30 AM/)).toBeInTheDocument()
    expect(screen.getByText('A picture')).toBeInTheDocument()
    expect(screen.getByAltText('A picture')).toHaveAttribute('src', 'https://x.test/a.png')
    expect(service.getAll).toHaveBeenCalledWith({
      where: JSON.stringify({ isActive: true }),
      sort: 'createdAt:DESC',
      currentPage: 1,
    })
  })

  test('copes with an asset with no size, url or notes', async () => {
    service.getAll.mockResolvedValue(listOf([{ id: 'as-3', type: 'file' } as IAsset]))
    renderWithProviders(<MediaList />)
    expect(await screen.findByText('size: 0.00 KB')).toBeInTheDocument()
  })

  test('shows the empty state', async () => {
    service.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<MediaList />)
    expect(await screen.findByText('No data', { selector: '.ant-empty-description' })).toBeInTheDocument()
  })

  test('spins during the first load', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(request.promise as never)
    const { container } = renderWithProviders(<MediaList />)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(listOf([]))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('appends the next page and hides the button on the last one', async () => {
    service.getAll
      .mockResolvedValueOnce(listOf([asset], { currentPage: 1, pages: 2 }))
      .mockResolvedValueOnce(listOf([other], { currentPage: 2, pages: 2 }))
    renderWithProviders(<MediaList />)
    fireEvent.click(await screen.findByRole('button', { name: /load more/i }))

    expect(await screen.findByText('Another')).toBeInTheDocument()
    expect(screen.getByText('A picture')).toBeInTheDocument()
    expect(service.getAll.mock.lastCall?.[0]?.currentPage).toBe(2)
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })

  test('reports a failed load', async () => {
    service.getAll.mockRejectedValue(httpError('denied'))
    renderWithProviders(<MediaList />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('denied'))
  })

  test('ignores a reply and a failure that arrive after unmount', async () => {
    const first = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(first.promise as never)
    renderWithProviders(<MediaList />).unmount()
    first.resolve(listOf([asset]))
    await first.promise

    const second = deferred<never>()
    service.getAll.mockReturnValue(second.promise)
    renderWithProviders(<MediaList />).unmount()
    second.reject(httpError('late'))
    await second.promise.catch(() => undefined)
    expect(message.error).not.toHaveBeenCalled()
  })

  test('deletes an asset after confirmation and removes it', async () => {
    service.getAll.mockResolvedValue(listOf([asset, other]))
    service.deactivate.mockResolvedValue(asset)
    renderWithProviders(<MediaList />)
    await screen.findByText('A picture')
    await removeFirst()

    await waitFor(() => expect(screen.queryByText('A picture')).not.toBeInTheDocument())
    expect(service.deactivate).toHaveBeenCalledWith('as-1')
    expect(screen.getByText('Another')).toBeInTheDocument()
  })

  test('keeps the asset and reports when the delete fails', async () => {
    service.getAll.mockResolvedValue(listOf([asset]))
    service.deactivate.mockRejectedValue(httpError('denied'))
    renderWithProviders(<MediaList />)
    await screen.findByText('A picture')
    await removeFirst()

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Failed to delete selected media: denied'))
    expect(screen.getByText('A picture')).toBeInTheDocument()
  })

  // SMN-80: one image library, so Media says where the website uses an image and why it can't be deleted.
  describe('with the website builder on', () => {
    const withWebsite = { state: { auth: { company: { id: 'co-1', websiteBuilderEnabled: true } } } }
    const uses = [{ pageId: 'p-1', pageTitle: 'Home', published: false }, { published: true }]

    test('shows where the website uses each image', async () => {
      service.getAll.mockResolvedValue(listOf([asset, other]))
      vi.mocked(WebsiteService.getImageUsage).mockResolvedValue({ 'as-1': uses, 'as-2': [] })
      renderWithProviders(<MediaList />, withWebsite as never)

      expect(await screen.findByText('Used in: Home, the published website')).toBeInTheDocument()
      expect(WebsiteService.getImageUsage).toHaveBeenCalledWith(['as-1', 'as-2'])
      expect(screen.getAllByText(/^Used in:/)).toHaveLength(1)
    })

    test('asks for usage in batches of 100, the API limit', async () => {
      const many = Array.from({ length: 150 }, (_, i) => ({ ...asset, id: `as-${i}`, comments: `Pic ${i}` }))
      service.getAll.mockResolvedValue(listOf(many as IAsset[]))
      vi.mocked(WebsiteService.getImageUsage).mockResolvedValue({})
      renderWithProviders(<MediaList />, withWebsite as never)

      await waitFor(() => expect(WebsiteService.getImageUsage).toHaveBeenCalledTimes(2))
      expect(vi.mocked(WebsiteService.getImageUsage).mock.calls.map(([ids]) => ids.length)).toEqual([100, 50])
    })

    test('a failed usage check leaves the list as it is', async () => {
      service.getAll.mockResolvedValue(listOf([asset]))
      vi.mocked(WebsiteService.getImageUsage).mockRejectedValue(new Error('down'))
      renderWithProviders(<MediaList />, withWebsite as never)

      expect(await screen.findByText('A picture')).toBeInTheDocument()
      expect(message.error).not.toHaveBeenCalled()
    })

    test('a delete the API refuses because the website uses the image says where, and keeps it', async () => {
      service.getAll.mockResolvedValue(listOf([asset]))
      vi.mocked(WebsiteService.getImageUsage).mockResolvedValue({ 'as-1': [] })
      service.deactivate.mockRejectedValue(
        Object.assign(new Error('status 409'), { response: { status: 409, data: { usedBy: uses } } }),
      )
      renderWithProviders(<MediaList />, withWebsite as never)
      await screen.findByText('A picture')
      await removeFirst()

      await waitFor(() =>
        expect(message.error).toHaveBeenCalledWith(
          'This image is in use (Home, the published website), so it was not deleted.',
        ),
      )
      expect(screen.getByText('A picture')).toBeInTheDocument()
      expect(screen.getByText('Used in: Home, the published website')).toBeInTheDocument()
    })
  })

  test('without the website builder, no website usage is asked for', async () => {
    service.getAll.mockResolvedValue(listOf([asset]))
    renderWithProviders(<MediaList />)
    await screen.findByText('A picture')
    expect(WebsiteService.getImageUsage).not.toHaveBeenCalled()
  })

  test('ignores delete for an asset that has no id', async () => {
    service.getAll.mockResolvedValue(listOf([{ ...asset, id: ' ' } as IAsset]))
    renderWithProviders(<MediaList />)
    await screen.findByText('A picture')
    await removeFirst()
    expect(service.deactivate).not.toHaveBeenCalled()
  })

  test('filters by the search keyword', async () => {
    service.getAll.mockResolvedValue(listOf([asset]))
    renderWithProviders(<MediaList keyword="cat" />)
    await screen.findByText('A picture')
    expect(service.getAll.mock.lastCall?.[0]?.where).toContain('cat')
  })

  test('a new keyword starts again from page one', async () => {
    const Parent = () => {
      const [keyword, setKeyword] = useState('')
      return (
        <>
          <button onClick={() => setKeyword('cat')}>search</button>
          <MediaList keyword={keyword} />
        </>
      )
    }
    service.getAll
      .mockResolvedValueOnce(listOf([asset], { currentPage: 1, pages: 3 }))
      .mockResolvedValueOnce(listOf([other], { currentPage: 2, pages: 3 }))
      .mockResolvedValue(listOf([other], { currentPage: 1, pages: 1 }))
    renderWithProviders(<Parent />)
    fireEvent.click(await screen.findByRole('button', { name: /load more/i }))
    await screen.findByText('Another')
    fireEvent.click(screen.getByRole('button', { name: 'search' }))
    await waitFor(() => expect(service.getAll).toHaveBeenCalledTimes(3))
    expect(service.getAll.mock.lastCall?.[0]?.currentPage).toBe(1)
  })
})

describe('CompanyMediaUsage', () => {
  test('shows the storage figure, the unlimited plan and a link to media', async () => {
    service.getTotalSize.mockResolvedValue({ totalSize: 0 })
    renderWithProviders(<CompanyMediaUsage />)

    expect(await screen.findByText('Storage')).toBeInTheDocument()
    expect(screen.getByText(/unlimited/i)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/b/media')
    expect(service.getTotalSize).toHaveBeenCalledTimes(1)
  })

  test('shows the plan\'s limit', async () => {
    service.getTotalSize.mockResolvedValue({ totalSize: 0, maxSize: 2147483648 })
    renderWithProviders(<CompanyMediaUsage />)

    expect(await screen.findByText(/2 GB/)).toBeInTheDocument()
    expect(screen.queryByText(/unlimited/i)).not.toBeInTheDocument()
  })

  test('spins while loading', async () => {
    const request = deferred<{ totalSize: number }>()
    service.getTotalSize.mockReturnValue(request.promise)
    const { container } = renderWithProviders(<CompanyMediaUsage />)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve({ totalSize: 0 })
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('reports a failed load', async () => {
    service.getTotalSize.mockRejectedValue(httpError('denied'))
    renderWithProviders(<CompanyMediaUsage />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('denied'))
  })

  test('does not report the file count as a storage size', async () => {
    service.getAll.mockResolvedValue(listOf([], { total: 2000 }))
    service.getTotalSize.mockResolvedValue({ totalSize: 2500000 })
    const { container } = renderWithProviders(<CompanyMediaUsage />)
    await waitFor(() => expect(container.textContent).toContain('2.50 MB'))
    expect(container.textContent).not.toContain('2.00 KB')
    expect(service.getAll).not.toHaveBeenCalled()
  })
})
