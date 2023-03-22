import IBaseModel from '../IBaseModel'
import ICompany from '../Company/ICompany'

type IComment = IBaseModel & {
  replyToId: string | null
  comments: string
  entityId: string
  entityName: string
  companyId: string
  Company?: ICompany
  ReplyTo?: IComment
}

export default IComment
