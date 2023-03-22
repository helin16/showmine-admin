import IBaseModel from '../IBaseModel'
import ICompany from './ICompany'

type ICompanyAuthor = IBaseModel & {
  name: string
  url?: string | null
  companyId: string
  Company?: ICompany
}

export default ICompanyAuthor
