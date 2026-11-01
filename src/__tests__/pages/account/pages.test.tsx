/* eslint-disable camelcase -- these are field names in API responses */
import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { apiError, stubMatchMedia } from '../../components/Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import ForgotPasswordPage from '../../../Pages/Auth/ForgotPasswordPage'
import LoginPage from '../../../Pages/Auth/LoginPage'
import ChannelsPage from '../../../Pages/Channel/ChannelsPage'
import CompanyEditPage from '../../../Pages/Company/CompanyEditPage'
import CompanyListPage from '../../../Pages/Company/CompanyListPage'
import CompanyUsersPage from '../../../Pages/Company/CompanyUsersPage'
import Page404 from '../../../Pages/Error/Page404'
import MyProfilePage from '../../../Pages/User/MyProfilePage'
import WizardDonePage from '../../../Pages/User/WizardDonePage'
import WizardPage from '../../../Pages/User/WizardPage'
import AuthService from '../../../Services/AuthService'
import ArticleService from '../../../Services/ArticleService'
import ChannelService from '../../../Services/ChannelService'
import CompanyService from '../../../Services/CompanyService'
import CompanyUserService from '../../../Services/CompanyUserService'
import WeChatService from '../../../Services/WeChatService'
import message from '../../../Components/Form/message'
import {
  MENU_KEY_COMPANY_CHANNELS,
  MENU_KEY_COMPANY_LIST,
  MENU_KEY_COMPANY_USERS,
} from '../../../Components/Menu/MenuItems'
import {
  ARTICLE_LIST_URL,
  BACK_END_URL,
  COMPANY_ADMIN_URL,
  COMPANY_CHANNEL_NEW_URL,
  COMPANY_CHANNELS_URL,
  LOGIN_URL,
} from '../../../UrlMap'

vi.mock('../../../Services/AuthService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../Services/AuthService')>()
  return { default: { ...actual.default, updateMe: vi.fn(), login: vi.fn(), logout: vi.fn() } }
})
vi.mock('../../../Services/ArticleService', () => ({ default: { getAll: vi.fn() } }))
vi.mock('../../../Services/ChannelService', () => ({ default: { getAll: vi.fn() } }))
vi.mock('../../../Services/CompanyService', () => ({
  default: { getAll: vi.fn(), getItemById: vi.fn(), update: vi.fn(), deactivate: vi.fn() },
}))
vi.mock('../../../Services/CompanyUserService', () => ({ default: { getAll: vi.fn() } }))
vi.mock('../../../Services/WeChatService', () => ({
  default: { getLoginQrCodeUrl: vi.fn(), getUserFromQrcode: vi.fn(), getWeChatInAppLoginUrl: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('qrcode.react', () => ({ default: () => <div>qr code</div> }))
vi.mock('../../../Components/Article/ArticleList', () => ({ default: () => <div>article list</div> }))
vi.mock('../../../Components/Form/SingleImageUploader', () => ({ default: () => <div>uploader</div> }))
vi.mock('../../../Components/Company/CompanyEditor', () => ({
  default: ({ company, onSaved }: { company: { name: string }; onSaved: (c: object) => void }) => (
    <button onClick={() => onSaved({ id: 'co-1', name: 'Saved Co' })}>editing {company.name}</button>
  ),
}))

const acme = { id: 'co-1', name: 'Acme', isActive: true, config: { theme: 'dark' } }

beforeEach(() => {
  vi.mocked(ChannelService.getAll).mockResolvedValue({ data: [] } as never)
})
const home = (text: string) => <Route path={BACK_END_URL} element={<div>{text}</div>} />

beforeAll(() => stubMatchMedia())

describe('LoginPage', () => {
  const renderPage = (state = {}) =>
    renderWithProviders(
      <Routes>
        {home('backend')}
        <Route path='*' element={<LoginPage />} />
      </Routes>,
      { route: LOGIN_URL, state },
    )

  test('shows the password form by default', () => {
    renderPage()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Logo' })).toBeInTheDocument()
  })

  test('sends a signed-in user to the backend', async () => {
    AuthService.setLocalAuthToken('tok')
    renderPage()
    expect(await screen.findByText('backend')).toBeInTheDocument()
  })

  test('ignores a blank token', () => {
    AuthService.setLocalAuthToken('  ')
    renderPage()
    expect(screen.queryByText('backend')).not.toBeInTheDocument()
  })

  test('switches to the QR code and back', async () => {
    vi.mocked(WeChatService.getLoginQrCodeUrl).mockResolvedValue({ url: 'u', token: '' })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /WeChat/ }))
    expect(await screen.findByText('qr code')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Password Login/ }))
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
  })

  test('inside WeChat uses the in-app login', async () => {
    vi.mocked(WeChatService.getWeChatInAppLoginUrl).mockResolvedValue({ data: { auth_url: 'https://wx.test' } })
    renderPage({ weChat: { isInWeChat: true } })
    await waitFor(() => expect(screen.getByText('WeChat').closest('a')).toHaveAttribute('href', 'https://wx.test'))
    expect(WeChatService.getLoginQrCodeUrl).not.toHaveBeenCalled()
  })
})

