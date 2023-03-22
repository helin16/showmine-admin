import { getCurrentUrl } from '../UrlMap'
import AppService from './AppService'

const endPoint = 'weChat'
const getJsConf = async (url: string = getCurrentUrl()) => {
  return AppService.get(`${endPoint}/js/conf`, { url }).then((resp) => resp.data)
}

const isInWeChat = () => /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase())

const getWeChatInAppLoginUrl = async (authUrl: string, origUrl: string = getCurrentUrl()) => {
  return AppService.get('/wechat/authUrl', { origUrl, authUrl }).then((resp) => resp.data)
}

const WeChatService = {
  getJsConf,
  isInWeChat,
  getWeChatInAppLoginUrl,
}

export default WeChatService
