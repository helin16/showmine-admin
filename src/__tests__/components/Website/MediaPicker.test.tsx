import React from 'react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import MediaPicker, { formatSize, ImageLibrary } from '../../../Components/Website/MediaPicker'
import WebsiteService from '../../../Services/WebsiteService'
import AppService from '../../../Services/AppService'
import message from '../../../Components/Form/message'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../Access/domHelpers'
import { FakeXHR } from '../Form/fakeXhr'

// The website image library and picker (specs/001-website-builder, US5, T058).
vi.mock('../../../Services/WebsiteService', () => ({
  default: { getImages: vi.fn(), getImageUploadUrl: () => 'https://api.test/website/images' },
}))
vi.mock('../../../Services/AppService', () => ({
  default: { getHeaders: vi.fn(), getUploadFailure: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

const image = (id: string, extra = {}) => ({
  id,
  url: `https://cdn.test/${id}.png`,
  fileName: `${id}.png`,
  fileSize: 2048,
  type: 'WEBSITE',
  companyId: 'co-1',
  ...extra,
})
const page = (data: object[], currentPage = 1, pages = 1) => ({ data, currentPage, pages, total: data.length })
const auth = { auth: { company: { id: 'co-1', websiteBuilderEnabled: true } } }
const fileInput = () => document.querySelector('input[type=file]') as HTMLInputElement

beforeAll(() => stubMatchMedia())
beforeEach(() => {
  FakeXHR.instances = []
  vi.stubGlobal('XMLHttpRequest', FakeXHR)
  vi.mocked(AppService.getHeaders).mockReturnValue({ headers: { Authorization: 'Bearer tok', comid: 'co-1' } } as never)
})
afterEach(() => vi.unstubAllGlobals())

describe('ImageLibrary', () => {
  test('lists the website images with name and size, and loads more on demand', async () => {
    vi.mocked(WebsiteService.getImages)
      .mockResolvedValueOnce(page([image('a1')], 1, 2) as never)
      .mockResolvedValueOnce(page([image('a2', { fileSize: 3 * 1024 * 1024 })], 2, 2) as never)
    renderWithProviders(<ImageLibrary />, { state: auth })

    expect(await screen.findByRole('img', { name: 'a1.png' })).toHaveAttribute('src', 'https://cdn.test/a1.png')
    expect(screen.getByText('a1.png · 2 KB')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))

    expect(await screen.findByText('a2.png · 3.0 MB')).toBeInTheDocument()
    expect(WebsiteService.getImages).toHaveBeenLastCalledWith(2)
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
  })

  test('no images yet says so', async () => {
    vi.mocked(WebsiteService.getImages).mockResolvedValue(page([]) as never)
    renderWithProviders(<ImageLibrary />, { state: auth })
    expect(await screen.findByText('No website images yet. Upload one above.')).toBeInTheDocument()
  })

  test('a failed load can be tried again', async () => {
    vi.mocked(WebsiteService.getImages).mockRejectedValueOnce(new Error('Server down'))
    renderWithProviders(<ImageLibrary />, { state: auth })
    expect(await screen.findByText('The images could not be loaded: Server down')).toBeInTheDocument()
    vi.mocked(WebsiteService.getImages).mockResolvedValue(page([image('a1')]) as never)
    fireEvent.click(screen.getByRole('button', { name: /Try again/ }))
    expect(await screen.findByRole('img', { name: 'a1.png' })).toBeInTheDocument()
  })

  describe('upload', () => {
    beforeEach(() => vi.mocked(WebsiteService.getImages).mockResolvedValue(page([image('a1')]) as never))

    test('sends the file to the website image route, shows progress, and adds the new image first', async () => {
      const onUploaded = vi.fn()
      renderWithProviders(<ImageLibrary onUploaded={onUploaded} />, { state: auth })
      await screen.findByRole('img', { name: 'a1.png' })

      await userEvent.upload(fileInput(), new File(['img'], 'new.png', { type: 'image/png' }))
      await waitFor(() => expect(FakeXHR.last?.body).toBeDefined())
      const xhr = FakeXHR.last
      expect(xhr.url).toBe('https://api.test/website/images')
      expect(xhr.headers).toMatchObject({ Authorization: 'Bearer tok', comid: 'co-1' })
      expect((xhr.body?.get('file') as File).name).toBe('new.png')
      act(() => xhr.upload.onprogress?.({ loaded: 1, total: 2 }))
      expect(await screen.findByText('50%')).toBeInTheDocument()

      act(() => xhr.respond(200, image('n1', { fileName: 'new.png' })))
      await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(image('n1', { fileName: 'new.png' })))
      expect(screen.getAllByRole('img')[0]).toHaveAttribute('alt', 'new.png')
      expect(message.success).toHaveBeenCalledWith('new.png uploaded.')
    })

    test.each([
      [
        'a PDF',
        new File(['x'], 'a.pdf', { type: 'application/pdf' }),
        'Only JPEG, PNG, WebP or GIF images can be used.',
      ],
      [
        'an SVG',
        new File(['x'], 'a.svg', { type: 'image/svg+xml' }),
        'Only JPEG, PNG, WebP or GIF images can be used.',
      ],
    ])('refuses %s before sending it', async (_name, file, text) => {
      renderWithProviders(<ImageLibrary />, { state: auth })
      await screen.findByRole('img', { name: 'a1.png' })
      await userEvent.upload(fileInput(), file, { applyAccept: false })
      await waitFor(() => expect(message.error).toHaveBeenCalledWith(text))
      expect(FakeXHR.instances).toHaveLength(0)
    })

    test('refuses a file over 10 MB before sending it', async () => {
      renderWithProviders(<ImageLibrary />, { state: auth })
      await screen.findByRole('img', { name: 'a1.png' })
      const big = new File(['x'], 'big.png', { type: 'image/png' })
      Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 })
      await userEvent.upload(fileInput(), big)
      await waitFor(() => expect(message.error).toHaveBeenCalledWith('The image is over 10 MB.'))
      expect(FakeXHR.instances).toHaveLength(0)
    })

    test.each([
      [400, 'Only JPEG, PNG, WebP or GIF images can be used.'],
      [413, 'The image is over 10 MB.'],
      [403, 'Your plan has no room for this image. Delete unused images or change your plan.'],
    ])('the API refusing with %i is said in words', async (status, text) => {
      renderWithProviders(<ImageLibrary />, { state: auth })
      await screen.findByRole('img', { name: 'a1.png' })
      await userEvent.upload(fileInput(), new File(['img'], 'x.png', { type: 'image/png' }))
      await waitFor(() => expect(FakeXHR.last?.body).toBeDefined())
      act(() => FakeXHR.last.respond(status, { message: 'refused' }))
      await waitFor(() => expect(message.error).toHaveBeenCalledWith(text))
    })
  })
})

