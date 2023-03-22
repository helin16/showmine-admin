export const BACK_END_URL = '/b/'
export const FORGOT_PASSWORD_URL = '/forgot-password'
export const RESET_PASSWORD_URL = '/reset-password'
export const SIGN_UP_URL = '/signup'
export const LOGIN_URL = '/login'
export const ARTICLE_LIST_URL = `${BACK_END_URL}articles`
export const ARTICLE_DETAILS_URL = `${BACK_END_URL}articles/:id`
export const COMMENTS_LIST_URL = `${BACK_END_URL}comments`
export const MEDIA_LIST_URL = `${BACK_END_URL}media`
export const COMPANY_ADMIN_URL = `${BACK_END_URL}company/`
export const COMPANY_BILLING_URL = `${COMPANY_ADMIN_URL}billing`
export const COMPANY_CHANNELS_URL = `${COMPANY_ADMIN_URL}channels`
export const COMPANY_CHANNEL_NEW_URL = `${COMPANY_ADMIN_URL}channel/new`
export const COMPANY_USERS_URL = `${COMPANY_ADMIN_URL}users`
export const MY_PROFILE_URL = `${BACK_END_URL}profile`

export const THIRD_PARTY_AUTH_URL_WE_CHAT = '/a/wx'
export const AUTH_URL_USER_CONFIRM = '/a/user-confirm/:companyId'
export const VALIDATE_EMAIL = '/validateEmail'
export const WIZARD_URL = '/wizard'

/**
 * Super admin functions
 */
export const COMPANY_LIST_URL = `${BACK_END_URL}super/company/`

const map = {
  THIRD_PARTY_AUTH_URL_WE_CHAT,
  AUTH_URL_USER_CONFIRM,

  LOGIN_URL,
  BACK_END_URL,
  ARTICLE_LIST_URL,
  ARTICLE_DETAILS_URL,
  COMMENTS_LIST_URL,
  MEDIA_LIST_URL,
  COMPANY_BILLING_URL,
  COMPANY_CHANNELS_URL,
  COMPANY_USERS_URL,
  MY_PROFILE_URL,
  VALIDATE_EMAIL,

  COMPANY_LIST_URL,
  WIZARD_URL,
}

export const getUrl = (url: string, searching = ':id', replacement = 'new'): string => {
  const re = new RegExp(searching, 'g')
  return url.replace(re, replacement)
}

export const getFullUrl = (url: string, params: { [key: string]: string } = {}) => {
  const queryString = new URLSearchParams(params).toString()
  return `${process.env.REACT_APP_PUBLIC_URL}${url}${queryString === '' ? '' : `?${queryString}`}`
}

export const getCurrentUrl = () => window.location.href

export default map
