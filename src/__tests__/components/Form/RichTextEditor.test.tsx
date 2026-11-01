import React from 'react'
import { act, render, screen } from '@testing-library/react'
import RichTextEditor from '../../../Components/Form/RichTextEditor'
import message from '../../../Components/Form/message'
import AppService from '../../../Services/AppService'
import AssetService from '../../../Services/AssetService'
import { captureVideoCover } from '../../../Helpers/VideoCoverHelper'
import translate from '../../../i18n/translate'
import { FakeXHR } from './fakeXhr'

const editor = vi.hoisted(() => ({ props: {} as Record<string, any> })) // eslint-disable-line

vi.mock('../../../Services/AppService')
vi.mock('../../../Services/AssetService')
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), warning: vi.fn() } }))
vi.mock('../../../Helpers/VideoCoverHelper', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  captureVideoCover: vi.fn(),
}))
vi.mock('@tinymce/tinymce-react', () => ({
  Editor: (props: Record<string, unknown>) => {
    editor.props = props
    return <div data-testid='editor'>{props.value as string}</div>
  },
}))

const UPLOAD_URL = 'https://api.test/asset/upload'
const tick = () => new Promise((resolve) => setTimeout(resolve))
const pendingOr = (promise: Promise<unknown>) => Promise.race([promise, tick().then(() => 'still pending')])

