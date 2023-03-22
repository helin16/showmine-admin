import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import ITag from '../Types/Article/ITag'

const endPoint = '/tag'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<ITag>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<ITag> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<ITag> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<ITag> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<ITag> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const TagService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default TagService
