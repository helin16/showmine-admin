import { vi } from 'vitest'
import axios from 'axios'
import PingService from '../../Services/PingService'
import LocalStorageService, { AUTO_LOGIN_FAILED } from '../../Services/LocalStorageService'
import WeChatService from '../../Services/WeChatService'

vi.mock('axios')

const API = 'https://api.test'
const headers = { headers: { 'X-SHM-TOKEN': '' } }
const denied = Object.assign(new Error('denied'), { response: { status: 403 } })
const here = encodeURIComponent(window.location.href)

beforeEach(() => {
  process.env.REACT_APP_REST_END_POINT = API
  sessionStorage.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('WeChatService', () => {
  test('getJsConf asks for the given url', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { appId: 'a' } })
    await expect(WeChatService.getJsConf('https://a.test/p')).resolves.toEqual({ appId: 'a' })
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(
      `${API}/wechat/js/conf?url=${encodeURIComponent('https://a.test/p')}`,
      headers,
    )
  })

  test('getJsConf defaults to the current page', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })
    await WeChatService.getJsConf()
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}/wechat/js/conf?url=${here}`, headers)
  })

  test('getLoginQrCodeUrl posts an empty body', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { url: 'qr' } })
    await expect(WeChatService.getLoginQrCodeUrl()).resolves.toEqual({ url: 'qr' })
    expect(axios.post).toHaveBeenCalledExactlyOnceWith(`${API}/wechat/qrcode/loginUrl`, {}, headers)
  })

  test('getUserFromQrcode sends the token', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { id: 'u1' } })
    await expect(WeChatService.getUserFromQrcode('t1')).resolves.toEqual({ id: 'u1' })
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}/wechat/auth/getUser?token=t1`, headers)
  })

  test('getWeChatInAppLoginUrl asks to come back to the sign-in page with the wanted page', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { url: 'u' } })
    await expect(WeChatService.getWeChatInAppLoginUrl('/b/articles?page=2')).resolves.toEqual({ url: 'u' })
    const uiUrl = `${window.location.origin}/login?from=${encodeURIComponent('/b/articles?page=2')}`
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(
      `${API}/wechat/auth/authUrl?uiUrl=${encodeURIComponent(uiUrl)}`,
      headers,
    )
  })

  test('getWeChatInAppLoginUrl never sends an unsafe return path', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })
    await WeChatService.getWeChatInAppLoginUrl('https://evil.test/')
    const uiUrl = `${window.location.origin}/login?from=${encodeURIComponent('/b/')}`
    expect(vi.mocked(axios.get).mock.calls[0][0]).toContain(`uiUrl=${encodeURIComponent(uiUrl)}`)
  })

  test('failures reject with the server error', async () => {
    vi.mocked(axios.get).mockRejectedValue(denied)
    vi.mocked(axios.post).mockRejectedValue(denied)
    await expect(WeChatService.getJsConf('u')).rejects.toBe(denied)
    await expect(WeChatService.getLoginQrCodeUrl()).rejects.toBe(denied)
    await expect(WeChatService.getUserFromQrcode('t')).rejects.toBe(denied)
    await expect(WeChatService.getWeChatInAppLoginUrl('/b/')).rejects.toBe(denied)
  })
})

describe('goToWeChatLogin', () => {
  const assign = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('location', { origin: 'https://admin.test', assign })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('sends the browser to the address from the API', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { url: 'https://wx.test/auth' } })
    await WeChatService.goToWeChatLogin('/b/')
    expect(assign).toHaveBeenCalledExactlyOnceWith('https://wx.test/auth')
  })

  test('rejects, going nowhere, when the API gives no address', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })
    await expect(WeChatService.goToWeChatLogin()).rejects.toThrow()
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('getSafeReturnPath', () => {
  test.each([
    ['/b/articles', '/b/articles'],
    ['/b/articles?page=2#top', '/b/articles?page=2#top'],
  ])('keeps %s', (path, expected) => {
    expect(WeChatService.getSafeReturnPath(path)).toBe(expected)
  })

  test.each([
    ['https://evil.test/'],
    ['//evil.test/'],
    ['/\\evil.test/'],
    ['/\t/evil.test/'],
    ['/.//evil.test/'],
    ['javascript:alert(1)'],
    ['http://'],
    [''],
    [null],
    [undefined],
  ])('falls back to the dashboard for %s', (path) => {
    expect(WeChatService.getSafeReturnPath(path)).toBe('/b/')
  })
})

describe('auto login mark', () => {
  test('is kept for the tab', () => {
    expect(LocalStorageService.getAutoLoginMark()).toBeNull()
    expect(LocalStorageService.setAutoLoginMark(AUTO_LOGIN_FAILED)).toBe(true)
    expect(LocalStorageService.getAutoLoginMark()).toBe(AUTO_LOGIN_FAILED)
    expect(window.sessionStorage.length).toBe(1)
  })

  test('reports blocked storage instead of throwing', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(LocalStorageService.getAutoLoginMark()).toBeNull()
    expect(LocalStorageService.setAutoLoginMark(AUTO_LOGIN_FAILED)).toBe(false)
  })
})

describe('PingService', () => {
  test('pong returns the body', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { ok: true } })
    await expect(PingService.pong({ a: 1 }, { timeout: 9 })).resolves.toEqual({ ok: true })
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}/ping?a=1`, { timeout: 9, ...headers })
  })

  test('pong rejects when the server is down', async () => {
    vi.mocked(axios.get).mockRejectedValue(denied)
    await expect(PingService.pong()).rejects.toBe(denied)
  })
})

describe('loadWXScript', () => {
  const script = () => document.head.querySelector('script[src*="jweixin"]') as HTMLScriptElement
  const wx = { config: () => undefined }

  afterEach(() => {
    script()?.remove()
    delete (window as { wx?: unknown }).wx
  })

  test('adds WeChat\'s official script and gives back window.wx once it loads', async () => {
    const loading = WeChatService.loadWXScript()
    expect(script().src).toBe('https://res.wx.qq.com/open/js/jweixin-1.4.0.js')
    Object.assign(window, { wx })
    script().onload?.(new Event('load'))
    await expect(loading).resolves.toBe(wx)
  })

  test('does not add it twice', async () => {
    Object.assign(window, { wx })
    await expect(WeChatService.loadWXScript()).resolves.toBe(wx)
    expect(script()).toBeNull()
  })

  test('rejects when the script fails to load', async () => {
    const loading = WeChatService.loadWXScript()
    const failure = new Event('error')
    script().onerror?.(failure)
    await expect(loading).rejects.toBe(failure)
  })
})
