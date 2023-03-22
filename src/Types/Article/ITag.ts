import IBaseModel from '../IBaseModel'
import ICompany from '../Company/ICompany'

type ITag = IBaseModel & {
  name: string
  companyId: string
  Company?: ICompany
}

export default ITag