beforeEach(() => {
  FakeXHR.instances = []
  vi.stubGlobal('XMLHttpRequest', FakeXHR)
  vi.mocked(AssetService.getUploadAssetUrl).mockReturnValue(UPLOAD_URL)
  vi.mocked(AppService.getHeaders).mockReturnValue({ headers: { Authorization: 'Bearer tok', comid: 'co-1' } } as never)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('editing', () => {
  test('shows the value and applies the settings', () => {
    process.env.REACT_APP_TINYMCE_API_KEY = 'tiny-key'
    render(<RichTextEditor className='body' value='<p>Hi</p>' placeholder='Write here' isInLine />)
    expect(screen.getByTestId('editor')).toHaveTextContent('<p>Hi</p>')
    expect(screen.getByTestId('editor').parentElement).toHaveClass('body')
    expect(editor.props.apiKey).toBe('tiny-key')
    expect(editor.props.cloudChannel).toBe('6')
    expect(editor.props.init).toMatchObject({ placeholder: 'Write here', inline: true, menubar: true })
    expect(editor.props.init.plugins).toContain('autoresize')
  })

  test('uses a block editor, a blank placeholder and no menu when asked', () => {
    render(<RichTextEditor value='' showToolBar={false} />)
    expect(editor.props.init).toMatchObject({ placeholder: '', inline: false, menubar: false })
  })

  test('passes extra props to the editor', () => {
    const extra = { disabled: true } as object
    render(<RichTextEditor value='' {...extra} />)
    expect(editor.props.disabled).toBe(true)
  })

  test('follows a new value from the parent', () => {
    const { rerender } = render(<RichTextEditor value='one' />)
    rerender(<RichTextEditor value='two' />)
    expect(screen.getByTestId('editor')).toHaveTextContent('two')
  })

  test('saves the typed content on blur, not while typing', () => {
    const onChange = vi.fn()
    render(<RichTextEditor value='' onChange={onChange} />)
    act(() => editor.props.onEditorChange('new text'))
    expect(screen.getByTestId('editor')).toHaveTextContent('new text')
    expect(onChange).not.toHaveBeenCalled()
    act(() => editor.props.onBlur())
    expect(onChange).toHaveBeenCalledWith('new text')
  })

  test('keeps the typed content on blur without onChange', () => {
    render(<RichTextEditor value='' />)
    act(() => editor.props.onEditorChange('new text'))
    act(() => editor.props.onBlur())
    expect(screen.getByTestId('editor')).toHaveTextContent('new text')
  })

  test('adds the autoresize plugin only once', () => {
    const { rerender } = render(<RichTextEditor value='one' />)
    rerender(<RichTextEditor value='two' />)
    rerender(<RichTextEditor value='three' />)
    const added = editor.props.init.plugins.filter((name: string) => name === 'autoresize')
    expect(added).toHaveLength(1)
  })
})

describe('image upload', () => {
  const blobInfo = { blob: () => new Blob(['img'], { type: 'image/png' }), filename: () => 'a.png' }
  const upload = (assetType?: string, progress: (n: number) => void = () => undefined) => {
    render(<RichTextEditor value='' assetType={assetType} />)
    const result = editor.props.init.images_upload_handler(blobInfo, progress) as Promise<string>
    return { result, xhr: FakeXHR.last }
  }

  test('posts the file with the session and company headers', async () => {
    const { result, xhr } = upload()
    expect(xhr.method).toBe('POST')
    expect(xhr.url).toBe(UPLOAD_URL)
    expect(xhr.withCredentials).toBe(false)
    expect(xhr.headers).toEqual({ Authorization: 'Bearer tok', comid: 'co-1' })
    expect((xhr.body?.get('file') as File).name).toBe('a.png')
    expect(xhr.body?.has('type')).toBe(false)
    xhr.respond(200, { url: 'https://cdn.test/a.png' })
    await expect(result).resolves.toBe('https://cdn.test/a.png')
  })

  test('sends the trimmed asset type', () => {
    expect(upload(' banner ').xhr.body?.get('type')).toBe('banner')
  })

  test('sends no type for a blank asset type', () => {
    expect(upload('   ').xhr.body?.has('type')).toBe(false)
  })

  test('sends blank header values as empty strings', () => {
    vi.mocked(AppService.getHeaders).mockReturnValue({ headers: { comid: undefined } } as never)
    expect(upload().xhr.headers).toEqual({ comid: '' })
  })

  test('works when there are no headers', () => {
    vi.mocked(AppService.getHeaders).mockReturnValue({} as never)
    expect(upload().xhr.headers).toEqual({})
  })

  test('reports progress as a percentage', () => {
    const progress = vi.fn()
    upload(undefined, progress).xhr.upload.onprogress?.({ loaded: 1, total: 4 })
    expect(progress).toHaveBeenCalledWith(25)
  })

  test('a 403 rejects and removes the image', async () => {
    const { result, xhr } = upload()
    xhr.respond(403, '')
    await expect(result).rejects.toEqual({ message: 'HTTP Error: 403', remove: true })
  })

  test('a failure with its own message says that, and passes on what came back', async () => {
    vi.mocked(AppService.getUploadFailure).mockReturnValueOnce('Too big')
    const { result, xhr } = upload()
    xhr.respond(413, 'nope')
    await expect(result).rejects.toEqual({ message: 'Too big' })
    expect(AppService.getUploadFailure).toHaveBeenLastCalledWith(413, 'nope')
  })

  test.each([[199], [300], [500]])('status %i rejects', async (status) => {
    const { result, xhr } = upload()
    xhr.respond(status, '')
    await expect(result).rejects.toEqual({ message: `HTTP Error: ${status}` })
  })

  test('the last 2xx status is a success', async () => {
    const { result, xhr } = upload()
    xhr.respond(299, { url: 'u' })
    await expect(result).resolves.toBe('u')
  })

  test.each([['null'], ['{"url":1}']])('rejects the reply %s', async (body) => {
    const { result, xhr } = upload()
    xhr.respond(200, body)
    await expect(result).rejects.toEqual({ message: `Invalid JSON: ${body}` })
  })

  test('rejects on a network failure', async () => {
    const { result, xhr } = upload()
    xhr.status = 0
    xhr.onerror?.()
    await expect(result).rejects.toEqual({ message: 'Image upload failed due to a XHR Transport error. Code: 0' })
  })

  test('rejects a reply that is not JSON', async () => {
    const { result, xhr } = upload()
    expect(() => xhr.respond(200, '<html>Bad gateway</html>')).not.toThrow()
    await expect(pendingOr(result)).rejects.toBeDefined()
  })

  test('survives a progress event with an unknown total', () => {
    const { xhr } = upload()
    expect(() => xhr.upload.onprogress?.({ loaded: 0, total: 0 })).not.toThrow()
  })
})

describe('video upload button', () => {
  const tiny = {
    ui: { registry: { addButton: vi.fn() } },
    setProgressState: vi.fn(),
    insertContent: vi.fn(),
  }
  const video = new File(['v'], 'clip.mp4', { type: 'video/mp4' })
  const cover = new Blob(['jpeg'], { type: 'image/jpeg' })
  const uploaded = { url: 'https://cdn.test/v/clip.mp4', fileType: 'video/mp4' }
  const coverUrl = 'https://cdn.test/v/cover.jpg'

  beforeEach(() => {
    vi.mocked(captureVideoCover).mockResolvedValue(cover)
  })

  // The video finishes, then the cover capture settles and the cover upload starts.
  const finishVideo = async (xhr: FakeXHR) => {
    xhr.respond(200, uploaded)
    await tick()
    return FakeXHR.last
  }

  const pick = (files: File[] | null = [video], assetType?: string) => {
    let input = document.createElement('input')
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- the fake must capture the instance XHR consumers hold
      input = this
    })
    render(<RichTextEditor value='' assetType={assetType} />)
    editor.props.init.setup(tiny)
    const [name, button] = tiny.ui.registry.addButton.mock.calls[0]
    expect(name).toBe('customInsertButton')
    button.onAction()
    Object.defineProperty(input, 'files', { value: files })
    ;(input.onchange as () => void)()
    return { input, xhr: FakeXHR.last }
  }

  test('opens a file picker for videos', () => {
    expect(pick().input.accept).toBe('video/*')
  })

  test('does nothing when no file list is available', () => {
    expect(pick(null).xhr).toBeUndefined()
  })

  test('uploads with the headers and the trimmed asset type', () => {
    const { xhr } = pick([video], ' clip ')
    expect(xhr.url).toBe(UPLOAD_URL)
    expect(xhr.withCredentials).toBe(false)
    expect(xhr.headers).toEqual({ Authorization: 'Bearer tok', comid: 'co-1' })
    expect(xhr.body?.get('file')).toEqual(video)
    expect(xhr.body?.get('type')).toBe('clip')
  })

  test('sends no type for a blank asset type, and blank headers as empty strings', () => {
    vi.mocked(AppService.getHeaders).mockReturnValue({ headers: { comid: undefined } } as never)
    const { xhr } = pick()
    expect(xhr.body?.has('type')).toBe(false)
    expect(xhr.headers).toEqual({ comid: '' })
  })

  test('works when there are no headers', () => {
    vi.mocked(AppService.getHeaders).mockReturnValue({} as never)
    expect(pick().xhr.headers).toEqual({})
  })

  test('shows progress, then inserts the player with the captured cover', async () => {
    const { xhr } = pick([video], ' clip ')
    expect(captureVideoCover).toHaveBeenCalledWith(video)
    xhr.upload.onprogress?.({ loaded: 1, total: 2 })
    expect(tiny.setProgressState).toHaveBeenLastCalledWith(true)
    const coverXhr = await finishVideo(xhr)
    expect(coverXhr).not.toBe(xhr)
    expect(coverXhr.url).toBe(UPLOAD_URL)
    expect(coverXhr.headers).toEqual({ Authorization: 'Bearer tok', comid: 'co-1' })
    expect(coverXhr.body?.get('type')).toBe('clip')
    expect(coverXhr.body?.get('file')).toMatchObject({ name: 'clip.mp4-cover.jpg', type: 'image/jpeg' })
    expect(tiny.setProgressState).toHaveBeenLastCalledWith(true)
    expect(tiny.insertContent).not.toHaveBeenCalled()
    coverXhr.respond(200, { url: coverUrl })
    await tick()
    expect(tiny.setProgressState).toHaveBeenLastCalledWith(false)
    const html = tiny.insertContent.mock.calls[0][0]
    expect(html).toContain(`<video width='100%' height='240px' poster='${coverUrl}' controls="controls">`)
    expect(html).toContain('<source src=\'https://cdn.test/v/clip.mp4\' type=\'video/mp4\'/>')
    expect(message.warning).not.toHaveBeenCalled()
    expect(message.error).not.toHaveBeenCalled()
  })

  test('does not hold the video upload back while capturing', () => {
    vi.mocked(captureVideoCover).mockReturnValue(new Promise(() => undefined))
    expect(pick().xhr.body?.get('file')).toEqual(video)
  })

  const expectInsertedWithoutPoster = () => {
    expect(tiny.setProgressState).toHaveBeenLastCalledWith(false)
    const html = tiny.insertContent.mock.calls[0][0]
    expect(html).toContain('<source src=\'https://cdn.test/v/clip.mp4\'')
    expect(html).not.toContain('poster')
    expect(message.warning).toHaveBeenCalledWith(translate('video-cover-failed'))
    expect(message.error).not.toHaveBeenCalled()
  }

  test('inserts without a poster, with a notice, when capture fails or times out', async () => {
    vi.mocked(captureVideoCover).mockRejectedValue(new Error('Timed out'))
    const { xhr } = pick()
    expect(await finishVideo(xhr)).toBe(xhr)
    expectInsertedWithoutPoster()
  })

  test.each([
    ['a failed status', (xhr: FakeXHR) => xhr.respond(500, '')],
    ['an invalid reply', (xhr: FakeXHR) => xhr.respond(200, 'null')],
    ['a network failure', (xhr: FakeXHR) => xhr.onerror?.()],
  ])('inserts without a poster, with a notice, when the cover upload hits %s', async (_name, fail) => {
    fail(await finishVideo(pick().xhr))
    await tick()
    expectInsertedWithoutPoster()
  })

  test('inserts without a poster, with a notice, when the cover upload hangs', async () => {
    const { xhr } = pick()
    vi.useFakeTimers()
    xhr.respond(200, uploaded)
    await vi.advanceTimersByTimeAsync(29999)
    expect(tiny.insertContent).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    vi.useRealTimers()
    expectInsertedWithoutPoster()
  })

  test('uploads no cover when the video upload fails', async () => {
    pick().xhr.respond(500, '')
    await tick()
    expect(FakeXHR.instances).toHaveLength(1)
    expect(message.warning).not.toHaveBeenCalled()
  })

  test('survives a capture failure after the video upload failed', async () => {
    vi.mocked(captureVideoCover).mockRejectedValue(new Error('no'))
    pick().xhr.respond(500, '')
    await tick()
    expect(message.warning).not.toHaveBeenCalled()
  })

  test.each([['null'], ['{"url":1}']])('shows an error for the reply %s', (body) => {
    pick().xhr.respond(200, body)
    expect(message.error).toHaveBeenCalledWith(`Invalid JSON: ${body}`)
    expect(tiny.insertContent).not.toHaveBeenCalled()
  })

  test('shows an error for a failed status', () => {
    pick().xhr.respond(500, '')
    expect(tiny.setProgressState).toHaveBeenLastCalledWith(false)
    expect(message.error).toHaveBeenCalledWith('Image upload failed due to a XHR Transport error. Code: 500')
  })

  test('a failed video with its own message says that', async () => {
    vi.mocked(AppService.getUploadFailure).mockReturnValueOnce('Too big')
    pick().xhr.respond(413, 'nope')
    await tick()
    expect(message.error).toHaveBeenCalledWith('Too big')
    expect(AppService.getUploadFailure).toHaveBeenLastCalledWith(413, 'nope')
    expect(tiny.insertContent).not.toHaveBeenCalled()
  })

  test('shows an error on a network failure', () => {
    const { xhr } = pick()
    xhr.onerror?.()
    expect(tiny.setProgressState).toHaveBeenLastCalledWith(false)
    expect(message.error).toHaveBeenCalledWith('Image upload failed due to a XHR Transport error. Code: 0')
  })

  test('shows an error for a reply that is not JSON', () => {
    const { xhr } = pick()
    try {
      xhr.respond(200, '<html>Bad gateway</html>')
    } catch {
      // The throw is the bug; the assertion below reports it.
    }
    expect(message.error).toHaveBeenCalled()
  })
})
