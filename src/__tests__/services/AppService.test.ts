import { vi } from 'vitest'
import axios from 'axios'
import AppService from '../../Services/AppService'
import LocalStorageService from '../../Services/LocalStorageService'
import { changeLanguage } from '../../i18n/translate'
import { messages } from '../../i18n/messages'
import Locale from '../../Components/Form/Locale'

vi.mock('axios')

const fakeParams = { some: 'param', another: 'one' }
const fakeResponse = { one: 'result', another: 'result' }
const fakeUrl = '/some/url'
const fakeAPIEndPoint = 'https://test.com'
const fakeToken = 'fake_token'
const fakeCompanyId = 'test_company_id'
const setToken = (token?: string) => {
  if (!token) return
  LocalStorageService.setToken(token)
}
const setCompanyId = (companyId?: string) => {
  if (!companyId) return
  LocalStorageService.setCompanyId(companyId)
}
const getExpectedHeader = (token?: string, companyId?: string) => ({
  headers: {
    'X-SHM-TOKEN': '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(companyId ? { comid: companyId } : {}),
  },
})

describe('AppService', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    LocalStorageService.removeToken()
    LocalStorageService.removeCompanyId()
    process.env = { ...OLD_ENV } // make a copy
    process.env.REACT_APP_REST_END_POINT = fakeAPIEndPoint
  })

  afterAll(() => {
    process.env = OLD_ENV // restore old env
  })

  describe.each([
    [fakeToken, undefined],
    [undefined, fakeCompanyId],
    [undefined, undefined],
    [fakeToken, fakeCompanyId],
  ])('with token: %s, companyId:%s', (token?: string, companyId?: string) => {
    beforeEach(() => {
      setToken(token)
      setCompanyId(companyId)
    })

    test('can get data from provided url', async () => {
      axios.get = vi.fn().mockReturnValueOnce(fakeResponse)
      const result = await AppService.get(fakeUrl, fakeParams)
      expect(result).toStrictEqual(fakeResponse)
      expect(axios.get).toHaveBeenLastCalledWith(
        `${fakeAPIEndPoint}${fakeUrl}?${new URLSearchParams(fakeParams).toString()}`,
        getExpectedHeader(token, companyId),
      )
      expect(axios.get).toHaveBeenCalledTimes(1)
    })

    test('can post data from provided url', async () => {
      axios.post = vi.fn().mockReturnValueOnce(fakeResponse)
      const result = await AppService.post(fakeUrl, fakeParams)
      expect(result).toStrictEqual(fakeResponse)
      // expect(AppService.post(fakeUrl, fakeParams)).toBe(fakeResponse);
      expect(axios.post).toHaveBeenLastCalledWith(
        `${fakeAPIEndPoint}${fakeUrl}`,
        fakeParams,
        getExpectedHeader(token, companyId),
      )
      expect(axios.post).toHaveBeenCalledTimes(1)
    })

    test('can put data from provided url', async () => {
      axios.put = vi.fn().mockReturnValueOnce(fakeResponse)
      const result = await AppService.put(fakeUrl, fakeParams)
      expect(result).toStrictEqual(fakeResponse)
      // expect(AppService.put(fakeUrl, fakeParams)).toBe(fakeResponse);
      expect(axios.put).toHaveBeenLastCalledWith(
        `${fakeAPIEndPoint}${fakeUrl}`,
        fakeParams,
        getExpectedHeader(token, companyId),
      )
      expect(axios.put).toHaveBeenCalledTimes(1)
    })

    test('can delete data from provided url', async () => {
      axios.delete = vi.fn().mockReturnValueOnce(fakeResponse)
      const result = await AppService.delete(fakeUrl, fakeParams)
      expect(result).toStrictEqual(fakeResponse)
      // expect(AppService.delete(fakeUrl, fakeParams)).toBe(fakeResponse);
      expect(axios.delete).toHaveBeenLastCalledWith(
        `${fakeAPIEndPoint}${fakeUrl}?${new URLSearchParams(fakeParams).toString()}`,
        getExpectedHeader(token, companyId),
      )
      expect(axios.delete).toHaveBeenCalledTimes(1)
    })
  })
})

