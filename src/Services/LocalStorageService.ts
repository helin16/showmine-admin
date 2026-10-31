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

const LocalStorageService = {
  getToken,
  setToken,
  removeToken,

  setCompanyId,
  getCompanyId,
  removeCompanyId,
}

export default LocalStorageService
