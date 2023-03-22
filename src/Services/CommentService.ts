import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IComment from '../Types/Comments/IComment'

const endPoint = '/comment'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IComment>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IComment> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IComment> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IComment> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IComment> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const CommentService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
}

export default CommentService
