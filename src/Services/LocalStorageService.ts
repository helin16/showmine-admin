const AUTO_LOGIN_MARK_NAME = 'wechatAutoLogin'
// This tab's sign-in has gone to WeChat, failed, or is over, so it never goes to WeChat by itself again.
export const AUTO_LOGIN_SENT = 'sent'
export const AUTO_LOGIN_FAILED = 'failed'
export const AUTO_LOGIN_DONE = 'done'
const LOGIN_NOTICE_NAME = 'loginNotice'

const getTokenName = () => {
  return process.env.REACT_APP_LOCAL_USER_TOKEN_NAME || 'token'
}

const getCompanyIdName = () => {
  return process.env.REACT_APP_LOCAL_COMPANY_ID_NAME || 'comid'
}

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(getTokenName())
  }
}

const setToken = (newToken: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.setItem(getTokenName(), newToken)
  }
}

// Per tab, so a link that opens one company can't change what a tab open on another sends.
const setCompanyId = (compId: string) => {
  try {
    sessionStorage.setItem(getCompanyIdName(), compId)
  } catch {
    // Company calls then send no company, and the API refuses them.
  }
}

const getCompanyId = () => {
  try {
    return sessionStorage.getItem(getCompanyIdName())
  } catch {
    return null
  }
}

const removeCompanyId = () => {
  try {
    sessionStorage.removeItem(getCompanyIdName())
  } catch {
    // Nothing could have been saved either.
  }
}

const removeToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.removeItem(getTokenName())
  }
}

const getAutoLoginMark = () => {
  try {
    return sessionStorage.getItem(AUTO_LOGIN_MARK_NAME)
  } catch {
    return null
  }
}

// False when the mark can't be kept: going to WeChat then could never be told from coming back, so don't go.
const setAutoLoginMark = (mark: string) => {
  try {
    sessionStorage.setItem(AUTO_LOGIN_MARK_NAME, mark)
    return true
  } catch {
    return false
  }
}

const setLoginNotice = (notice: string) => {
  try {
    sessionStorage.setItem(LOGIN_NOTICE_NAME, notice)
  } catch {
    // Only the notice is lost.
  }
}

const getLoginNotice = () => {
  try {
    return sessionStorage.getItem(LOGIN_NOTICE_NAME)
  } catch {
    return null
  }
}

const removeLoginNotice = () => {
  try {
    sessionStorage.removeItem(LOGIN_NOTICE_NAME)
  } catch {
    // Nothing could have been saved either.
  }
}

const LocalStorageService = {
  getToken,
  setToken,
  removeToken,

  setCompanyId,
  getCompanyId,
  removeCompanyId,

  getAutoLoginMark,
  setAutoLoginMark,

  setLoginNotice,
  getLoginNotice,
  removeLoginNotice,
}

export default LocalStorageService
