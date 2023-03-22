import IBaseModel from '../IBaseModel'
import ICompany from '../Company/ICompany'
import IChannelScript from './IChannelScript'

type IChannel = IBaseModel & {
  name: string
  scriptId: string
  isOnBoarded: boolean
  settings?: any
  companyId: string
  Company?: ICompany
  Script?: IChannelScript
}

export default IChannel