const failure = (status: number, data?: unknown) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data } })
const en = messages[Locale.enUS.locale]
const cn = messages[Locale.zhCN.locale]
const calls = [
  ['get', () => AppService.get(fakeUrl), 'get'],
  ['post', () => AppService.post(fakeUrl, {}), 'post'],
  ['put', () => AppService.put(fakeUrl, {}), 'put'],
  ['delete', () => AppService.delete(fakeUrl), 'delete'],
  ['uploadImage', () => AppService.uploadImage(fakeUrl, new FormData()), 'post'],
] as const

describe.each(calls)('%s and the messages for 413 and 429', (_name, call, verb) => {
  afterEach(() => changeLanguage(Locale.enUS.locale))

  test.each([
    [413, 'request-too-large'],
    [429, 'request-too-many'],
  ])('a %d rejects with its message, once, whatever the body was', async (status, id) => {
    const error = failure(status, '<html>nginx</html>')
    axios[verb] = vi.fn().mockRejectedValue(error)
    await expect(call()).rejects.toBe(error)
    expect(error.response.data).toEqual({ message: en[id] })
    expect(error.message).toBe(en[id])
    expect(axios[verb]).toHaveBeenCalledTimes(1)
  })

  test('the message follows the language', async () => {
    changeLanguage(Locale.zhCN.locale)
    const error = failure(429)
    axios[verb] = vi.fn().mockRejectedValue(error)
    await expect(call()).rejects.toBe(error)
    expect(error.message).toBe(cn['request-too-many'])
  })

  test('other failures keep what the API said', async () => {
    const error = failure(400, { message: 'Bad' })
    axios[verb] = vi.fn().mockRejectedValue(error)
    await expect(call()).rejects.toBe(error)
    expect(error.response.data).toEqual({ message: 'Bad' })
  })
})

test('a failure with no response is left alone', async () => {
  const error = new Error('Network Error')
  axios.get = vi.fn().mockRejectedValue(error)
  await expect(AppService.get(fakeUrl)).rejects.toBe(error)
  expect(error.message).toBe('Network Error')
})

test('has English and Chinese for every message it shows', () => {
  for (const id of ['session-expired', 'request-too-large', 'request-too-many']) {
    expect(en[id]).toBeTruthy()
    expect(cn[id]).toBeTruthy()
    expect(cn[id]).not.toBe(en[id])
  }
})

