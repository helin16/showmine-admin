import { vi } from 'vitest'
import LocalStorageService from '../../Services/LocalStorageService'

const fakeToken = 'fake-token'
const fakeTokenName = 'fake-token-name'
const fakeCompanyId = 'fake-company-id'
const fakeCompanyIdName = 'fake-company-name'

const setTokenName = (tokenName?: string) => {
  if (!tokenName) return
  process.env.REACT_APP_LOCAL_USER_TOKEN_NAME = tokenName
}
const setCompanyIdName = (companyIdName?: string) => {
  if (!companyIdName) return
  process.env.REACT_APP_LOCAL_COMPANY_ID_NAME = companyIdName
}
const getFakeStorage = () => {
  return Object.getPrototypeOf(window.localStorage)
}

describe.each([
  [undefined, 'token'],
  [fakeTokenName, fakeTokenName],
])('LocalstorageService called with %s, %s for token', (tokenName, expectedCompanyIdName) => {
  beforeEach(() => {
    setTokenName(tokenName)
  })

  test('get token from localStorage.', () => {
    getFakeStorage().getItem = vi.fn().mockReturnValueOnce(fakeToken)
    expect(LocalStorageService.getToken()).toBe(fakeToken)
    expect(getFakeStorage().getItem).toHaveBeenCalledTimes(1)
    expect(getFakeStorage().getItem).toHaveBeenLastCalledWith(expectedCompanyIdName)
  })

  test('set token to localStorage.', () => {
    getFakeStorage().setItem = vi.fn()
    expect(LocalStorageService.setToken(fakeToken)).toBe(undefined)
    expect(getFakeStorage().setItem).toHaveBeenCalledTimes(1)
    expect(getFakeStorage().setItem).toHaveBeenLastCalledWith(expectedCompanyIdName, fakeToken)
  })

  test('remove token from localStorage.', () => {
    getFakeStorage().removeItem = vi.fn()
    expect(LocalStorageService.removeToken()).toBe(undefined)
    expect(getFakeStorage().removeItem).toHaveBeenCalledTimes(1)
    expect(getFakeStorage().removeItem).toHaveBeenLastCalledWith(expectedCompanyIdName)
  })
})

describe.each([
  [undefined, 'comid'],
  [fakeCompanyIdName, fakeCompanyIdName],
])('LocalstorageService called with %s, %s for companyId', (companyIdName, expectedCompanyIdName) => {
  beforeEach(() => {
    setCompanyIdName(companyIdName)
  })

  test('get companyId from localStorage.', () => {
    getFakeStorage().getItem = vi.fn().mockReturnValueOnce(fakeCompanyId)
    expect(LocalStorageService.getCompanyId()).toBe(fakeCompanyId)
    expect(getFakeStorage().getItem).toHaveBeenCalledTimes(1)
    expect(getFakeStorage().getItem).toHaveBeenLastCalledWith(expectedCompanyIdName)
  })

  test('set token to localStorage.', () => {
    getFakeStorage().setItem = vi.fn()
    expect(LocalStorageService.setCompanyId(fakeCompanyId)).toBe(undefined)
    expect(getFakeStorage().setItem).toHaveBeenCalledTimes(1)
    expect(getFakeStorage().setItem).toHaveBeenLastCalledWith(expectedCompanyIdName, fakeCompanyId)
  })

  test('remove token from localStorage.', () => {
    getFakeStorage().removeItem = vi.fn()
    expect(LocalStorageService.removeCompanyId()).toBe(undefined)
    expect(getFakeStorage().removeItem).toHaveBeenCalledTimes(1)
    expect(getFakeStorage().removeItem).toHaveBeenLastCalledWith(expectedCompanyIdName)
  })
})

describe('login notice', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('is handed over once', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      getItem: (name: string) => store.get(name) ?? null,
      setItem: (name: string, value: string) => store.set(name, value),
      removeItem: (name: string) => store.delete(name),
    })
    LocalStorageService.setLoginNotice('hello')
    expect(LocalStorageService.getLoginNotice()).toBe('hello')
    LocalStorageService.removeLoginNotice()
    expect(LocalStorageService.getLoginNotice()).toBeNull()
  })

  test('blocked storage loses the notice and nothing else', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
    expect(() => LocalStorageService.setLoginNotice('hello')).not.toThrow()
    expect(LocalStorageService.getLoginNotice()).toBeNull()
    expect(() => LocalStorageService.removeLoginNotice()).not.toThrow()
  })
})
