import IArticle from '../../../Types/Article/IArticle'
import ICompany from '../../../Types/Company/ICompany'
import IUser from '../../../Types/User/IUser'

// antd reads matchMedia for responsive grids and jsdom has none. Plain function, so resetAllMocks cannot clear it.
window.matchMedia =
  window.matchMedia ||
  ((query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }) as unknown as MediaQueryList)

export const company = { id: 'co-1', name: 'Acme' } as ICompany
export const user = { id: 'user-1', nickName: 'Lin' } as IUser
export const signedIn = { auth: { company, user } }

// Built from local parts, so the formatted text is the same in every time zone.
export const FIXED_DATE = new Date(2024, 2, 15, 9, 30)

export const makeArticle = (overrides: Partial<IArticle> = {}) =>
  ({ id: 'art-1', title: 'Hello world', isActive: true, isPublished: false, companyId: 'co-1', ...overrides }) as IArticle

export const listOf = <T>(data: T[], overrides = {}) => ({
  data,
  total: data.length,
  perPage: 12,
  currentPage: 1,
  pages: 1,
  from: 0,
  to: 0,
  ...overrides,
})

// The shape axios rejects with when the server answers.
export const httpError = (message: string) =>
  Object.assign(new Error('Request failed'), { response: { data: { message } } })

export const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// A rejected request whose .catch handler runs synchronously. A handler that throws is recorded in `thrown`,
// where a real promise would turn it into an unhandled rejection and fail the whole run.
export const rejectedChain = (error: unknown) => {
  const thrown: unknown[] = []
  const chain = {
    then: () => chain,
    catch: (handler: (err: unknown) => void) => {
      try {
        handler(error)
      } catch (err) {
        thrown.push(err)
      }
      return chain
    },
    finally: (handler: () => void) => {
      handler()
      return chain
    },
  }
  return { chain: chain as unknown as Promise<never>, thrown }
}
