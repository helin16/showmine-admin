import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IChannel from '../Types/Channel/IChannel'

const endPoint = '/channel'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IChannel>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IChannel> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IChannel> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IChannel> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IChannel> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const ChannelService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default ChannelService
