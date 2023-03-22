import IBaseModel from '../IBaseModel'
import ICompany from '../Company/ICompany'
import IChannel from './IChannel'

export const MESSAGE_STATUS_NEW = 'NEW'
export const MESSAGE_STATUS_WIP = 'PROCESSING'
export const MESSAGE_STATUS_SUCCESS = 'SUCCESS'
export const MESSAGE_STATUS_FAILED = 'FAILED'

type IMessage = IBaseModel & {
  type: string
  status?: string
  channelId?: string | null
  request?: any
  response?: any
  error?: any
  requestCheckSum?: string
  companyId: string
  Company?: ICompany
  Channel?: IChannel
}

export default IMessage
