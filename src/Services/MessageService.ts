import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IMessage from '../Types/Channel/IMessage'

const endPoint = '/message'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IMessage>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IMessage> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IMessage> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IMessage> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IMessage> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const MessageService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default MessageService
