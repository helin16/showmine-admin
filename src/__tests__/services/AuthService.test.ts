import { vi } from 'vitest'
import axios from 'axios'
import AuthService from '../../Services/AuthService'
import LocalStorageService from '../../Services/LocalStorageService'

vi.mock('axios')

const API = 'https://api.test'
const unauthorized = Object.assign(new Error('Request failed with status code 401'), { response: { status: 401 } })
const anonymous = { headers: { 'X-SHM-TOKEN': '' } }
const signedIn = { headers: { 'X-SHM-TOKEN': '', Authorization: 'Bearer tok', comid: 'co-1' } }

beforeEach(() => {
  process.env.REACT_APP_REST_END_POINT = API
})

describe('local token', () => {
  test('set, get and remove round-trip through local storage', () => {
    expect(AuthService.getLocalAuthToken()).toBeNull()
    AuthService.setLocalAuthToken('tok')
    expect(AuthService.getLocalAuthToken()).toBe('tok')
    expect(LocalStorageService.getToken()).toBe('tok')
    AuthService.removeLocalAuthToken()
    expect(AuthService.getLocalAuthToken()).toBeNull()
  })
})

describe('login', () => {
  test('posts the credentials and returns the session', async () => {
    const session = { token: 'tok' }
    vi.mocked(axios.post).mockResolvedValue({ data: session })
    await expect(AuthService.login('a@b.co', 'pw')).resolves.toBe(session)
    expect(axios.post).toHaveBeenCalledExactlyOnceWith(`${API}/auth`, { email: 'a@b.co', password: 'pw' }, anonymous)
  })

  test('does not store a token by itself', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { token: 'tok' } })
    await AuthService.login('a@b.co', 'pw')
    expect(AuthService.getLocalAuthToken()).toBeNull()
  })

  test('rejects on bad credentials', async () => {
    vi.mocked(axios.post).mockRejectedValue(unauthorized)
    await expect(AuthService.login('a@b.co', 'wrong')).rejects.toBe(unauthorized)
  })
})

describe('password recovery', () => {
  beforeEach(() => vi.mocked(axios.post).mockResolvedValue({ data: { success: true } }))

  test('retrievePassword posts the email', async () => {
    await expect(AuthService.retrievePassword('a@b.c')).resolves.toEqual({ success: true })
    expect(axios.post).toHaveBeenCalledExactlyOnceWith(`${API}/auth/forgot-password`, { email: 'a@b.c' }, anonymous)
  })

  test('resetPassword posts the token and the password', async () => {
    await expect(AuthService.resetPassword('tok', 'long-enough')).resolves.toEqual({ success: true })
    expect(axios.post).toHaveBeenCalledExactlyOnceWith(
      `${API}/auth/reset-password`,
      { token: 'tok', password: 'long-enough' },
      anonymous,
    )
  })
})

describe('with a session', () => {
  beforeEach(() => {
    LocalStorageService.setToken('tok')
    LocalStorageService.setCompanyId('co-1')
  })

  test('getMe returns the user and companies', async () => {
    const me = { user: { id: 'u1' }, companies: [] }
    vi.mocked(axios.get).mockResolvedValue({ data: me })
    await expect(AuthService.getMe()).resolves.toBe(me)
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}/auth/me`, signedIn)
  })

  test('getMe forwards request config', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })
    await AuthService.getMe({ timeout: 9 })
    expect(axios.get).toHaveBeenCalledExactlyOnceWith(`${API}/auth/me`, { timeout: 9, ...signedIn })
  })

  test('updateMe puts the changes', async () => {
    const me = { user: { id: 'u1' }, companies: [] }
    vi.mocked(axios.put).mockResolvedValue({ data: me })
    await expect(AuthService.updateMe({ firstName: 'L' })).resolves.toBe(me)
    expect(axios.put).toHaveBeenCalledExactlyOnceWith(`${API}/auth/me`, { firstName: 'L' }, signedIn)
  })

  test('logout deletes the session on the server', async () => {
    vi.mocked(axios.delete).mockResolvedValue({ data: {} })
    await expect(AuthService.logout()).resolves.toEqual({})
    expect(axios.delete).toHaveBeenCalledExactlyOnceWith(`${API}/auth`, signedIn)
  })

  test('an expired session rejects every call', async () => {
    vi.mocked(axios.get).mockRejectedValue(unauthorized)
    vi.mocked(axios.put).mockRejectedValue(unauthorized)
    vi.mocked(axios.delete).mockRejectedValue(unauthorized)
    await expect(AuthService.getMe()).rejects.toBe(unauthorized)
    await expect(AuthService.updateMe({})).rejects.toBe(unauthorized)
    await expect(AuthService.logout()).rejects.toBe(unauthorized)
  })
})