describe('an expired session', () => {
  const REJECTED = 'Unauthorized' // Passport's whole answer to a token it refuses.
  const pending = Symbol('pending')
  const settled = (promise: Promise<unknown>) =>
    Promise.race([promise, new Promise((resolve) => setTimeout(resolve, 0, pending))])
  let assign: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    assign = vi.fn()
    vi.stubGlobal('location', {
      origin: 'https://admin.test',
      pathname: '/b/articles',
      search: '?page=2',
      hash: '#top',
      assign,
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    changeLanguage(Locale.enUS.locale)
  })

  describe.each(calls)('from %s', (_name, call, verb) => {
    test('clears the sign-in and goes to the password form, keeping the page', async () => {
      LocalStorageService.setToken(fakeToken)
      LocalStorageService.setCompanyId(fakeCompanyId)
      axios[verb] = vi.fn().mockRejectedValue(failure(401, REJECTED))
      expect(await settled(call())).toBe(pending)
      expect(LocalStorageService.getToken()).toBeNull()
      expect(LocalStorageService.getCompanyId()).toBeNull()
      expect(assign).toHaveBeenCalledExactlyOnceWith(
        `/login?password=1&from=${encodeURIComponent('/b/articles?page=2#top')}`,
      )
      expect(LocalStorageService.getLoginNotice()).toBe(en['session-expired'])
    })
  })

  test('the notice is in the language the person was using', async () => {
    changeLanguage(Locale.zhCN.locale)
    LocalStorageService.setToken(fakeToken)
    axios.get = vi.fn().mockRejectedValue(failure(401, REJECTED))
    await settled(AppService.get(fakeUrl))
    expect(LocalStorageService.getLoginNotice()).toBe(cn['session-expired'])
  })

  test('a wrong password on POST /auth rejects, even with an old token around', async () => {
    LocalStorageService.setToken(fakeToken)
    const error = failure(401, REJECTED)
    axios.post = vi.fn().mockRejectedValue(error)
    await expect(AppService.post('/auth', {})).rejects.toBe(error)
    expect(LocalStorageService.getToken()).toBe(fakeToken)
    expect(assign).not.toHaveBeenCalled()
  })

  test('other calls to /auth paths do end the session', async () => {
    LocalStorageService.setToken(fakeToken)
    axios.get = vi.fn().mockRejectedValue(failure(401, REJECTED))
    await settled(AppService.get('/auth/me'))
    expect(assign).toHaveBeenCalledTimes(1)
  })

  test.each([
    ['no company access', 'You don\'t have access to data under company(ID=1).'],
    ['a member at an admin page', 'You don\'t have Admin access to this company'],
    ['a bad app token', 'Invalid AppToken!'],
  ])('%s is a refusal and keeps the session', async (_name, text) => {
    LocalStorageService.setToken(fakeToken)
    const error = failure(401, { message: text })
    axios.put = vi.fn().mockRejectedValue(error)
    await expect(AppService.put(fakeUrl, {})).rejects.toBe(error)
    expect(LocalStorageService.getToken()).toBe(fakeToken)
    expect(assign).not.toHaveBeenCalled()
  })

  test('still works if the API starts sending the same refusal as JSON', async () => {
    LocalStorageService.setToken(fakeToken)
    axios.get = vi.fn().mockRejectedValue(failure(401, { message: REJECTED }))
    expect(await settled(AppService.get(fakeUrl))).toBe(pending)
    expect(assign).toHaveBeenCalledTimes(1)
  })

  test('a call sent with no token just rejects', async () => {
    const error = failure(401, REJECTED)
    axios.get = vi.fn().mockRejectedValue(error)
    await expect(AppService.get(fakeUrl)).rejects.toBe(error)
    expect(assign).not.toHaveBeenCalled()
  })

  test('a late answer for an old token leaves a newer sign-in alone', async () => {
    LocalStorageService.setToken('old')
    const error = failure(401, REJECTED)
    let refuse = (_err: unknown) => undefined as void
    axios.get = vi.fn().mockReturnValue(new Promise((_, reject) => (refuse = reject)))
    const call = AppService.get(fakeUrl)
    LocalStorageService.setToken('new')
    refuse(error)
    await expect(call).rejects.toBe(error)
    expect(LocalStorageService.getToken()).toBe('new')
    expect(assign).not.toHaveBeenCalled()
  })

  test('calls refused together all wait for the page to leave', async () => {
    LocalStorageService.setToken(fakeToken)
    axios.get = vi.fn().mockRejectedValue(failure(401, REJECTED))
    const results = await settled(Promise.race([AppService.get(fakeUrl), AppService.get(fakeUrl)]))
    expect(results).toBe(pending)
    expect(LocalStorageService.getToken()).toBeNull()
  })

  describe('uploads, which do not go through axios', () => {
    test('a refused token ends the session', () => {
      LocalStorageService.setToken(fakeToken)
      expect(AppService.getUploadFailure(401, REJECTED)).toBeUndefined()
      expect(LocalStorageService.getToken()).toBeNull()
      expect(assign).toHaveBeenCalledTimes(1)
    })

    test('a refusal with a reason keeps it', () => {
      LocalStorageService.setToken(fakeToken)
      AppService.getUploadFailure(401, { message: 'no access' })
      AppService.getUploadFailure(401, undefined)
      expect(LocalStorageService.getToken()).toBe(fakeToken)
      expect(assign).not.toHaveBeenCalled()
    })

    test('nothing to end without a token', () => {
      AppService.getUploadFailure(401, REJECTED)
      expect(assign).not.toHaveBeenCalled()
    })

    test.each([
      [413, 'request-too-large'],
      [429, 'request-too-many'],
    ])('a %d has its message', (status, id) => {
      expect(AppService.getUploadFailure(status, '')).toBe(en[id])
    })

    test('anything else has none', () => {
      expect(AppService.getUploadFailure(500, '')).toBeUndefined()
    })
  })
})
