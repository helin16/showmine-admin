import IBaseModel from '../IBaseModel'
import IUser from './IUser'

export const WECHAT_USER_TYPE_OPEN_ID = 'OPEN_ID'
export const WECHAT_USER_TYPE_WEB_OPEN_ID = 'WEB_OPEN_ID'
export const WECHAT_USER_TYPE_UNION_ID = 'UNION_ID'
export const WECHAT_USER_TYPE_MINI_APP_ID = 'MINI_APP_ID'
type IWeChatUser = IBaseModel & {
  userId: string
  externalId: string
  type: string
  externalObj?: any
  User?: IUser
}

export default IWeChatUser
