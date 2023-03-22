import IBaseModel from '../IBaseModel'
import IArticle from './IArticle'
import ICompany from '../Company/ICompany'

type IItemVisit = IBaseModel & {
  itemId: string
  source: string
  companyId: string
  sharedById?: string | null
  Item?: IArticle
  Company?: ICompany
}

export default IItemVisit
