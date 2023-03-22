import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IChannelScript from '../Types/Channel/IChannelScript'

const endPoint = '/channelScript'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IChannelScript>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IChannelScript> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const ChannelScriptService = {
  getAll,
  getItemById,
}

export default ChannelScriptService
