import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IWeChatUser from '../Types/User/IWeChatUser'

const endPoint = '/weChatUser'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IWeChatUser>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IWeChatUser> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IWeChatUser> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IWeChatUser> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IWeChatUser> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const WeChatUserService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default WeChatUserService
