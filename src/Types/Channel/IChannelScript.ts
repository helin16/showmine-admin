import IBaseModel from '../IBaseModel'

type IChannelScript = IBaseModel & {
  name: string
  script: string
  authType: string
  settings?: any
}

export default IChannelScript
