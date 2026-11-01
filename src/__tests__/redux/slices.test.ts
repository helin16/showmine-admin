import reduceApp, { changeComponentSize, changeLocale } from '../../Redux/reduxers/app.slice'
import reduceAuth, {
  changeAuthenticating,
  changeCompany,
  changeCompanyPackage,
  isAuthenticated,
  removedAuthentication,
} from '../../Redux/reduxers/auth.slice'
import reduceBackend, {
  collapseSideMenu,
  expandSideMenu,
  selectMenu,
  toggleSideMenu,
} from '../../Redux/reduxers/backendpage.slice'
import reduceWeChat, { loadedWeChatJs, openedInWeChat } from '../../Redux/reduxers/wechat.slice'
import { defaultSelectedKey } from '../../Components/Menu/MenuItems'
import Locale from '../../Components/Form/Locale'
import ISession from '../../Types/Auth/ISession'

const init = { type: '@@INIT' }

describe('app slice', () => {
  const start = reduceApp(undefined, init)

  test('starts in English at large size', () => {
    expect(start).toEqual({ locale: Locale.enUS, componentSize: 'large' })
  })

  test('changeLocale changes only the locale', () => {
    expect(reduceApp(start, changeLocale({ ...start, locale: Locale.zhCN, componentSize: 'small' }))).toEqual({
      locale: Locale.zhCN,
      componentSize: 'large',
    })
  })

  test('changeComponentSize changes only the size', () => {
    expect(reduceApp(start, changeComponentSize({ locale: Locale.zhCN, componentSize: 'small' }))).toEqual({
      locale: Locale.enUS,
      componentSize: 'small',
    })
  })
})

describe('auth slice', () => {
  const user = { id: 'u1' } as ISession['user']
  const company = { id: 'c1' } as ISession['company']
  const companyUsers = [{ companyId: 'c1' }] as ISession['companyUsers']
  const session: ISession = { isAuthenticating: false, isAuthenticated: true, user, company, companyUsers }

  test('starts signed out', () => {
    expect(reduceAuth(undefined, init)).toEqual({ isAuthenticating: false })
  })

  test('changeAuthenticating sets the flag and defaults to false', () => {
    const on = reduceAuth(session, changeAuthenticating({ isAuthenticating: true }))
    expect(on).toEqual({ ...session, isAuthenticating: true })
    expect(reduceAuth(on, changeAuthenticating({}))).toEqual(session)
  })

  test('isAuthenticated stores the user and company context', () => {
    expect(reduceAuth({ isAuthenticating: true }, isAuthenticated({ user, company, companyUsers }))).toEqual({
      isAuthenticating: true,
      isAuthenticated: true,
      user,
      company,
      companyUsers,
    })
  })

  test('isAuthenticated ignores a caller trying to set a package', () => {
    expect(reduceAuth(undefined, isAuthenticated({ companyPackage: { id: 'p' } })).companyPackage).toBeUndefined()
  })

  test('changeCompany switches company and keeps the rest', () => {
    const other = { id: 'c2' } as ISession['company']
    expect(reduceAuth(session, changeCompany({ company: other }))).toEqual({ ...session, company: other })
  })

  test('changeCompany can clear the company', () => {
    expect(reduceAuth(session, changeCompany({ company: null })).company).toBeNull()
  })

  test('changeCompanyPackage changes only the package', () => {
    expect(reduceAuth(session, changeCompanyPackage({ companyPackage: { id: 'p' } }))).toEqual({
      ...session,
      companyPackage: { id: 'p' },
    })
  })

  test('removedAuthentication drops the user and company', () => {
    const after = reduceAuth({ ...session, companyPackage: { id: 'p' } }, removedAuthentication())
    expect(after).toMatchObject({
      isAuthenticated: undefined,
      user: undefined,
      company: undefined,
      companyPackage: undefined,
    })
  })

  test('removedAuthentication drops the company memberships', () => {
    expect(reduceAuth(session, removedAuthentication()).companyUsers).toBeUndefined()
  })
})

describe('backend page slice', () => {
  const start = reduceBackend(undefined, init)

  test('starts expanded on the default menu item', () => {
    expect(start).toEqual({ collapsed: false, selectedMenuKey: defaultSelectedKey })
  })

  test('collapse and expand set the flag', () => {
    const collapsed = reduceBackend(start, collapseSideMenu())
    expect(collapsed).toEqual({ ...start, collapsed: true })
    expect(reduceBackend(collapsed, collapseSideMenu())).toEqual(collapsed)
    expect(reduceBackend(collapsed, expandSideMenu())).toEqual(start)
  })

  test('toggle flips the flag both ways', () => {
    const toggled = reduceBackend(start, toggleSideMenu())
    expect(toggled.collapsed).toBe(true)
    expect(reduceBackend(toggled, toggleSideMenu()).collapsed).toBe(false)
  })

  test('selectMenu changes only the key', () => {
    expect(reduceBackend(start, selectMenu({ collapsed: true, selectedMenuKey: 'other' }))).toEqual({
      ...start,
      selectedMenuKey: 'other',
    })
  })
})

describe('wechat slice', () => {
  const start = reduceWeChat(undefined, init)
  const wx = { config: () => undefined } as never
  const loadJsError = { message: 'failed' } as never

  test('starts outside WeChat', () => {
    expect(start).toEqual({ isInWeChat: false })
  })

  test('openedInWeChat sets only the flag', () => {
    expect(reduceWeChat({ isInWeChat: false, wx }, openedInWeChat({ isInWeChat: true }))).toEqual({
      isInWeChat: true,
      wx,
    })
  })

  test('loadedWeChatJs stores the sdk', () => {
    expect(reduceWeChat(start, loadedWeChatJs({ isInWeChat: true, wx }))).toEqual({
      isInWeChat: false,
      wx,
      loadJsError: undefined,
    })
  })

  test('a failed load replaces the sdk with the error', () => {
    expect(reduceWeChat({ isInWeChat: true, wx }, loadedWeChatJs({ isInWeChat: true, loadJsError }))).toEqual({
      isInWeChat: true,
      wx: undefined,
      loadJsError,
    })
  })
})
