import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IChannelEntity from '../Types/Channel/IChannelEntity'

const endPoint = '/channelEntity'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IChannelEntity>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IChannelEntity> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IChannelEntity> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IChannelEntity> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IChannelEntity> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const ChannelEntityService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default ChannelEntityService
