import { vi } from 'vitest'
import axios from 'axios'
import ArticleService from '../../Services/ArticleService'
import AssetService from '../../Services/AssetService'
import AttachmentService from '../../Services/AttachmentService'
import AuthorService from '../../Services/AuthorService'
import ChannelEntityService from '../../Services/ChannelEntityService'
import ChannelScriptService from '../../Services/ChannelScriptService'
import ChannelService from '../../Services/ChannelService'
import CommentService from '../../Services/CommentService'
import CompanyService from '../../Services/CompanyService'
import CompanyUserService from '../../Services/CompanyUserService'
import ItemTagService from '../../Services/ItemTagService'
import ItemVisitService from '../../Services/ItemVisitService'
import LocalStorageService from '../../Services/LocalStorageService'
import MessageService from '../../Services/MessageService'
import TagService from '../../Services/TagService'
import UserService from '../../Services/UserService'
import WeChatUserService from '../../Services/WeChatUserService'

vi.mock('axios')

const API = 'https://api.test'
const body = { id: 'row-1' }
const denied = Object.assign(new Error('Request failed with status code 403'), { response: { status: 403 } })
const requestHeaders = { 'X-SHM-TOKEN': '', Authorization: 'Bearer tok', comid: 'co-1' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceRow = [string, any, string]
const readable: ServiceRow[] = [
  ['ArticleService', ArticleService, '/item'],
  ['AssetService', AssetService, '/asset'],
  ['AttachmentService', AttachmentService, '/attachment'],
  ['AuthorService', AuthorService, '/author'],
  ['ChannelEntityService', ChannelEntityService, '/channelEntity'],
  ['ChannelScriptService', ChannelScriptService, '/channelScript'],
  ['ChannelService', ChannelService, '/channel'],
  ['CommentService', CommentService, '/comment'],
  ['CompanyService', CompanyService, '/company'],
  ['CompanyUserService', CompanyUserService, '/companyUser'],
  ['ItemTagService', ItemTagService, '/itemTag'],
  ['ItemVisitService', ItemVisitService, '/itemVisit'],
  ['MessageService', MessageService, '/message'],
  ['TagService', TagService, '/tag'],
  ['UserService', UserService, '/user'],
  ['WeChatUserService', WeChatUserService, '/weChatUser'],
]
const writable = readable.filter(([name]) => name !== 'ChannelScriptService')

beforeEach(() => {
  process.env.REACT_APP_REST_END_POINT = API
  LocalStorageService.setToken('tok')
  LocalStorageService.setCompanyId('co-1')
})

describe.each(readable)('%s reads', (_name, service, endPoint) => {
  test('getAll sends params with the company context and returns the response body', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: body })
    await expect(service.getAll({ perPage: 10 })).resolves.toBe(body)
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}${endPoint}?perPage=10`, { headers: requestHeaders })
  })

  test('getAll without params has no query string', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: [] } })
    await expect(service.getAll()).resolves.toEqual({ data: [] })
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}${endPoint}`, { headers: requestHeaders })
  })

  test('getAll omits the company header when no company is selected', async () => {
    LocalStorageService.removeCompanyId()
    vi.mocked(axios.get).mockResolvedValue({ data: body })
    await service.getAll()
    const { comid, ...withoutCompany } = requestHeaders // eslint-disable-line @typescript-eslint/no-unused-vars
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}${endPoint}`, { headers: withoutCompany })
  })

  test('getItemById addresses the record and forwards request config', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: body })
    await expect(service.getItemById('a1', { full: 1 }, { timeout: 5, headers: { 'X-Extra': 'y' } })).resolves.toBe(body)
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}${endPoint}/a1?full=1`, {
      timeout: 5,
      headers: { ...requestHeaders, 'X-Extra': 'y' },
    })
  })

  test('denied reads reject with the server error', async () => {
    vi.mocked(axios.get).mockRejectedValue(denied)
    await expect(service.getAll()).rejects.toBe(denied)
    await expect(service.getItemById('a1')).rejects.toBe(denied)
  })
})

describe.each(writable)('%s writes', (_name, service, endPoint) => {
  test('create posts to the collection with the company context', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: body })
    await expect(service.create({ name: 'n' })).resolves.toBe(body)
    expect(axios.post).toHaveBeenCalledExactlyOnceWith(`${API}${endPoint}`, { name: 'n' }, { headers: requestHeaders })
  })

  test('update puts to the record', async () => {
    vi.mocked(axios.put).mockResolvedValue({ data: body })
    await expect(service.update('a1', { name: 'n' })).resolves.toBe(body)
    expect(axios.put).toHaveBeenCalledExactlyOnceWith(`${API}${endPoint}/a1`, { name: 'n' }, { headers: requestHeaders })
  })

  test('deactivate deletes the record', async () => {
    vi.mocked(axios.delete).mockResolvedValue({ data: body })
    await expect(service.deactivate('a1', { force: true })).resolves.toBe(body)
    expect(axios.delete).toHaveBeenCalledExactlyOnceWith(`${API}${endPoint}/a1?force=true`, { headers: requestHeaders })
  })

  test('denied writes reject with the server error', async () => {
    vi.mocked(axios.post).mockRejectedValue(denied)
    vi.mocked(axios.put).mockRejectedValue(denied)
    vi.mocked(axios.delete).mockRejectedValue(denied)
    await expect(service.create({})).rejects.toBe(denied)
    await expect(service.update('a1', {})).rejects.toBe(denied)
    await expect(service.deactivate('a1')).rejects.toBe(denied)
  })
})

describe('ArticleService.getPreviewUrl', () => {
  test('builds the redirect url from the configured end point', () => {
    expect(ArticleService.getPreviewUrl('a1')).toBe(`${API}/item/redirect?itemId=a1`)
  })

  test('falls back to a relative url when no end point is configured', () => {
    delete process.env.REACT_APP_REST_END_POINT
    expect(ArticleService.getPreviewUrl('a1')).toBe('/item/redirect?itemId=a1')
  })
})

describe('AssetService', () => {
  test('getUploadAssetUrl uses the configured end point', () => {
    expect(AssetService.getUploadAssetUrl()).toBe(`${API}/asset/upload`)
  })

  test('getUploadAssetUrl falls back to a relative url', () => {
    delete process.env.REACT_APP_REST_END_POINT
    expect(AssetService.getUploadAssetUrl()).toBe('/asset/upload')
  })

  test.each([
    [0, undefined, ['0.00', 'KB']],
    [1500, undefined, ['1.50', 'KB']],
    [999999, undefined, ['1000.00', 'KB']],
    [1000000, undefined, ['1.00', 'MB']],
    [2500000, undefined, ['2.50', 'MB']],
    [999999999, undefined, ['1000.00', 'MB']],
    [1000000000, undefined, ['1.00', 'GB']],
    [1234567890, 1, ['1.2', 'GB']],
    [1500, 0, ['2', 'KB']],
  ])('formatFileSize(%d, %s) gives %j', (bytes, precision, expected) => {
    expect(AssetService.formatFileSize(bytes, precision)).toEqual(expected)
  })
})
