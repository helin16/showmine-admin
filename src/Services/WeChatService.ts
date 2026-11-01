import { getCurrentUrl } from '../UrlMap'
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

const isInWeChat = () => /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase())

const getWeChatInAppLoginUrl = async (authUrl: string, origUrl: string = getCurrentUrl()) => {
  return AppService.get(`${endPoint}/authUrl`, { origUrl, authUrl }).then((resp) => resp.data)
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
  isInWeChat,
  loadWXScript,
  getLoginQrCodeUrl,
  getWeChatInAppLoginUrl,
  getUserFromQrcode,
}

export default WeChatService
