import React from 'react'
import { render, screen } from '@testing-library/react'
import { IntlProvider, useIntl } from 'react-intl'
import { Provider } from 'react-redux'
import { vi } from 'vitest'
import { stubMatchMedia } from '../../components/Access/domHelpers'
import { makeTestStore } from '../../testUtils'
import App from '../../../App'
import Router from '../../../Router'
import AuthService from '../../../Services/AuthService'
import Locale from '../../../Components/Form/Locale'
import { messages } from '../../../i18n/messages'
import { ROLE_ADMIN } from '../../../Types/Company/ICompanyUser'
import {
  ARTICLE_LIST_URL,
  BACK_END_URL,
  COMMENTS_LIST_URL,
  COMPANY_ADMIN_URL,
  COMPANY_CHANNEL_NEW_URL,
  COMPANY_CHANNELS_URL,
  COMPANY_LIST_URL,
  COMPANY_USERS_URL,
  FORGOT_PASSWORD_URL,
  LOGIN_URL,
  MEDIA_LIST_URL,
  MY_PROFILE_URL,
  WIZARD_URL,
} from '../../../UrlMap'

vi.mock('../../../Services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/AuthService')>()
  return { default: { ...actual.default, getMe: vi.fn() } }
})

const { page } = vi.hoisted(() => ({ page: (name: string) => ({ default: () => `page: ${name}` }) }))
vi.mock('../../../Pages/Auth/LoginPage', () => page('login'))
vi.mock('../../../Pages/Auth/ForgotPasswordPage', () => ({
  default: () => `page: forgot, ${useIntl().formatMessage({ id: 'homePage' })}`,
}))
vi.mock('../../../Pages/Dashboard/DashBoardPage', () => page('dashboard'))
vi.mock('../../../Pages/Media/MediaListPage', () => page('media'))
vi.mock('../../../Pages/Comments/CommentsListPage', () => page('comments'))
vi.mock('../../../Pages/User/MyProfilePage', () => page('profile'))
vi.mock('../../../Pages/Company/CompanyEditPage', () => page('company'))
vi.mock('../../../Pages/Company/CompanyUsersPage', () => page('users'))
vi.mock('../../../Pages/Company/CompanyListPage', () => page('company list'))
vi.mock('../../../Pages/Channel/ChannelsPage', () => page('channels'))
vi.mock('../../../Pages/Channel/CompanyNewChannelPage', () => page('new channel'))
vi.mock('../../../Pages/User/WizardPage', () => page('wizard'))
vi.mock('../../../Pages/Article/ArticleListPage', () => page('articles'))
vi.mock('../../../Pages/Article/ArticleDetailsPage', () => page('article details'))

const acme = { id: 'co-1', name: 'Acme' }
const adminMember = { companyId: 'co-1', isActive: true, isPending: false, role: ROLE_ADMIN }
const superAdmin = { auth: { user: { id: 'u-1', isSuperAdmin: true }, company: acme } }
const member = { auth: { user: { id: 'u-2' }, company: acme, companyUsers: [] } }
const companyAdmin = { auth: { user: { id: 'u-3' }, company: acme, companyUsers: [adminMember] } }

const renderAt = (path: string, state = {}) => {
  window.history.pushState({}, '', path)
  return render(
    <Provider store={makeTestStore(state)}>
      <IntlProvider locale='en' messages={messages.en}>
        <Router />
      </IntlProvider>
    </Provider>,
  )
}

beforeAll(() => stubMatchMedia())

describe('Router', () => {
  test.each([
    ['/', 'login'],
    [LOGIN_URL, 'login'],
    [FORGOT_PASSWORD_URL, 'forgot, Home Page'],
  ])('%s is public', (path, name) => {
    renderAt(path)
    expect(screen.getByText(`page: ${name}`)).toBeInTheDocument()
    expect(AuthService.getMe).not.toHaveBeenCalled()
  })

  test('unknown paths get the 404 page', () => {
    renderAt('/no/such/page')
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  test.each([
    [BACK_END_URL, 'dashboard'],
    [MY_PROFILE_URL, 'profile'],
    [ARTICLE_LIST_URL, 'articles'],
    [`${ARTICLE_LIST_URL}/a-1`, 'article details'],
    [COMMENTS_LIST_URL, 'comments'],
    [MEDIA_LIST_URL, 'media'],
    [WIZARD_URL, 'wizard'],
  ])('%s is open to any signed-in user', (path, name) => {
    renderAt(path, member)
    expect(screen.getByText(`page: ${name}`)).toBeInTheDocument()
  })

  test.each([
    [COMPANY_ADMIN_URL, 'company'],
    [COMPANY_CHANNEL_NEW_URL, 'new channel'],
    [COMPANY_CHANNELS_URL, 'channels'],
    [COMPANY_USERS_URL, 'users'],
  ])('%s is limited to company admins', (path, name) => {
    const allowed = renderAt(path, companyAdmin)
    expect(screen.getByText(`page: ${name}`)).toBeInTheDocument()
    allowed.unmount()

    renderAt(path, member)
    expect(screen.getByText('403')).toBeInTheDocument()
    expect(screen.queryByText(`page: ${name}`)).not.toBeInTheDocument()
  })

  test('the company list is limited to super admins', () => {
    const allowed = renderAt(COMPANY_LIST_URL, superAdmin)
    expect(screen.getByText('page: company list')).toBeInTheDocument()
    allowed.unmount()

    renderAt(COMPANY_LIST_URL, companyAdmin)
    expect(screen.getByText('403')).toBeInTheDocument()
  })

  test('a visitor with no session is sent to login', async () => {
    vi.mocked(AuthService.getMe).mockRejectedValue(new Error('401'))
    renderAt(BACK_END_URL)
    expect(await screen.findByText('page: login')).toBeInTheDocument()
    expect(window.location.pathname).toBe(LOGIN_URL)
  })
})

describe('App', () => {
  const renderApp = (locale: typeof Locale.enUS | typeof Locale.zhCN, path = FORGOT_PASSWORD_URL) => {
    window.history.pushState({}, '', path)
    return render(
      <Provider store={makeTestStore({ app: { locale } } as never)}>
        <App />
      </Provider>,
    )
  }

  test('runs the app in English', () => {
    renderApp(Locale.enUS)
    expect(screen.getByText('page: forgot, Home Page')).toBeInTheDocument()
  })

  test('runs the app in Chinese', () => {
    renderApp(Locale.zhCN)
    expect(screen.getByText(`page: forgot, ${messages['zh-cn'].homePage}`)).toBeInTheDocument()
  })

  // Known bug: nothing calls changeLanguage, so every translate() string stays English in the Chinese UI.
  test.fails('translates the pages that use translate()', () => {
    renderApp(Locale.zhCN, '/no/such/page')
    expect(screen.getByText(messages['zh-cn'].homePage)).toBeInTheDocument()
  })
})
