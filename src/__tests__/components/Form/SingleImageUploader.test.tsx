import React, { useState } from 'react'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../testUtils'
import SingleImageUploader from '../../../Components/Form/SingleImageUploader'
import message from '../../../Components/Form/message'
import AppService from '../../../Services/AppService'
import AssetService from '../../../Services/AssetService'
import { FakeXHR } from './fakeXhr'

vi.mock('../../../Services/AppService')
vi.mock('../../../Services/AssetService')
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn() } }))

const UPLOAD_URL = 'https://api.test/asset/upload'
const PROMPT = 'Click or drag file to this area to upload'
const png = new File(['img'], 'a.png', { type: 'image/png' })
const asset = { id: 'a-1', url: 'https://cdn.test/a.png' }

const fileInput = () => document.querySelector('input[type=file]') as HTMLInputElement
const image = () => document.querySelector('.img')
const spinner = () => document.querySelector('.percentage-wrapper')
// The button lives in an overlay that CSS shows only on hover.
const deleteButton = () => screen.getByRole('button', { hidden: true })

// Goes through the real antd upload: the user picks a file and the fake XHR plays the server.
const pickFile = async () => {
  await userEvent.upload(fileInput(), png)
  await waitFor(() => expect(FakeXHR.last?.body).toBeDefined())
  return FakeXHR.last
}

