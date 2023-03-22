import IBaseModel from '../IBaseModel'
import ICompany from '../Company/ICompany'
import IChannel from './IChannel'
import IMessage from './IMessage'

type IChannelEntity = IBaseModel & {
  channelId: string
  externalId: string
  entityName?: string
  entityId?: string
  channelJobId?: string
  info?: any
  externalObj?: any
  companyId: string
  Company?: ICompany
  Channel?: IChannel
  ChannelJob?: IMessage
}

export default IChannelEntity
