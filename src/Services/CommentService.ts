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

// Comments can't be created, edited or deleted: staff hide them, and reply to them.
const hide = async (id: string, isHidden: boolean, config?: iConfigParams): Promise<IComment> => {
  return AppService.put(`${endPoint}/${id}/hide`, { isHidden }, config).then((resp) => resp.data)
}

const reply = async (id: string, comments: string, config?: iConfigParams): Promise<IComment> => {
  return AppService.post(`${endPoint}/${id}/reply`, { comments }, config).then((resp) => resp.data)
}

const CommentService = {
  getAll,
  getItemById,
  hide,
  reply,
}

export default CommentService
