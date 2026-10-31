import { vi } from 'vitest'
import axios from 'axios'
import PingService from '../../Services/PingService'
import WeChatService from '../../Services/WeChatService'

vi.mock('axios')

const API = 'https://api.test'
const headers = { headers: { 'X-SHM-TOKEN': '' } }
const denied = Object.assign(new Error('denied'), { response: { status: 403 } })
const here = encodeURIComponent(window.location.href)

beforeEach(() => {
  process.env.REACT_APP_REST_END_POINT = API
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

  test('getWeChatInAppLoginUrl sends both urls', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { url: 'u' } })
    await expect(WeChatService.getWeChatInAppLoginUrl('auth', 'orig')).resolves.toEqual({ url: 'u' })
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}/wechat/authUrl?origUrl=orig&authUrl=auth`, headers)
  })

  test('getWeChatInAppLoginUrl defaults the original url to the current page', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })
    await WeChatService.getWeChatInAppLoginUrl('auth')
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}/wechat/authUrl?origUrl=${here}&authUrl=auth`, headers)
  })

  test('failures reject with the server error', async () => {
    vi.mocked(axios.get).mockRejectedValue(denied)
    vi.mocked(axios.post).mockRejectedValue(denied)
    await expect(WeChatService.getJsConf('u')).rejects.toBe(denied)
    await expect(WeChatService.getLoginQrCodeUrl()).rejects.toBe(denied)
    await expect(WeChatService.getUserFromQrcode('t')).rejects.toBe(denied)
    await expect(WeChatService.getWeChatInAppLoginUrl('a', 'o')).rejects.toBe(denied)
  })

  test.each([
    ['Mozilla/5.0 MicroMessenger/8.0', true],
    ['Mozilla/5.0 micromessenger', true],
    ['Mozilla/5.0 WebBrowser/1.0', true],
    ['Mozilla/5.0 Chrome/120 Safari/537', false],
    ['', false],
  ])('isInWeChat for "%s" is %s', (userAgent, expected) => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
    expect(WeChatService.isInWeChat()).toBe(expected)
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
