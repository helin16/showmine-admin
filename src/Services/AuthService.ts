import LocalStorageService from './LocalStorageService'
import IUser from '../Types/User/IUser'
import AppService, { iConfigParams } from './AppService'
import ICompanyUser from '../Types/Company/ICompanyUser';

const endPoint = '/auth'
const setLocalAuthToken = (authToken: string) => {
  LocalStorageService.setToken(authToken)
}

const getLocalAuthToken = () => {
  return LocalStorageService.getToken()
}

const removeLocalAuthToken = () => {
  LocalStorageService.removeToken()
  LocalStorageService.removeCompanyId()
}

const login = async (email: string, password: string) => {
  return AppService.post(endPoint, { email, password }).then((resp) => resp.data)
}

export type iPendingCompany = { id: string; name: string }

type iMeData = {
  user: IUser,
  companies: ICompanyUser[];
  pendingCompanies?: iPendingCompany[];
}

const getMe = async (config: object | undefined = undefined): Promise<iMeData> => {
  return AppService.get(`${endPoint}/me`, {}, config).then((res) => res.data)
}

const updateMe = async (data: iConfigParams, config?: iConfigParams): Promise<iMeData> => {
  return AppService.put(`${endPoint}/me`, data, config).then((res) => res.data)
}

const logout = async (data?: iConfigParams, config?: iConfigParams): Promise<iMeData> => {
  return AppService.delete(`${endPoint}`, data, config).then((res) => res.data)
}

const retrievePassword = async (email: string) => {
  return AppService.post(`${endPoint}/forgot-password`, { email }).then((res) => res.data)
}

const resetPassword = async (token: string, password: string) => {
  return AppService.post(`${endPoint}/reset-password`, { token, password }).then((res) => res.data)
}

const checkInvite = async (token: string): Promise<{ companyName: string; email: string }> => {
  return AppService.post(`${endPoint}/invite/check`, { token }).then((res) => res.data)
}

type iNewPerson = { firstName: string; lastName?: string; password: string }

const acceptInvite = async (token: string, person: iNewPerson) => {
  return AppService.post(`${endPoint}/invite/accept`, { token, ...person }).then((res) => res.data)
}

const joinInvite = async (token: string): Promise<{ status: 'pending' | 'member' }> => {
  return AppService.post(`${endPoint}/invite/join`, { token }).then((res) => res.data)
}

const AuthService = {
  checkInvite,
  acceptInvite,
  joinInvite,
  login,
  retrievePassword,
  resetPassword,
  getMe,
  updateMe,
  setLocalAuthToken,
  getLocalAuthToken,
  removeLocalAuthToken,
  logout,
}

export default AuthService
