import IBaseModel from '../IBaseModel'

export const ASSET_TYPE_TMP = 'TMP';
export const ASSET_TYPE_USER_AVATAR = 'USER_AVATAR';
export const ASSET_TYPE_COMPANY_LOGO = 'COMPANY_LOGO';
export const ASSET_TYPE_COMPANY_PROFILE = 'COMPANY_PROFILE';
export const ASSET_TYPE_ITEM_DESCRIPTION = 'ITEM_DESCRIPTION';
export const ASSET_TYPE_ITEM_COVER = 'ITEM_COVER';
// Images for the company's website, uploaded only through POST /website/images.
export const ASSET_TYPE_WEBSITE = 'WEBSITE';
// The image types a website can show; the API checks the same list (SMN-80).
export const WEBSITE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
