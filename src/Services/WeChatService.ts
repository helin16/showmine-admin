import RestfulService from './RestfulService';
import { getCurrentUrl } from '../UrlMap';

const getJsConf = async (url: string = getCurrentUrl()) => RestfulService.get('/wechat/js/conf', { url });

const isInWeChat = () => /(micromessenger|webbrowser)/.test(navigator.userAgent.toLocaleLowerCase());

const getWeChatInAppLoginUrl = async (authUrl: string, origUrl: string = getCurrentUrl()) => RestfulService.get('/wechat/authUrl', { origUrl, authUrl, apiUrl: process.env.REACT_APP_REST_END_POINT });

const WeChatService = {
  getJsConf,
  isInWeChat,
  getWeChatInAppLoginUrl,
}

export  default WeChatService;
