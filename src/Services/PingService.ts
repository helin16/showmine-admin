import AppService, { iConfigParams } from './AppService'
import IResList from '../Types/IResList'
import IMessage from '../Types/Channel/IMessage'

const endPoint = '/ping'
const pong = async (params?: iConfigParams, config?: iConfigParams): Promise<IResList<IMessage>> => {
  return AppService.get(endPoint, params, config).then((resp) => resp.data)
}

const PingService = {
  pong,
}

export default PingService