test('ForgotPasswordPage shows the logo in the auth layout', () => {
  renderWithProviders(<ForgotPasswordPage />)
  expect(screen.getByRole('img', { name: 'Logo' })).toBeInTheDocument()
  expect(document.body).toHaveClass('auth-page-body')
})

test('Page404 explains and links home', () => {
  renderWithProviders(<Page404 />)
  expect(screen.getByText('Sorry, the page you visited does not exist.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Home Page' })).toHaveAttribute('href', '/')
})

describe('ChannelsPage', () => {
  test('the new channel button opens the wizard', () => {
    const { store } = renderWithProviders(
      <Routes>
        <Route path={COMPANY_CHANNEL_NEW_URL} element={<div>new channel form</div>} />
        <Route path='*' element={<ChannelsPage />} />
      </Routes>,
      { route: COMPANY_CHANNELS_URL, state: { auth: { company: acme } } },
    )
    expect(store.getState().backendPage.selectedMenuKey).toBe(MENU_KEY_COMPANY_CHANNELS)
    expect(document.querySelector('.ant-card')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /New Channel/ }))
    expect(screen.getByText('new channel form')).toBeInTheDocument()
  })

  test('shows no list without a company', () => {
    renderWithProviders(<ChannelsPage />)
    expect(screen.getByRole('button', { name: /New Channel/ })).toBeInTheDocument()
    expect(document.querySelector('.ant-card')).not.toBeInTheDocument()
  })
})

test('CompanyListPage shows its title and selects its menu', () => {
  const { store } = renderWithProviders(<CompanyListPage />)
  expect(screen.getAllByText('Company List').length).toBeGreaterThan(0)
  expect(store.getState().backendPage.selectedMenuKey).toBe(MENU_KEY_COMPANY_LIST)
})

describe('CompanyUsersPage', () => {
  test('lists the users of the company', async () => {
    vi.mocked(CompanyUserService.getAll).mockResolvedValue({ data: [{ id: 'cu-1', User: { nickName: 'Amy' } }] } as never)
    const { store } = renderWithProviders(<CompanyUsersPage />, { state: { auth: { company: acme } } })
    expect(await screen.findByText('Amy', { selector: 'h4' })).toBeInTheDocument()
    expect(screen.getAllByText('Users').length).toBeGreaterThan(0)
    expect(store.getState().backendPage.selectedMenuKey).toBe(MENU_KEY_COMPANY_USERS)
  })

  test('does not load users without a company', () => {
    renderWithProviders(<CompanyUsersPage />)
    expect(CompanyUserService.getAll).not.toHaveBeenCalled()
  })
})

describe('CompanyEditPage', () => {
  const state = { auth: { company: acme } }

  test('loads the company with its logo', async () => {
    vi.mocked(CompanyService.getItemById).mockResolvedValue(acme as never)
    renderWithProviders(<CompanyEditPage />, { state })
    expect(await screen.findByRole('button', { name: 'editing Acme' })).toBeInTheDocument()
    expect(CompanyService.getItemById).toHaveBeenCalledExactlyOnceWith('co-1', { include: 'LogoAsset' })
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument()
  })

  test('shows only the title without a company', () => {
    renderWithProviders(<CompanyEditPage />)
    expect(CompanyService.getItemById).not.toHaveBeenCalled()
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument()
  })

  test('reports a load failure', async () => {
    vi.mocked(CompanyService.getItemById).mockRejectedValue(apiError('down'))
    renderWithProviders(<CompanyEditPage />, { state })
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('down'))
  })

  test('saving updates the session and reloads the company', async () => {
    vi.mocked(CompanyService.getItemById).mockResolvedValue(acme as never)
    const { store } = renderWithProviders(<CompanyEditPage />, { state })
    fireEvent.click(await screen.findByRole('button', { name: 'editing Acme' }))
    expect(store.getState().auth.company).toEqual({ id: 'co-1', name: 'Saved Co' })
    await waitFor(() => expect(CompanyService.getItemById).toHaveBeenCalledTimes(2))
  })
})

