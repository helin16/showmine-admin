import UrlMap, {
  ARTICLE_DETAILS_URL,
  ARTICLE_LIST_URL,
  AUTH_URL_USER_CONFIRM,
  COMPANY_LIST_URL,
  getCurrentUrl,
  getFullUrl,
  getUrl,
  LOGIN_URL,
} from '../../UrlMap'

describe('url constants', () => {
  test('back-end pages live under the back-end prefix', () => {
    expect(ARTICLE_LIST_URL).toBe('/b/articles')
    expect(COMPANY_LIST_URL).toBe('/b/super/company/')
  })

  test('the default export exposes the routes', () => {
    expect(UrlMap.LOGIN_URL).toBe(LOGIN_URL)
    expect(UrlMap.ARTICLE_DETAILS_URL).toBe(ARTICLE_DETAILS_URL)
  })
})

describe('getUrl', () => {
  test('defaults to replacing :id with new', () => {
    expect(getUrl(ARTICLE_DETAILS_URL)).toBe('/b/articles/new')
  })

  test('uses the given placeholder and value', () => {
    expect(getUrl(AUTH_URL_USER_CONFIRM, ':companyId', 'co-1')).toBe('/a/user-confirm/co-1')
  })

  test('replaces every occurrence', () => {
    expect(getUrl('/a/:id/b/:id', ':id', '7')).toBe('/a/7/b/7')
  })

  test('leaves a url without the placeholder alone', () => {
    expect(getUrl(LOGIN_URL)).toBe(LOGIN_URL)
  })
})

describe('getFullUrl', () => {
  beforeEach(() => {
    process.env.REACT_APP_PUBLIC_URL = 'https://admin.test'
  })

  test('prefixes the public url', () => {
    expect(getFullUrl(LOGIN_URL)).toBe('https://admin.test/login')
  })

  test('empty params add no query string', () => {
    expect(getFullUrl(LOGIN_URL, {})).toBe('https://admin.test/login')
  })

  test('encodes params', () => {
    expect(getFullUrl(LOGIN_URL, { next: '/b/a b', x: '1' })).toBe('https://admin.test/login?next=%2Fb%2Fa+b&x=1')
  })
})

describe('getCurrentUrl', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  test('follows the browser location', () => {
    window.history.replaceState(null, '', '/some/page?a=1')
    expect(getCurrentUrl()).toBe(`${window.location.origin}/some/page?a=1`)
  })
})
