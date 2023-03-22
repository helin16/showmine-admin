import IBaseModel from '../IBaseModel'
import IArticle from './IArticle'
import ITag from './ITag'

type IItemTag = IBaseModel & {
  itemId: string
  tagId: string
  companyId: string
  Item?: IArticle
  Tag?: ITag
}

export default IItemTag
