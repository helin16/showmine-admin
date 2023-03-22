import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IAuthor from '../Types/Article/IAuthor'

const endPoint = '/author'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IAuthor>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IAuthor> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IAuthor> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IAuthor> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IAuthor> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const AuthorService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default AuthorService
