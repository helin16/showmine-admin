import { captureVideoCover, withTimeout } from '../../Helpers/VideoCoverHelper'

const file = new File(['v'], 'clip.mp4', { type: 'video/mp4' })
const cover = new Blob(['jpeg'], { type: 'image/jpeg' })

// jsdom has no media or canvas, so these script what a browser would do.
class FakeVideo extends EventTarget {
  muted = false
  playsInline = false
  preload = ''
  videoWidth = 1920
  videoHeight = 1080
  duration = 10
  seeks: number[] = []
  removeAttribute = vi.fn()
  load = vi.fn()

  set src(_url: string) {
    queueMicrotask(() => this.dispatchEvent(new Event(this.opens)))
  }

  opens = 'loadedmetadata'

  set currentTime(time: number) {
    this.seeks.push(time)
    queueMicrotask(() => this.dispatchEvent(new Event('seeked')))
  }
}

const pixels = (level: number) => new Uint8ClampedArray(16).fill(level)

let video: FakeVideo
let canvas: {
  width: number
  height: number
  getContext: ReturnType<typeof vi.fn>
  toBlob: ReturnType<typeof vi.fn>
}
let context: { drawImage: ReturnType<typeof vi.fn>; getImageData: ReturnType<typeof vi.fn> }

beforeEach(() => {
  video = new FakeVideo()
  context = { drawImage: vi.fn(), getImageData: vi.fn().mockReturnValue({ data: pixels(128) }) }
  canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(context),
    toBlob: vi.fn((done: (blob: Blob | null) => void) => done(cover)),
  }
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) =>
    tag === 'video' ? video : canvas) as never)
  URL.createObjectURL = vi.fn().mockReturnValue('blob:local')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('captureVideoCover', () => {
  test('takes a JPEG from about one second into the local file', async () => {
    await expect(captureVideoCover(file)).resolves.toBe(cover)
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(video).toMatchObject({ muted: true, playsInline: true, preload: 'auto', seeks: [1] })
    expect(context.drawImage).toHaveBeenCalledWith(video, 0, 0, 960, 540)
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8)
  })

  test('keeps the size of a video narrower than the limit', async () => {
    Object.assign(video, { videoWidth: 640, videoHeight: 360 })
    await captureVideoCover(file)
    expect(canvas).toMatchObject({ width: 640, height: 360 })
  })

  test('keeps the shape of a portrait video', async () => {
    Object.assign(video, { videoWidth: 1080, videoHeight: 1920 })
    await captureVideoCover(file)
    expect(canvas).toMatchObject({ width: 960, height: 1707 })
  })

  test('seeks to the start of a video shorter than a second', async () => {
    video.duration = 0.5
    await captureVideoCover(file)
    expect(video.seeks).toEqual([0.001])
  })

  test('tries a later point once when the frame is nearly black', async () => {
    context.getImageData.mockReturnValue({ data: pixels(3) })
    await expect(captureVideoCover(file)).resolves.toBe(cover)
    expect(video.seeks).toEqual([1, 3])
    expect(context.drawImage).toHaveBeenCalledTimes(2)
  })

  test('stays inside a short video when retrying', async () => {
    context.getImageData.mockReturnValue({ data: pixels(3) })
    video.duration = 2
    await captureVideoCover(file)
    expect(video.seeks).toEqual([1, 1.5])
  })

  test('revokes the object URL and releases the video after a success', async () => {
    await captureVideoCover(file)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local')
    expect(video.removeAttribute).toHaveBeenCalledWith('src')
    expect(video.load).toHaveBeenCalled()
  })

  test('fails and revokes when the browser cannot read the file', async () => {
    video.opens = 'error'
    await expect(captureVideoCover(file)).rejects.toThrow()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local')
  })

  test('fails when the file has no picture the browser can decode', async () => {
    video.videoWidth = 0
    await expect(captureVideoCover(file)).rejects.toThrow()
  })

  test('fails without a drawing context', async () => {
    canvas.getContext.mockReturnValue(null)
    await expect(captureVideoCover(file)).rejects.toThrow()
  })

  test('fails when no JPEG comes out', async () => {
    canvas.toBlob.mockImplementation((done: (blob: Blob | null) => void) => done(null))
    await expect(captureVideoCover(file)).rejects.toThrow()
  })

  test('gives up after eight seconds and revokes', async () => {
    vi.useFakeTimers()
    video.opens = 'never'
    const failed = expect(captureVideoCover(file)).rejects.toThrow('Timed out')
    await vi.advanceTimersByTimeAsync(7999)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await failed
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local')
  })
})

describe('withTimeout', () => {
  test('passes on a result in time and leaves no timer', async () => {
    vi.useFakeTimers()
    await expect(withTimeout(Promise.resolve('ok'), 10)).resolves.toBe('ok')
    expect(vi.getTimerCount()).toBe(0)
  })
})
