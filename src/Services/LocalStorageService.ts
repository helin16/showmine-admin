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

const setCompanyId = (compId: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.setItem(getCompanyIdName(), compId)
  }
}

const getCompanyId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(getCompanyIdName())
  }
}

const removeCompanyId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.removeItem(getCompanyIdName())
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

const takeLoginNotice = () => {
  try {
    const notice = sessionStorage.getItem(LOGIN_NOTICE_NAME)
    sessionStorage.removeItem(LOGIN_NOTICE_NAME)
    return notice
  } catch {
    return null
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
  takeLoginNotice,
}

export default LocalStorageService
