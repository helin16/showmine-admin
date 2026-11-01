import { BACK_END_URL, getCurrentUrl, LOGIN_URL } from '../UrlMap'
import AppService from './AppService'
import { WeChatJs } from '../Redux/reduxers/wechat.slice'

const endPoint = '/wechat'
const WX_SCRIPT_URL = 'https://res.wx.qq.com/open/js/jweixin-1.4.0.js'
const getJsConf = async (url: string = getCurrentUrl()) => {
  return AppService.get(`${endPoint}/js/conf`, { url }).then((resp) => resp.data)
}

const getLoginQrCodeUrl = async () => {
  return AppService.post(`${endPoint}/qrcode/loginUrl`, { }).then((resp) => resp.data)
}

const getUserFromQrcode = async (token: string) => {
  return AppService.get(`${endPoint}/auth/getUser`, {token}).then((resp) => resp.data)
}

// Anything off this site goes to the dashboard instead. A path like /.//host resolves to //host, which is another site.
const getSafeReturnPath = (path?: string | null) => {
  try {
    const { origin, pathname, search, hash } = new URL(path || BACK_END_URL, window.location.origin)
    if (origin === window.location.origin && !pathname.startsWith('//')) {
      return `${pathname}${search}${hash}`
    }
  } catch {
    // not a url
  }
  return BACK_END_URL
}

// The API keeps the query string and adds state, so WeChat brings the user back here with the wanted page.
const getWeChatInAppLoginUrl = async (from?: string | null) => {
  const query = new URLSearchParams({ from: getSafeReturnPath(from) })
  const uiUrl = `${window.location.origin}${LOGIN_URL}?${query}`
  return AppService.get(`${endPoint}/auth/authUrl`, { uiUrl }).then((resp) => resp.data)
}

const goToWeChatLogin = async (from?: string | null) => {
  const { url } = await getWeChatInAppLoginUrl(from)
  if (`${url || ''}`.trim() === '') {
    throw new Error('Empty WeChat sign-in url')
  }
  window.location.assign(url)
}

// Loading the file again does nothing, so only a failed load is tried again.
const loadWXScript = () =>
  new Promise<WeChatJs>((resolve, reject) => {
    const { wx } = window as unknown as { wx?: WeChatJs }
    if (wx) {
      resolve(wx)
      return
    }
    const script = document.createElement('script')
    script.async = true
    script.onload = () => resolve((window as unknown as { wx: WeChatJs }).wx)
    script.onerror = reject
    script.src = WX_SCRIPT_URL
    document.head.appendChild(script)
  })

const WeChatService = {
  getJsConf,
  loadWXScript,
  getLoginQrCodeUrl,
  getWeChatInAppLoginUrl,
  goToWeChatLogin,
  getSafeReturnPath,
  getUserFromQrcode,
}

export default WeChatService
