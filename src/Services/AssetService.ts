import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IAsset from '../Types/Asset/IAsset'

const endPoint = '/asset'
const getAll = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IAsset>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const getItemById = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IAsset> => {
  return AppService.get(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const create = async (params: iConfigParams, config?: iConfigParams): Promise<IAsset> => {
  return AppService.post(endPoint, params, config).then((resp) => resp.data)
}

const update = async (id: string, params: iConfigParams, config?: iConfigParams): Promise<IAsset> => {
  return AppService.put(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const deactivate = async (id: string, params?: iConfigParams, config?: iConfigParams): Promise<IAsset> => {
  return AppService.delete(`${endPoint}/${id}`, params, config).then((resp) => resp.data)
}

const getTotalSize = async (params?: iConfigParams, config?: iConfigParams): Promise<{ totalSize: number; maxSize?: number | null }> => {
  return AppService.get(`${endPoint}/totalSize`, params, config).then((resp) => resp.data)
}

export type iAssetArticles = Record<string, { id: string; title: string }[]>

const getArticles = async (ids: string[]): Promise<iAssetArticles> => {
  return AppService.get(`${endPoint}/articles`, { ids: ids.join(',') }).then((resp) => resp.data)
}

const getUploadAssetUrl = () => {
  return `${process.env.REACT_APP_REST_END_POINT || ''}${endPoint}/upload`;
}

const formatFileSize = (sizeInBytes: number, precision = 2) => {
  let value = (sizeInBytes / 1000);
  let suffix = 'KB';
  if (sizeInBytes >= 1000000000) {
    value = (sizeInBytes / 1000000000);
    suffix = 'GB';
  } else if (sizeInBytes >= 1000000) {
    value = (sizeInBytes / 1000000);
    suffix = 'MB';
  }
  return [value.toFixed(precision), suffix];
};

const AssetService = {
  getAll,
  getItemById,
  create,
  update,
  deactivate,
  getTotalSize,
  getArticles,
  getUploadAssetUrl,
  formatFileSize,
}

export default AssetService
