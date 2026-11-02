import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import ICompany from '../Types/Company/ICompany'

const endPoint = '/company'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<ICompany>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<ICompany> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<ICompany> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<ICompany> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<ICompany> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const startCheckout = async (plan: string): Promise<{ url: string }> => {
  return AppService.post('/billing/checkout', { plan }).then((resp) => resp.data)
}

const openBillingPortal = async (): Promise<{ url: string }> => {
  return AppService.post('/billing/portal', {}).then((resp) => resp.data)
}

const CompanyService = {
  startCheckout,
  openBillingPortal,
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default CompanyService
