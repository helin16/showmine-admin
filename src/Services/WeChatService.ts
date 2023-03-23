import { getCurrentUrl } from '../UrlMap'
import AppService, {iConfigParams} from './AppService'

const endPoint = '/wechat'
const getJsConf = async (url: string = getCurrentUrl()) => {
  return AppService.get(`${endPoint}/js/conf`, { url }).then((resp) => resp.data)
}

const getLoginQrCodeUrl = async () => {
  return AppService.post(`${endPoint}/qrcode/loginUrl`, { }).then((resp) => resp.data)
}

const getUserFromQrcode = async (token: string) => {
  return AppService.get(`${endPoint}/qrcode/getUser`, {token}).then((resp) => resp.data)
}

const isInWeChat = () => /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase())

const getWeChatInAppLoginUrl = async (authUrl: string, origUrl: string = getCurrentUrl()) => {
  return AppService.get(`${endPoint}/authUrl`, { origUrl, authUrl }).then((resp) => resp.data)
}

const WeChatService = {
  getJsConf,
  isInWeChat,
  getLoginQrCodeUrl,
  getWeChatInAppLoginUrl,
  getUserFromQrcode,
}

export default WeChatService
