import IBaseModel from '../IBaseModel'

export const ASSET_TYPE_TMP = 'TMP';
export const ASSET_TYPE_USER_AVATAR = 'USER_AVATAR';
export const ASSET_TYPE_COMPANY_LOGO = 'COMPANY_LOGO';
export const ASSET_TYPE_COMPANY_PROFILE = 'COMPANY_PROFILE';
export const ASSET_TYPE_ITEM_DESCRIPTION = 'ITEM_DESCRIPTION';
export const ASSET_TYPE_ITEM_COVER = 'ITEM_COVER';

type IAsset = IBaseModel & {
  type: string
  externalAssetId?: string | null
  fileName: string
  fileType?: string | null
  fileSize?: number | null
  comments?: string
  url?: string
  companyId: string
}

export const initAsset: IAsset = {
  type: '',
  fileName: '',
  companyId: '',
}

export default IAsset
