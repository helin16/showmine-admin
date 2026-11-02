import IBaseModel from '../IBaseModel'
import IAsset from '../Asset/IAsset'

export type ICompanyConfig = {
  onBoard?: {
    has_been_setup?: boolean
    has_set_article?: boolean
    has_set_channel?: boolean
    has_done_wizard?: boolean
  }
}
type ICompany = IBaseModel & {
  name: string
  companyNumber?: string
  email?: string | null
  websiteUrl?: string
  contactNumber?: string
  description?: string
  itemDefaultFooter?: string | null
  logoAssetId?: string | null
  config?: ICompanyConfig
  adminConfig?: any
  paidTo?: Date
  isExpired?: boolean
  // Null means no limit.
  maxUsers?: number | null
  LogoAsset?: IAsset
}

export default ICompany
