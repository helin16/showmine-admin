import AppService, { iConfigParams } from './AppService'
import IWebsite from '../Types/Website/IWebsite'

// The company's website (specs/001-website-builder, contracts/api.md "Website").
const endPoint = '/website'

const get = async (): Promise<IWebsite> => AppService.get(endPoint).then((resp) => resp.data)

const create = async (slug: string): Promise<IWebsite> => AppService.post(endPoint, { slug }).then((resp) => resp.data)

const update = async (params: iConfigParams): Promise<IWebsite> =>
  AppService.put(endPoint, params).then((resp) => resp.data)

const WebsiteService = { get, create, update }

export default WebsiteService
