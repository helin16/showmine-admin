import { vi } from 'vitest'
import axios from 'axios'
import AppService from '../../Services/AppService'
import LocalStorageService from '../../Services/LocalStorageService'

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
