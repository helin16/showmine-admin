import { vi } from 'vitest'

const flush = () => new Promise((resolve) => setTimeout(resolve))
const swUrl = '/service-worker.js'

type Worker = { state: string; onstatechange?: () => void }
type Registration = { installing: Worker | null; onupdatefound?: () => void; unregister: ReturnType<typeof vi.fn> }

const fakeRegistration = (installing: Worker | null = { state: 'installed' }): Registration => ({
  installing,
  unregister: vi.fn().mockResolvedValue(true),
})

const installContainer = (registration: Registration, controller: object | null = null) => {
  const container = {
    controller,
    register: vi.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
  }
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container })
  return container
}

/** isLocalhost is worked out on import, so each case imports the module afresh for its host name. */
const loadFor = async (hostname: string) => {
  const origin = `https://${hostname}`
  const reload = vi.fn()
  vi.stubGlobal('location', { hostname, origin, href: `${origin}/`, reload })
  vi.resetModules()
  return { reload, ...(await import('../../Services/serviceWorker')) }
}

/** Calls register() and returns its load listener, which stays out of the shared window. */
const registerAndGetLoad = (register: () => void) => {
  const add = vi.spyOn(window, 'addEventListener').mockImplementation(() => undefined)
  register()
  return add.mock.calls.find(([type]) => type === 'load')?.[1] as (() => void) | undefined
}

let log: ReturnType<typeof vi.spyOn>
let error: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  process.env.NODE_ENV = 'production'
  process.env.PUBLIC_URL = ''
  log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('register guards', () => {
  test('does nothing outside production', async () => {
    process.env.NODE_ENV = 'test'
    installContainer(fakeRegistration())
    const { register } = await loadFor('admin.test')
    expect(registerAndGetLoad(() => register())).toBeUndefined()
  })

  test('does nothing when the browser has no service worker support', async () => {
    const { register } = await loadFor('admin.test')
    expect(registerAndGetLoad(() => register())).toBeUndefined()
  })

  test('does nothing when the public url is on another origin', async () => {
    process.env.REACT_APP_PUBLIC_URL = 'https://cdn.test/app'
    installContainer(fakeRegistration())
    const { register } = await loadFor('admin.test')
    expect(registerAndGetLoad(() => register())).toBeUndefined()
  })
})

describe('on a real host', () => {
  test.each(['admin.test', '127.0.0.1.example.test'])('%s registers without probing the script', async (host) => {
    const container = installContainer(fakeRegistration())
    const { register } = await loadFor(host)
    registerAndGetLoad(() => register())?.()
    await flush()
    expect(container.register).toHaveBeenCalledExactlyOnceWith(swUrl)
    expect(fetch).not.toHaveBeenCalled()
  })

  test('logs a failed registration', async () => {
    const failure = new Error('boom')
    const container = installContainer(fakeRegistration())
    container.register.mockRejectedValue(failure)
    const { register } = await loadFor('admin.test')
    registerAndGetLoad(() => register())?.()
    await flush()
    expect(error).toHaveBeenCalledWith('Error during service worker registration:', failure)
  })

  const install = async (registration: Registration, controller: object | null) => {
    const onUpdate = vi.fn()
    const onSuccess = vi.fn()
    installContainer(registration, controller)
    const { register } = await loadFor('admin.test')
    registerAndGetLoad(() => register({ onUpdate, onSuccess }))?.()
    await flush()
    registration.onupdatefound?.()
    registration.installing?.onstatechange?.()
    return { onUpdate, onSuccess }
  }

  test('a new version over an old one calls onUpdate only', async () => {
    const registration = fakeRegistration()
    const { onUpdate, onSuccess } = await install(registration, {})
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(registration)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  test('a first install calls onSuccess only', async () => {
    const registration = fakeRegistration()
    const { onUpdate, onSuccess } = await install(registration, null)
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(registration)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  test('a worker still installing calls neither', async () => {
    const { onUpdate, onSuccess } = await install(fakeRegistration({ state: 'installing' }), {})
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  test('no installing worker calls neither', async () => {
    const { onUpdate, onSuccess } = await install(fakeRegistration(null), null)
    expect(onUpdate).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  test.each([
    [{}, 'New content is available'],
    [null, 'Content is cached'],
  ])('works without callbacks (controller %j)', async (controller, message) => {
    const registration = fakeRegistration()
    installContainer(registration, controller)
    const { register } = await loadFor('admin.test')
    registerAndGetLoad(() => register())?.()
    await flush()
    registration.onupdatefound?.()
    registration.installing?.onstatechange?.()
    expect(log).toHaveBeenCalledWith(expect.stringContaining(message))
  })
})

describe.each(['localhost', '[::1]', '127.0.0.1'])('on %s', (host) => {
  const respond = (status: number, contentType: string | null) =>
    vi.mocked(fetch).mockResolvedValue({ status, headers: { get: () => contentType } } as unknown as Response)

  const run = async () => {
    const registration = fakeRegistration()
    const container = installContainer(registration)
    const { register, reload } = await loadFor(host)
    registerAndGetLoad(() => register())?.()
    await flush()
    return { container, registration, reload }
  }

  test('a valid script gets registered', async () => {
    respond(200, 'application/javascript')
    const { container, reload } = await run()
    expect(fetch).toHaveBeenCalledExactlyOnceWith(swUrl, { headers: { 'Service-Worker': 'script' } })
    expect(container.register).toHaveBeenCalledExactlyOnceWith(swUrl)
    expect(reload).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith(expect.stringContaining('served cache-first'))
  })

  test('a response with no content type still gets registered', async () => {
    respond(200, null)
    const { container } = await run()
    expect(container.register).toHaveBeenCalledExactlyOnceWith(swUrl)
  })

  test.each([
    [404, 'application/javascript'],
    [200, 'text/html'],
  ])('status %d with %s unregisters and reloads', async (status, contentType) => {
    respond(status, contentType)
    const { container, registration, reload } = await run()
    expect(registration.unregister).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
    expect(container.register).not.toHaveBeenCalled()
  })

  test('being offline logs and leaves everything alone', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'))
    const { container, reload } = await run()
    expect(log).toHaveBeenCalledWith(expect.stringContaining('offline mode'))
    expect(container.register).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('unregister', () => {
  test('unregisters the active worker', async () => {
    const registration = fakeRegistration()
    installContainer(registration)
    const { unregister } = await loadFor('admin.test')
    unregister()
    await flush()
    expect(registration.unregister).toHaveBeenCalledOnce()
  })

  test('logs when the worker never gets ready', async () => {
    installContainer(fakeRegistration())
    Object.defineProperty(navigator.serviceWorker, 'ready', { value: Promise.reject(new Error('stuck')) })
    const { unregister } = await loadFor('admin.test')
    unregister()
    await flush()
    expect(error).toHaveBeenCalledWith('stuck')
  })

  test('does nothing when the browser has no service worker support', async () => {
    const { unregister } = await loadFor('admin.test')
    expect(() => unregister()).not.toThrow()
    await flush()
    expect(error).not.toHaveBeenCalled()
  })
})
