import IUser from '../User/IUser'
import IBaseModel from '../IBaseModel'
import ICompany from './ICompany'

export const ROLE_NON_ADMIN = 'NORMAL'
export const ROLE_ADMIN = 'ADMIN'

type ICompanyUser = IBaseModel & {
  userId: string
  companyId: string
  role: string
  isPending?: boolean
  User?: IUser
  Company?: ICompany
}

export default ICompanyUser
