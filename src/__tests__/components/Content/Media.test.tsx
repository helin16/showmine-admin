import React, { useState } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import moment from 'moment'
import { vi } from 'vitest'
import message from '../../../Components/Form/message'
import CompanyMediaUsage from '../../../Components/Media/CompanyMediaUsage'
import MediaList from '../../../Components/Media/MediaList'
import AssetService from '../../../Services/AssetService'
import IAsset from '../../../Types/Asset/IAsset'
import { renderWithProviders } from '../../testUtils'
import { FIXED_DATE, deferred, httpError, listOf } from '../Article/fixtures'

vi.mock('../../../Services/AssetService', async (importOriginal) => {
  const actual = await importOriginal<{ default: { formatFileSize: unknown } }>()
  return {
    default: { getAll: vi.fn(), deactivate: vi.fn(), formatFileSize: actual.default.formatFileSize },
  }
})
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

// Importing translate.ts leaves moment on zh-cn, so fix the locale for the date assertions.
beforeEach(() => {
  moment.locale('en')
})

describe('MediaList', () => {
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
    expect(await screen.findByText('No data')).toBeInTheDocument()
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

  test('ignores delete for an asset that has no id', async () => {
    service.getAll.mockResolvedValue(listOf([{ ...asset, id: ' ' } as IAsset]))
    renderWithProviders(<MediaList />)
    await screen.findByText('A picture')
    await removeFirst()
    expect(service.deactivate).not.toHaveBeenCalled()
  })

  // Bug: the keyword re-fires the request but is never put in `where`, so media search changes nothing.
  test.fails('filters by the search keyword', async () => {
    service.getAll.mockResolvedValue(listOf([asset]))
    renderWithProviders(<MediaList keyword="cat" />)
    await screen.findByText('A picture')
    expect(service.getAll.mock.lastCall?.[0]?.where).toContain('cat')
  })

  // Bug: a keyword change keeps the current page, so results from page N are merged into the old list.
  test.fails('a new keyword starts again from page one', async () => {
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
    service.getAll.mockResolvedValue(listOf([], { total: 0 }))
    renderWithProviders(<CompanyMediaUsage />)

    expect(await screen.findByText('Storage')).toBeInTheDocument()
    expect(screen.getByText(/unlimited/i)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/b/media')
    expect(service.getAll).toHaveBeenCalledWith({
      where: JSON.stringify({ isActive: true }),
      perPage: 1,
      currentPage: 1,
    })
  })

  test('spins while loading', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(request.promise as never)
    const { container } = renderWithProviders(<CompanyMediaUsage />)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(listOf([]))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('reports a failed load', async () => {
    service.getAll.mockRejectedValue(httpError('denied'))
    renderWithProviders(<CompanyMediaUsage />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('denied'))
  })

  // Bug: `total` is the number of assets, but it is shown as a size, so 2,000 files reads as "2.00 KB".
  test.fails('does not report the file count as a storage size', async () => {
    service.getAll.mockResolvedValue(listOf([], { total: 2000 }))
    const { container } = renderWithProviders(<CompanyMediaUsage />)
    await screen.findByText('Storage')
    await waitFor(() => expect(service.getAll).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve))
    expect(container.textContent).not.toContain('2.00 KB')
  })
})