beforeEach(() => {
  FakeXHR.instances = []
  vi.stubGlobal('XMLHttpRequest', FakeXHR)
  vi.mocked(AssetService.getUploadAssetUrl).mockReturnValue(UPLOAD_URL)
  vi.mocked(AppService.getHeaders).mockReturnValue({ headers: { Authorization: 'Bearer tok', comid: 'co-1' } } as never)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('empty state', () => {
  test('shows the translated prompt and only accepts images', () => {
    renderWithProviders(<SingleImageUploader />)
    expect(screen.getByText(PROMPT)).toBeInTheDocument()
    expect(fileInput()).toHaveAttribute('accept', 'image/*')
    expect(document.querySelector('.anticon-upload')).toBeInTheDocument()
    expect(document.querySelector('.ant-upload-hint')).not.toBeInTheDocument()
  })

  test('shows a custom title, hint and icon', () => {
    renderWithProviders(<SingleImageUploader title='Upload logo' hint='PNG only' icon={<i data-testid='icon' />} />)
    expect(screen.getByText('Upload logo')).toBeInTheDocument()
    expect(screen.queryByText(PROMPT)).not.toBeInTheDocument()
    expect(screen.getByText('PNG only')).toHaveClass('ant-upload-hint')
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  test('passes other props to the wrapper', () => {
    renderWithProviders(<SingleImageUploader {...({ 'data-testid': 'wrapper' } as object)} />)
    expect(screen.getByTestId('wrapper')).toHaveClass('image-uploader-wrapper')
  })

  test('shows the prompt for a blank image url', () => {
    renderWithProviders(<SingleImageUploader initImgUrl='' />)
    expect(screen.getByText(PROMPT)).toBeInTheDocument()
    expect(image()).not.toBeInTheDocument()
  })

  test('shows access denied and no upload area without auth headers', () => {
    vi.mocked(AppService.getHeaders).mockReturnValue(null as never)
    renderWithProviders(<SingleImageUploader />)
    expect(message.error).toHaveBeenCalledWith('You are not authorize yet, please login and try again')
    expect(screen.queryByText(PROMPT)).not.toBeInTheDocument()
  })
})

describe('existing image', () => {
  test('shows the image with a delete button', () => {
    renderWithProviders(<SingleImageUploader initImgUrl={asset.url} />)
    expect(image()).toHaveStyle({ backgroundImage: `url(${asset.url})` })
    expect(screen.queryByText(PROMPT)).not.toBeInTheDocument()
  })

  test('deleting clears the image and reports null', async () => {
    const onChange = vi.fn()
    renderWithProviders(<SingleImageUploader initImgUrl={asset.url} onChange={onChange} />)
    await userEvent.click(deleteButton())
    expect(onChange).toHaveBeenCalledWith(null)
    expect(image()).not.toBeInTheDocument()
    expect(screen.getByText(PROMPT)).toBeInTheDocument()
  })

  test('deleting works without onChange', async () => {
    renderWithProviders(<SingleImageUploader initImgUrl={asset.url} />)
    await userEvent.click(deleteButton())
    expect(screen.getByText(PROMPT)).toBeInTheDocument()
  })

  // Bug: the effect returns early on a blank url, so a cleared initImgUrl keeps showing the old image.
  test.fails('clears the image when initImgUrl is cleared', async () => {
    const Host = () => {
      const [url, setUrl] = useState(asset.url)
      return (
        <>
          <SingleImageUploader initImgUrl={url} />
          <a onClick={() => setUrl('')}>clear</a>
        </>
      )
    }
    renderWithProviders(<Host />)
    expect(image()).toBeInTheDocument()
    await userEvent.click(screen.getByText('clear'))
    expect(image()).not.toBeInTheDocument()
  })
})

describe('uploading', () => {
  test('posts the file with the session and company headers', async () => {
    renderWithProviders(<SingleImageUploader assetType='avatar' />)
    const xhr = await pickFile()
    expect(xhr.method).toBe('post')
    expect(xhr.url).toBe(UPLOAD_URL)
    expect(xhr.headers).toMatchObject({ Authorization: 'Bearer tok', comid: 'co-1' })
    expect(xhr.body?.get('type')).toBe('avatar')
    expect((xhr.body?.get('file') as File).name).toBe('a.png')
  })

  test.each([[undefined], ['   ']])('sends no type for the asset type %j', async (assetType) => {
    renderWithProviders(<SingleImageUploader assetType={assetType} />)
    expect((await pickFile()).body?.has('type')).toBe(false)
  })

  test('shows the percentage while uploading and tells the parent it is saving', async () => {
    const onSetIsSaving = vi.fn()
    renderWithProviders(<SingleImageUploader onSetIsSaving={onSetIsSaving} />)
    const xhr = await pickFile()
    expect(onSetIsSaving).toHaveBeenCalledWith(true)
    act(() => xhr.upload.onprogress?.({ loaded: 1, total: 2 }))
    expect(await screen.findByText('50%')).toBeInTheDocument()
    expect(spinner()).toBeInTheDocument()
  })

  test('shows the new image and reports the asset when done', async () => {
    const onChange = vi.fn()
    renderWithProviders(<SingleImageUploader onChange={onChange} />)
    const xhr = await pickFile()
    act(() => xhr.respond(200, asset))
    await waitFor(() => expect(image()).toHaveStyle({ backgroundImage: `url(${asset.url})` }))
    expect(onChange).toHaveBeenCalledWith(asset)
    expect(spinner()).not.toBeInTheDocument()
  })

  test('finishes without onChange or onSetIsSaving', async () => {
    renderWithProviders(<SingleImageUploader />)
    const xhr = await pickFile()
    act(() => xhr.respond(200, asset))
    await waitFor(() => expect(image()).toBeInTheDocument())
  })

  test('returns to the prompt for an empty reply', async () => {
    renderWithProviders(<SingleImageUploader />)
    const xhr = await pickFile()
    act(() => xhr.respond(200, ''))
    await waitFor(() => expect(spinner()).not.toBeInTheDocument())
    expect(image()).not.toBeInTheDocument()
    expect(screen.getByText(PROMPT)).toBeInTheDocument()
  })

  // Bug: upload() ignores status 'error', so a failed upload leaves the progress spinner up with no message.
  test.fails('clears the spinner after a failed upload', async () => {
    renderWithProviders(<SingleImageUploader />)
    const xhr = await pickFile()
    act(() => xhr.respond(500, 'Server error'))
    await waitFor(() => expect(spinner()).not.toBeInTheDocument(), { timeout: 200 })
  })

  // Bug: onSetIsSaving(false) is never sent, so UserProfileEditor and CompanyEditor stay behind their Spin after a failure.
  test.fails('tells the parent saving stopped after a failed upload', async () => {
    const onSetIsSaving = vi.fn()
    renderWithProviders(<SingleImageUploader onSetIsSaving={onSetIsSaving} />)
    const xhr = await pickFile()
    act(() => xhr.respond(500, 'Server error'))
    await waitFor(() => expect(onSetIsSaving).toHaveBeenLastCalledWith(false), { timeout: 200 })
  })
})
