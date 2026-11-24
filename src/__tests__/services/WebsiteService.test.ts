import { vi } from 'vitest'
import axios from 'axios'
import WebsiteService from '../../Services/WebsiteService'
import LocalStorageService from '../../Services/LocalStorageService'

vi.mock('axios')

const API = 'https://api.test'
const body = { id: 'w-1', slug: 'acme' }
const headers = { 'X-SHM-TOKEN': '', Authorization: 'Bearer tok', comid: 'co-1' }

beforeEach(() => {
  process.env.REACT_APP_REST_END_POINT = API
  LocalStorageService.setToken('tok')
  LocalStorageService.setCompanyId('co-1')
})

describe('WebsiteService', () => {
  test('get reads the website of the company', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: body })
    await expect(WebsiteService.get()).resolves.toEqual(body)
    expect(axios.get).toHaveBeenCalledWith(`${API}/website`, { headers })
  })

  test('create posts only the name', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: body })
    await expect(WebsiteService.create('acme')).resolves.toEqual(body)
    expect(axios.post).toHaveBeenCalledWith(`${API}/website`, { slug: 'acme' }, { headers })
  })

  test('getTemplates lists the templates', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [body] })
    await expect(WebsiteService.getTemplates()).resolves.toEqual([body])
    expect(axios.get).toHaveBeenCalledWith(`${API}/website/templates`, { headers })
  })

  test('initialise posts the template, and the confirmed count when replacing', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: [body] })
    const params = { templateId: 'shop', templateVersion: 1, replace: true, pageCount: 2 }
    await expect(WebsiteService.initialise(params)).resolves.toEqual([body])
    expect(axios.post).toHaveBeenCalledWith(`${API}/website/initialise`, params, { headers })
  })

  test('getReaderUrl joins the Reader address, or gives null without it', () => {
    process.env.REACT_APP_FRONT_END_URL = 'https://reader.test/'
    expect(WebsiteService.getReaderUrl('/t/shop')).toBe('https://reader.test/t/shop')
    process.env.REACT_APP_FRONT_END_URL = ' '
    expect(WebsiteService.getReaderUrl('/t/shop')).toBeNull()
  })

  test('update puts the changes with updatedAt', async () => {
    vi.mocked(axios.put).mockResolvedValue({ data: body })
    const changes = { slug: 'acme', updatedAt: '2026-11-24T00:00:00.000Z' }
    await expect(WebsiteService.update(changes)).resolves.toEqual(body)
    expect(axios.put).toHaveBeenCalledWith(`${API}/website`, changes, { headers })
  })

  describe('pages, preview and publishing', () => {
    test.each([
      ['getPages', () => WebsiteService.getPages(), 'get', '/website/pages', undefined],
      [
        'createPage',
        () => WebsiteService.createPage({ slug: 'a', title: 'A' }),
        'post',
        '/website/pages',
        { slug: 'a', title: 'A' },
      ],
      [
        'updatePage',
        () => WebsiteService.updatePage('p-1', { title: 'A', updatedAt: 't' }),
        'put',
        '/website/pages/p-1',
        { title: 'A', updatedAt: 't' },
      ],
      [
        'orderPages',
        () => WebsiteService.orderPages(['p-2', 'p-1']),
        'put',
        '/website/pages/order',
        { ids: ['p-2', 'p-1'] },
      ],
      ['getPreviewUrl', () => WebsiteService.getPreviewUrl(), 'post', '/website/preview', {}],
      ['publish', () => WebsiteService.publish('t'), 'post', '/website/publish', { updatedAt: 't' }],
      ['unpublish', () => WebsiteService.unpublish(), 'post', '/website/unpublish', {}],
    ] as [string, () => Promise<unknown>, 'get' | 'post' | 'put', string, object | undefined][])(
      '%s calls %s %s',
      async (_name, call, method, path, data) => {
        vi.mocked(axios[method]).mockResolvedValue({ data: body })
        await expect(call()).resolves.toEqual(body)
        if (data === undefined) {
          expect(axios[method]).toHaveBeenCalledWith(`${API}${path}`, { headers })
        } else {
          expect(axios[method]).toHaveBeenCalledWith(`${API}${path}`, data, { headers })
        }
      },
    )

    test('deletePage deletes the page', async () => {
      vi.mocked(axios.delete).mockResolvedValue({ data: {} })
      await WebsiteService.deletePage('p-1')
      expect(vi.mocked(axios.delete).mock.calls[0][0]).toBe(`${API}/website/pages/p-1`)
    })
  })
})
