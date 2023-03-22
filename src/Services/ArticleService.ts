import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IArticle from '../Types/Article/IArticle'

const endPoint = '/item'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IArticle>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IArticle> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IArticle> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IArticle> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IArticle> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const getPreviewUrl = (id: string) => {
  return `${process.env.REACT_APP_REST_END_POINT || ''}/item/redirect?itemId=${id}`;
}

const ArticleService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
  getPreviewUrl,
}

export default ArticleService
