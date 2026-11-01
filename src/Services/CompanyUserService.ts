import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import ICompanyUser from '../Types/Company/ICompanyUser'

const endPoint = '/companyUser'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<ICompanyUser>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<ICompanyUser> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<ICompanyUser> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<ICompanyUser> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<ICompanyUser> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const invite = async (email: string) => {
  return AppService.post(`${endPoint}/invite`, { email }).then((resp) => resp.data)
}

const getInviteQr = async (): Promise<{ url: string; expiresInSeconds: number }> => {
  return AppService.post(`${endPoint}/invite/qr`, {}).then((resp) => resp.data)
}

const getPending = async (): Promise<ICompanyUser[]> => {
  return AppService.get(`${endPoint}/pending`).then((resp) => resp.data)
}

const approve = async (id: string) => {
  return AppService.post(`${endPoint}/${id}/approve`, {}).then((resp) => resp.data)
}

const reject = async (id: string) => {
  return AppService.post(`${endPoint}/${id}/reject`, {}).then((resp) => resp.data)
}

const CompanyUserService = {
  invite,
  getInviteQr,
  getPending,
  approve,
  reject,
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default CompanyUserService