describe('MediaPicker', () => {
  beforeEach(() =>
    vi.mocked(WebsiteService.getImages).mockResolvedValue(page([image('a1'), image('a2'), image('a3')]) as never),
  )

  test('picks one image; picking another replaces it', async () => {
    const onPick = vi.fn()
    renderWithProviders(<MediaPicker open onCancel={vi.fn()} onPick={onPick} />, { state: auth })
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Use 0 images' })).toBeDisabled()

    fireEvent.click(await within(dialog).findByRole('button', { name: 'Select a1.png' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Select a2.png' }))
    expect(within(dialog).getByRole('button', { name: 'Select a2.png' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Use 1 image' }))

    expect(onPick).toHaveBeenCalledWith([image('a2')])
  })

  test('picks several in the order clicked, up to the limit', async () => {
    const onPick = vi.fn()
    renderWithProviders(<MediaPicker open multiple max={2} onCancel={vi.fn()} onPick={onPick} />, { state: auth })
    const dialog = await screen.findByRole('dialog')

    fireEvent.click(await within(dialog).findByRole('button', { name: 'Select a3.png' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Select a1.png' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Select a2.png' }))
    expect(message.error).toHaveBeenCalledWith('At most 2 more images can be added.')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Use 2 images' }))

    expect(onPick).toHaveBeenCalledWith([image('a3'), image('a1')])
  })

  test('cancelling picks nothing', async () => {
    const onCancel = vi.fn()
    const onPick = vi.fn()
    renderWithProviders(<MediaPicker open onCancel={onCancel} onPick={onPick} />, { state: auth })
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onPick).not.toHaveBeenCalled()
  })

  test('a closed picker shows nothing and loads nothing', () => {
    renderWithProviders(<MediaPicker open={false} onCancel={vi.fn()} onPick={vi.fn()} />, { state: auth })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(WebsiteService.getImages).not.toHaveBeenCalled()
  })
})

test('formatSize gives KB below a megabyte and MB above', () => {
  expect(formatSize(0)).toBe('1 KB')
  expect(formatSize(1536)).toBe('2 KB')
  expect(formatSize(5 * 1024 * 1024)).toBe('5.0 MB')
})
