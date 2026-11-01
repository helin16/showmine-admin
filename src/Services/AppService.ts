import axios, { AxiosRequestConfig } from 'axios'
import LocalStorageService from './LocalStorageService'
import translate from '../i18n/translate'
import { PASSWORD_LOGIN_URL } from '../UrlMap'

const getHeaderCompanyIdName = () => {
  return `${process.env.REACT_APP_HEADER_NAME_COMPANY_ID || 'comid'}`
}

const getHeaderAppTokenName = () => {
  return `${process.env.REACT_APP_HEADER_NAME_APP_TOKEN || 'X-SHM-TOKEN'}`
}
export type iConfigParams = {
  [key: string]: any
}
export type iParams = {
  [key: string]: string | boolean | number | null | undefined | string[]
}

const getEndPointUrl = (url: string) => {
  return `${process.env.REACT_APP_REST_END_POINT}${url}`
}

const getHeaders = (extra = {}) => {
  const token = `${LocalStorageService.getToken() || ''}`.trim();
  const companyId = `${LocalStorageService.getCompanyId() || ''}`.trim();;
  return {
    headers: {
      [getHeaderAppTokenName()]: `${process.env.REACT_APP_APP_TOKEN || ''}`,
      ...(token === '' ? {} : { Authorization: `Bearer ${token}` }),
      ...(companyId === '' ? {} : { [getHeaderCompanyIdName()]: companyId }),
      ...extra,
    },
  }
}

const getUrlParams = (params: iConfigParams = {}) => {
  const definedParams = typeof params === 'object' ? Object.entries(params).filter(([, value]) => value !== undefined) : []
  const paramString = new URLSearchParams(definedParams).toString()
  return paramString === '' ? '' : `?${paramString}`
}

const LOGIN_API_URL = '/auth'
const STATUS_MESSAGE_IDS: { [status: number]: string } = {
  413: 'request-too-large',
  429: 'request-too-many',
}

const getStatusMessage = (status?: number) => {
  const id = STATUS_MESSAGE_IDS[status as number]
  return id ? translate(id) : undefined
}

// The API also uses 401 for "not allowed", and always says why. Only a refused token gets passport's bare word.
// ponytail: tied to that word; if the API moves those refusals to 403, any 401 with a token can end the session.
const isTokenRefused = (status?: number, data?: any) =>
  status === 401 && `${data?.message ?? data}`.trim() === 'Unauthorized'

// A full load, so nothing from the session stays in memory. The language doesn't survive it, so the notice is saved
// already translated. ?password=1 keeps WeChat from signing straight back in, so this can't turn into a loop.
const endSession = () => {
  const { pathname, search, hash } = window.location
  LocalStorageService.removeToken()
  LocalStorageService.removeCompanyId()
  LocalStorageService.setLoginNotice(translate('session-expired'))
  window.location.assign(`${PASSWORD_LOGIN_URL}&${new URLSearchParams({ from: `${pathname}${search}${hash}` })}`)
}

// Never retries: the user decides when to try again.
const send = async <T>(request: () => Promise<T>, canEndSession = true): Promise<T> => {
  const token = LocalStorageService.getToken()
  try {
    return await request()
  } catch (err: any) {
    const { status, data } = err.response || {}
    if (canEndSession && token && isTokenRefused(status, data)) {
      // A different token means a newer sign-in, which this old answer says nothing about.
      const current = LocalStorageService.getToken()
      if (!current || current === token) {
        endSession()
        // The page is leaving: callers showing an error or going to sign-in themselves would only get in its way.
        return new Promise<T>(() => undefined)
      }
    }
    const statusMessage = getStatusMessage(status)
    if (statusMessage) {
      err.message = statusMessage
      err.response.data = { message: statusMessage }
    }
    throw err
  }
}

// For the uploads that use XMLHttpRequest for their progress. Returns the message to show, if there is one.
const getUploadFailure = (status: number, body?: unknown) => {
  if (LocalStorageService.getToken() && isTokenRefused(status, body)) {
    endSession()
  }
  return getStatusMessage(status)
}

const get = (url: string, params: iConfigParams = {}, config: AxiosRequestConfig = {}) => {
  const { headers, ...rest } = config
  return send(() =>
    axios.get(`${getEndPointUrl(url)}${getUrlParams(params)}`, {
      ...rest,
      ...getHeaders(headers),
    }),
  )
}

const post = (url: string, params: iParams, config: AxiosRequestConfig = {}) => {
  const { headers, ...rest } = config
  return send(
    () =>
      axios.post(getEndPointUrl(url), params, {
        ...rest,
        ...getHeaders(headers),
      }),
    url !== LOGIN_API_URL,
  )
}

const put = (url: string, params: iConfigParams, config: AxiosRequestConfig = {}) => {
  const { headers, ...rest } = config
  return send(() =>
    axios.put(getEndPointUrl(url), params, {
      ...rest,
      ...getHeaders(headers),
    }),
  )
}

const remove = (url: string, params: iConfigParams = {}, config: AxiosRequestConfig = {}) => {
  const { headers, ...rest } = config
  return send(() =>
    axios.delete(`${getEndPointUrl(url)}${getUrlParams(params)}`, {
      ...rest,
      ...getHeaders(headers),
    }),
  )
}
const getUploadHeaders = () => getHeaders({ 'Content-Type': 'multipart/form-data' })
const uploadImage = (url: string, params: FormData, config: AxiosRequestConfig = {}) => {
  return send(() =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    axios.post(getEndPointUrl(url), params, {
      ...config,
      ...getUploadHeaders(),
    }),
  )
}

const AppService = {
  getHeaders,
  getHeaderCompanyIdName,
  getHeaderAppTokenName,
  get,
  post,
  put,
  delete: remove,
  uploadImage,
  getUploadFailure,
}

export default AppService
