import AppService, { iConfigParams } from './AppService'
import IWebsite, {
  IImageUse,
  IWebsitePage,
  IWebsiteMessageList,
  IWebsitePageViews,
  IWebsiteSection,
  IWebsiteSeo,
  IWebsiteTemplate,
} from '../Types/Website/IWebsite'
import IAsset, { WEBSITE_IMAGE_TYPES } from '../Types/Asset/IAsset'
import IResList from '../Types/IResList'

// The company's website (specs/001-website-builder, contracts/api.md "Website").
const endPoint = '/website'

const get = async (): Promise<IWebsite> => AppService.get(endPoint).then((resp) => resp.data)

const create = async (name: string): Promise<IWebsite> => AppService.post(endPoint, { name }).then((resp) => resp.data)

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

// Visitors' messages from the website's forms (specs/006), for the company's admins.
const messagesEndPoint = `${endPoint}/messages`
const getMessages = async (page = 1, pageSize = 20): Promise<IWebsiteMessageList> =>
  AppService.get(messagesEndPoint, { page, pageSize }).then((resp) => resp.data)
const markMessageRead = async (id: string) =>
  AppService.put(`${messagesEndPoint}/${id}/read`, {}).then((resp) => resp.data)
const deleteMessage = async (id: string) => AppService.delete(`${messagesEndPoint}/${id}`).then((resp) => resp.data)

const pagesEndPoint = `${endPoint}/pages`

const getPages = async (): Promise<IWebsitePage[]> => AppService.get(pagesEndPoint).then((resp) => resp.data)

const createPage = async (params: { slug: string; title: string }): Promise<IWebsitePage> =>
  AppService.post(pagesEndPoint, params).then((resp) => resp.data)

const updatePage = async (
  id: string,
  params: {
    slug?: string
    title?: string
    sections?: IWebsiteSection[]
    seo?: IWebsiteSeo
    updatedAt: Date | string | undefined
  },
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

// The company's images in Media that a website can show, newest first; or the ones with these ids. One image library
// since SMN-80: article and website uploads alike.
const getImages = async (currentPage = 1, ids?: string[]): Promise<IResList<IAsset>> =>
  AppService.get('/asset', {
    where: JSON.stringify({ isActive: true, fileType: WEBSITE_IMAGE_TYPES, ...(ids ? { id: ids } : {}) }),
    sort: 'createdAt:DESC',
    currentPage,
    ...(ids ? { perPage: Math.max(ids.length, 1) } : {}),
  }).then((resp) => resp.data)

const getImageUsage = async (ids: string[]): Promise<{ [assetId: string]: IImageUse[] }> =>
  AppService.get(`${endPoint}/images/usage`, { ids: ids.join(',') }).then((resp) => resp.data)

// Where the upload control sends a file (multipart field `file`).
const getImageUploadUrl = () => `${process.env.REACT_APP_REST_END_POINT || ''}${endPoint}/images`

// Page views per day and page, for a period of up to 366 UTC days.
const getPageViews = async (from: string, to: string): Promise<IWebsitePageViews> =>
  AppService.get(`${endPoint}/pageViews`, { from, to }).then((resp) => resp.data)

const WebsiteService = {
  getMessages,
  markMessageRead,
  deleteMessage,
  getPageViews,
  getImages,
  getImageUsage,
  getImageUploadUrl,
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
