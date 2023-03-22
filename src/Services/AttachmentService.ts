import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IAttachment from '../Types/Asset/IAttachment'

const endPoint = '/attachment'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IAttachment>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IAttachment> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IAttachment> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IAttachment> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IAttachment> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const AttachmentService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default AttachmentService
