import IBaseModel from '../IBaseModel'
import ICompany from '../Company/ICompany'

type IComment = IBaseModel & {
  replyToId: string | null
  comments: string
  // Always show this, never `comments`, which is stored HTML from strangers.
  text: string
  isHidden?: boolean
  entityId: string
  entityName: string
  companyId: string
  Company?: ICompany
  Replys?: IComment[]
}

export default IComment
