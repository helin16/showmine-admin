import axios, { AxiosRequestConfig } from 'axios'
import LocalStorageService from './LocalStorageService'

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

const get = (url: string, params: iConfigParams = {}, config: AxiosRequestConfig = {}) => {
  const { headers, ...rest } = config
  return axios.get(
    `${getEndPointUrl(url)}${getUrlParams(params)}`,
    {
      ...rest,
      ...getHeaders(headers),
    },
  )
}

const post = (url: string, params: iParams, config: AxiosRequestConfig = {}) => {
  const { headers, ...rest } = config
  return axios.post(getEndPointUrl(url), params, {
    ...rest,
    ...getHeaders(headers),
  })
}

const put = (url: string, params: iConfigParams, config: AxiosRequestConfig = {}) => {
  const { headers, ...rest } = config
  return axios.put(getEndPointUrl(url), params, {
    ...rest,
    ...getHeaders(headers),
  })
}

const remove = (url: string, params: iConfigParams = {}, config: AxiosRequestConfig = {}) => {
  const { headers, ...rest } = config
  return axios.delete(
    `${getEndPointUrl(url)}${getUrlParams(params)}`,
    {
      ...rest,
      ...getHeaders(headers),
    },
  )
}
const getUploadHeaders = () => getHeaders({ 'Content-Type': 'multipart/form-data' })
const uploadImage = (url: string, params: FormData, config: AxiosRequestConfig = {}) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return axios.post(getEndPointUrl(url), params, {
    ...config,
    ...getUploadHeaders(),
  })
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
}

export default AppService
