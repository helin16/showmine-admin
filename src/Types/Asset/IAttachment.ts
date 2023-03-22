import IBaseModel from '../IBaseModel'
import ICompany from '../Company/ICompany'
import IAsset from './IAsset'

type IAttachment = IBaseModel & {
  assetId: string
  entityId: string
  entityName: string
  companyId: string
  Company?: ICompany
  Asset?: IAsset
}

export default IAttachment
