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

  test('update puts the changes with updatedAt', async () => {
    vi.mocked(axios.put).mockResolvedValue({ data: body })
    const changes = { slug: 'acme', updatedAt: '2026-11-24T00:00:00.000Z' }
    await expect(WebsiteService.update(changes)).resolves.toEqual(body)
    expect(axios.put).toHaveBeenCalledWith(`${API}/website`, changes, { headers })
  })
})
