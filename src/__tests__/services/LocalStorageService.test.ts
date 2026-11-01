import { vi } from 'vitest'
import AppService from '../../Services/AppService'
import AuthService from '../../Services/AuthService'
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

  test('get companyId.', () => {
    getFakeStorage().getItem = vi.fn().mockReturnValueOnce(fakeCompanyId)
    expect(LocalStorageService.getCompanyId()).toBe(fakeCompanyId)
    expect(getFakeStorage().getItem).toHaveBeenCalledTimes(1)
    expect(getFakeStorage().getItem).toHaveBeenLastCalledWith(expectedCompanyIdName)
  })

  test('set companyId.', () => {
    getFakeStorage().setItem = vi.fn()
    expect(LocalStorageService.setCompanyId(fakeCompanyId)).toBe(undefined)
    expect(getFakeStorage().setItem).toHaveBeenCalledTimes(1)
    expect(getFakeStorage().setItem).toHaveBeenLastCalledWith(expectedCompanyIdName, fakeCompanyId)
  })

  test('remove companyId.', () => {
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

describe('company id', () => {
  const makeStorage = () => {
    const store = new Map<string, string>()
    return {
      getItem: (name: string) => store.get(name) ?? null,
      setItem: (name: string, value: string) => store.set(name, value),
      removeItem: (name: string) => store.delete(name),
    }
  }
  // Each browser tab has its own sessionStorage and shares localStorage. jsdom has one window, so this swaps the first.
  const inTab = <T,>(tab: ReturnType<typeof makeStorage>, act: () => T) => {
    vi.stubGlobal('sessionStorage', tab)
    return act()
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('is kept for the tab, while the token is kept for the browser', () => {
    const [tab, browser] = [makeStorage(), makeStorage()]
    vi.stubGlobal('sessionStorage', tab)
    vi.stubGlobal('localStorage', browser)

    LocalStorageService.setCompanyId('co-1')
    LocalStorageService.setToken('tok')

    expect(tab.getItem('comid')).toBe('co-1')
    expect(browser.getItem('comid')).toBeNull()
    expect(browser.getItem('token')).toBe('tok')
    expect(tab.getItem('token')).toBeNull()
  })

  test('two tabs send their own company, and the same sign-in', () => {
    const [tabA, tabB, browser] = [makeStorage(), makeStorage(), makeStorage()]
    vi.stubGlobal('localStorage', browser)
    LocalStorageService.setToken('tok')

    inTab(tabA, () => LocalStorageService.setCompanyId('co-a'))
    inTab(tabB, () => LocalStorageService.setCompanyId('co-b'))

    expect(inTab(tabA, () => AppService.getHeaders().headers)).toMatchObject({ comid: 'co-a', Authorization: 'Bearer tok' })
    expect(inTab(tabB, () => AppService.getHeaders().headers)).toMatchObject({ comid: 'co-b', Authorization: 'Bearer tok' })
  })

  test('signing out in one tab clears only that tab company, and the shared token', () => {
    const [tabA, tabB, browser] = [makeStorage(), makeStorage(), makeStorage()]
    vi.stubGlobal('localStorage', browser)
    LocalStorageService.setToken('tok')
    inTab(tabA, () => LocalStorageService.setCompanyId('co-a'))
    inTab(tabB, () => LocalStorageService.setCompanyId('co-b'))

    inTab(tabB, () => AuthService.removeLocalAuthToken())

    expect(inTab(tabB, () => LocalStorageService.getCompanyId())).toBeNull()
    expect(inTab(tabA, () => LocalStorageService.getCompanyId())).toBe('co-a')
    expect(LocalStorageService.getToken()).toBeNull()
  })

  test('a new tab has none, so it sends no company header', () => {
    vi.stubGlobal('sessionStorage', makeStorage())
    vi.stubGlobal('localStorage', makeStorage())
    expect(AppService.getHeaders().headers).not.toHaveProperty('comid')
  })

  test('blocked storage loses it and nothing else', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
    expect(() => LocalStorageService.setCompanyId('co-1')).not.toThrow()
    expect(LocalStorageService.getCompanyId()).toBeNull()
    expect(() => LocalStorageService.removeCompanyId()).not.toThrow()
  })
})
