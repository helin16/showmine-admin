const CAPTURE_TIMEOUT_MS = 8000
const MAX_WIDTH = 960
const JPEG_QUALITY = 0.8
const SEEK_SECONDS = 1
// WebKit finishes a seek to exactly 0 before any frame is decoded, and the draw comes out blank.
const START_SECONDS = 0.001
const NEARLY_BLACK_LUMA = 16

export const withTimeout = <T>(work: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  })
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}

const waitFor = (video: HTMLVideoElement, event: string) => new Promise<void>((resolve, reject) => {
  video.addEventListener(event, () => resolve(), { once: true })
  video.addEventListener('error', () => reject(new Error('The browser could not read this video.')), { once: true })
})

const isNearlyBlack = ({ data }: ImageData) => {
  let luma = 0
  for (let i = 0; i < data.length; i += 4) {
    luma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return luma / (data.length / 4) < NEARLY_BLACK_LUMA
}

const captureFrame = async (video: HTMLVideoElement, url: string) => {
  const metadata = waitFor(video, 'loadedmetadata')
  video.src = url
  await metadata
  // A file can open with only its audio readable, such as HEVC on some browsers.
  if (video.videoWidth === 0) {
    throw new Error('The browser could not decode this video.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.min(video.videoWidth, MAX_WIDTH)
  canvas.height = Math.round((video.videoHeight * canvas.width) / video.videoWidth)
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas is not available.')
  }

  const drawAt = async (time: number) => {
    const seeked = waitFor(video, 'seeked')
    video.currentTime = time
    await seeked
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
  }
  const first = video.duration < SEEK_SECONDS ? START_SECONDS : SEEK_SECONDS
  await drawAt(first)
  if (isNearlyBlack(context.getImageData(0, 0, canvas.width, canvas.height))) {
    await drawAt(Math.min(first + 2, (first + video.duration) / 2))
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The cover could not be exported.'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

/**
 * Takes a cover from the file on the author's machine, so cross-origin data can never taint the canvas.
 * Rejects when the browser cannot read the file in time.
 */
export const captureVideoCover = async (file: File): Promise<Blob> => {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  try {
    return await withTimeout(captureFrame(video, url), CAPTURE_TIMEOUT_MS)
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
  }
}
