import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IUser from '../Types/User/IUser'

const endPoint = '/user'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IUser>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IUser> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IUser> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IUser> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IUser> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const UserService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default UserService
