import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IItemTag from '../Types/Article/IItemTag'

const endPoint = '/itemTag'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IItemTag>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IItemTag> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IItemTag> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IItemTag> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IItemTag> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const ItemTagService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default ItemTagService
