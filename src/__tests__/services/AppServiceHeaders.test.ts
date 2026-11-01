import { vi } from 'vitest'
import axios from 'axios'
import AppService from '../../Services/AppService'
import LocalStorageService from '../../Services/LocalStorageService'

vi.mock('axios')

const API = 'https://api.test'

beforeEach(() => {
  process.env.REACT_APP_REST_END_POINT = API
})

describe('getHeaders', () => {
  test('uses the default header names', () => {
    expect(AppService.getHeaderCompanyIdName()).toBe('comid')
    expect(AppService.getHeaderAppTokenName()).toBe('X-SHM-TOKEN')
  })

  test('uses the configured header names and app token', () => {
    process.env.REACT_APP_HEADER_NAME_COMPANY_ID = 'x-company'
    process.env.REACT_APP_HEADER_NAME_APP_TOKEN = 'x-app'
    process.env.REACT_APP_APP_TOKEN = 'app-secret'
    LocalStorageService.setCompanyId('co-1')
    expect(AppService.getHeaders()).toEqual({ headers: { 'x-app': 'app-secret', 'x-company': 'co-1' } })
  })

  test('an unauthenticated visitor sends only the app token header', () => {
    expect(AppService.getHeaders()).toEqual({ headers: { 'X-SHM-TOKEN': '' } })
  })

  test('trims the stored token and company id', () => {
    LocalStorageService.setToken('  tok ')
    LocalStorageService.setCompanyId(' co-1  ')
    expect(AppService.getHeaders().headers).toMatchObject({ Authorization: 'Bearer tok', comid: 'co-1' })
  })

  test('whitespace-only credentials count as absent', () => {
    LocalStorageService.setToken('   ')
    LocalStorageService.setCompanyId('   ')
    expect(AppService.getHeaders()).toEqual({ headers: { 'X-SHM-TOKEN': '' } })
  })

  test('reads the company on every call, so switching company takes effect at once', () => {
    LocalStorageService.setCompanyId('co-1')
    expect(AppService.getHeaders().headers).toMatchObject({ comid: 'co-1' })
    LocalStorageService.setCompanyId('co-2')
    expect(AppService.getHeaders().headers).toMatchObject({ comid: 'co-2' })
    LocalStorageService.removeCompanyId()
    expect(AppService.getHeaders().headers).not.toHaveProperty('comid')
  })

  test('merges extra headers', () => {
    expect(AppService.getHeaders({ 'X-Extra': 'y' }).headers).toEqual({ 'X-SHM-TOKEN': '', 'X-Extra': 'y' })
  })
})

describe('query strings', () => {
  const urlFor = async (params?: object) => {
    vi.mocked(axios.get).mockResolvedValue({})
    await AppService.get('/x', params)
    return vi.mocked(axios.get).mock.lastCall?.[0]
  }

  test('no params and empty params add no query string', async () => {
    expect(await urlFor()).toBe(`${API}/x`)
    expect(await urlFor({})).toBe(`${API}/x`)
  })

  test('non-object params are ignored', async () => {
    expect(await urlFor('oops' as unknown as object)).toBe(`${API}/x`)
  })

  test('values are url-encoded', async () => {
    expect(await urlFor({ q: 'a b&c' })).toBe(`${API}/x?q=a+b%26c`)
  })

  test('remove builds the same query string as get', async () => {
    vi.mocked(axios.delete).mockResolvedValue({})
    await AppService.delete('/x')
    await AppService.delete('/x', { id: 1 })
    expect(vi.mocked(axios.delete).mock.calls.map(([url]) => url)).toEqual([`${API}/x`, `${API}/x?id=1`])
  })

  test('leaves undefined values out of the query string', async () => {
    expect(await urlFor({ q: undefined })).toBe(`${API}/x`)
  })
})

describe.each([
  ['get', () => AppService.get('/x'), 'get'],
  ['post', () => AppService.post('/x', {}), 'post'],
  ['put', () => AppService.put('/x', {}), 'put'],
  ['delete', () => AppService.delete('/x'), 'delete'],
  ['uploadImage', () => AppService.uploadImage('/x', new FormData()), 'post'],
] as const)('%s failures', (_name, call, verb) => {
  test.each([401, 403, 500])('rejects with the %d error', async (status) => {
    const error = Object.assign(new Error('failed'), { response: { status } })
    vi.mocked(axios[verb]).mockRejectedValue(error)
    await expect(call()).rejects.toBe(error)
  })
})

describe('request config', () => {
  test.each([
    ['get', () => AppService.get('/x', {}, { timeout: 9, headers: { 'X-Extra': 'y' } }), 1],
    ['delete', () => AppService.delete('/x', {}, { timeout: 9, headers: { 'X-Extra': 'y' } }), 1],
    ['post', () => AppService.post('/x', {}, { timeout: 9, headers: { 'X-Extra': 'y' } }), 2],
    ['put', () => AppService.put('/x', {}, { timeout: 9, headers: { 'X-Extra': 'y' } }), 2],
  ] as const)('%s keeps config options and merges its headers', (verb, call, configArg) => {
    call()
    expect(vi.mocked(axios[verb]).mock.calls[0][configArg]).toEqual({
      timeout: 9,
      headers: { 'X-SHM-TOKEN': '', 'X-Extra': 'y' },
    })
  })
})

describe('uploadImage', () => {
  const uploadConfig = () => {
    const form = new FormData()
    AppService.uploadImage('/upload', form, { timeout: 9 })
    const [url, sent, config] = vi.mocked(axios.post).mock.calls[0]
    expect(url).toBe(`${API}/upload`)
    expect(sent).toBe(form)
    return config
  }

  test('posts the form as multipart and keeps config options', () => {
    expect(uploadConfig()).toMatchObject({ timeout: 9, headers: { 'Content-Type': 'multipart/form-data' } })
  })

  test('sends the token and company context', () => {
    LocalStorageService.setToken('tok')
    LocalStorageService.setCompanyId('co-1')
    expect(uploadConfig()?.headers).toMatchObject({ Authorization: 'Bearer tok', comid: 'co-1' })
  })
})
