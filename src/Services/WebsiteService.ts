import AppService, { iConfigParams } from './AppService'
import IWebsite, { IWebsitePage, IWebsiteSection, IWebsiteTemplate } from '../Types/Website/IWebsite'

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

const pagesEndPoint = `${endPoint}/pages`

const getPages = async (): Promise<IWebsitePage[]> => AppService.get(pagesEndPoint).then((resp) => resp.data)

const createPage = async (params: { slug: string; title: string }): Promise<IWebsitePage> =>
  AppService.post(pagesEndPoint, params).then((resp) => resp.data)

const updatePage = async (
  id: string,
  params: { slug?: string; title?: string; sections?: IWebsiteSection[]; updatedAt: Date | string | undefined },
): Promise<IWebsitePage> => AppService.put(`${pagesEndPoint}/${id}`, params).then((resp) => resp.data)

const deletePage = async (id: string) => AppService.delete(`${pagesEndPoint}/${id}`).then((resp) => resp.data)

// The ids of all the pages, in their new order.
const orderPages = async (ids: string[]): Promise<IWebsitePage[]> =>
  AppService.put(`${pagesEndPoint}/order`, { ids }).then((resp) => resp.data)

// A 30-minute link to the draft on the Reader.
const getPreviewUrl = async (): Promise<{ url: string; expiresAt: string }> =>
  AppService.post(`${endPoint}/preview`, {}).then((resp) => resp.data)

const publish = async (updatedAt: Date | string | undefined): Promise<IWebsite> =>
  AppService.post(`${endPoint}/publish`, { updatedAt: `${updatedAt ?? ''}` }).then((resp) => resp.data)

const unpublish = async (): Promise<IWebsite> => AppService.post(`${endPoint}/unpublish`, {}).then((resp) => resp.data)

const WebsiteService = {
  get,
  create,
  update,
  getTemplates,
  initialise,
  getReaderUrl,
  getPages,
  createPage,
  updatePage,
  deletePage,
  orderPages,
  getPreviewUrl,
  publish,
  unpublish,
}

export default WebsiteService