describe('MyProfilePage', () => {
  test('edits the signed-in user', () => {
    renderWithProviders(<MyProfilePage />, { state: { auth: { user: { id: 'u-1', firstName: 'Ann' } } } })
    expect(screen.getByPlaceholderText('First Name')).toHaveValue('Ann')
  })

  test('shows no editor without a user', () => {
    renderWithProviders(<MyProfilePage />)
    expect(screen.queryByPlaceholderText('First Name')).not.toBeInTheDocument()
  })
})

test('WizardDonePage links to the main areas', () => {
  renderWithProviders(<WizardDonePage />)
  expect(screen.getByText('Basic Setting Completed!')).toBeInTheDocument()
  const links = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
  expect(links).toEqual([BACK_END_URL, BACK_END_URL, ARTICLE_LIST_URL, COMPANY_CHANNELS_URL, COMPANY_ADMIN_URL])
})

describe('WizardPage', () => {
  const state = { auth: { company: acme } }
  const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  const articles = (data: object[]) => vi.mocked(ArticleService.getAll).mockResolvedValue({ data } as never)
  const step = (index: number) => document.querySelectorAll('.ant-steps-item')[index]

  test('checks for existing articles on load', async () => {
    articles([{ id: 'a-1' }])
    renderWithProviders(<WizardPage />, { state })
    expect(screen.getByText('Company Setup Wizard')).toBeInTheDocument()
    await waitFor(() =>
      expect(ArticleService.getAll).toHaveBeenCalledExactlyOnceWith({
        currentPage: 1,
        perPage: 1,
        where: JSON.stringify({ isActive: true }),
      }),
    )
    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument()
  })

  test('walks through every step and marks the company as set up', async () => {
    articles([{ id: 'a-1' }])
    vi.mocked(CompanyService.update).mockResolvedValue(acme as never)
    renderWithProviders(<WizardPage />, { state })
    await waitFor(() => expect(ArticleService.getAll).toHaveBeenCalled())

    next()
    expect(CompanyService.update).toHaveBeenCalledExactlyOnceWith('co-1', {
      config: { theme: 'dark', has_been_setup: true },
    })
    await waitFor(() => expect(step(1)).toHaveClass('ant-steps-item-active'))

    next()
    expect(await screen.findByText('article list')).toBeInTheDocument()

    next()
    expect(await screen.findByText('Basic Setting Completed!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  })

  test('goes back a step', async () => {
    articles([])
    vi.mocked(CompanyService.update).mockResolvedValue(acme as never)
    renderWithProviders(<WizardPage />, { state })
    await waitFor(() => expect(ArticleService.getAll).toHaveBeenCalled())
    next()
    fireEvent.click(await screen.findByRole('button', { name: 'Previous' }))
    await waitFor(() => expect(step(0)).toHaveClass('ant-steps-item-active'))
  })

  test('offers to write the first article when there are none', async () => {
    articles([])
    vi.mocked(CompanyService.update).mockResolvedValue(acme as never)
    renderWithProviders(<WizardPage />, { state })
    await waitFor(() => expect(ArticleService.getAll).toHaveBeenCalled())
    await screen.findByText('Company')
    next()
    await waitFor(() => expect(step(1)).toHaveClass('ant-steps-item-active'))
    next()
    const link = await screen.findByRole('button', { name: /New Article/ })
    expect(link.closest('a')).toHaveAttribute('href', `${ARTICLE_LIST_URL}/new`)
    expect(screen.queryByText('article list')).not.toBeInTheDocument()
  })

  test('steps forward without saving when there is no company', async () => {
    renderWithProviders(<WizardPage />)
    expect(ArticleService.getAll).not.toHaveBeenCalled()
    next()
    await waitFor(() => expect(step(1)).toHaveClass('ant-steps-item-active'))
    expect(CompanyService.update).not.toHaveBeenCalled()
  })
})
