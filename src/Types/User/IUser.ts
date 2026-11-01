import ICompany from '../Company/ICompany'
import IBaseModel from '../IBaseModel'
import IAsset from '../Asset/IAsset'

type IUser = IBaseModel & {
  firstName: string
  lastName: string
  nickName: string
  email?: string
  // A new address waiting for its link to be opened. `email` keeps the old one until then.
  pendingEmail?: string | null
  mobile?: string
  config?: any
  password?: string
  lastVisitCompanyId?: string
  avatarAssetId?: string
  isSuperAdmin?: boolean
  lastLoginAt?: Date | string | null
  isOnline: boolean
  languageCode: string | null
  LastVisitCompany?: ICompany
  AvatarAsset?: IAsset
}

export default IUser
