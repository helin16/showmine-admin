import AppService, { iConfigParams } from './AppService'
import IWebsite, { IWebsitePage, IWebsiteTemplate } from '../Types/Website/IWebsite'

// The company's website (specs/001-website-builder, contracts/api.md "Website").
const endPoint = '/website'

const get = async (): Promise<IWebsite> => AppService.get(endPoint).then((resp) => resp.data)

const create = async (slug: string): Promise<IWebsite> => AppService.post(endPoint, { slug }).then((resp) => resp.data)

const update = async (params: iConfigParams): Promise<IWebsite> =>
  AppService.put(endPoint, params).then((resp) => resp.data)

const getTemplates = async (): Promise<IWebsiteTemplate[]> =>
  AppService.get(`${endPoint}/templates`).then((resp) => resp.data)

// Creates the template's pages. Existing pages are replaced only with `replace` and the page count the admin agreed to.
const initialise = async (params: {
  templateId: string
  templateVersion: number
  replace?: boolean
  pageCount?: number
}): Promise<IWebsitePage[]> => AppService.post(`${endPoint}/initialise`, params).then((resp) => resp.data)

// An address on the Reader, or null when the Reader's address is not configured (never a link on the admin itself).
const getReaderUrl = (path: string) => {
  const readerUrl = `${process.env.REACT_APP_FRONT_END_URL || ''}`.trim().replace(/\/$/, '')
  return readerUrl === '' ? null : `${readerUrl}${path}`
}

const WebsiteService = { get, create, update, getTemplates, initialise, getReaderUrl }

export default WebsiteService
