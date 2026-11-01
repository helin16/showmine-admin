import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { stubMatchMedia } from '../components/Access/domHelpers'
import { renderWithProviders } from '../testUtils'
import AuthPage from '../../Layouts/AuthPage'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import BackendPageHeader from '../../Layouts/BackendPageHeader'
import BackendPageSideMenu from '../../Layouts/BackendPageSideMenu'
import FullPageWrapper from '../../Layouts/FullPageWrapper'
import { ROLE_ADMIN, ROLE_NON_ADMIN } from '../../Types/Company/ICompanyUser'
import { MENU_KEY_ARTICLES, MENU_KEY_COMPANY_ADMIN } from '../../Components/Menu/MenuItems'
import { ARTICLE_LIST_URL, MY_PROFILE_URL } from '../../UrlMap'

vi.mock('../../Services/AuthService', () => ({ default: { updateMe: vi.fn() } }))
vi.mock('../../Services/CompanyService', () => ({ default: { getAll: vi.fn() } }))

const acme = { id: 'co-1', name: 'Acme', isActive: true }

beforeEach(() => stubMatchMedia())

describe('AuthPage', () => {
  test('marks the body while mounted', () => {
    const { unmount } = render(<AuthPage>form</AuthPage>)
    expect(document.body).toHaveClass('auth-page-body')
    unmount()
    expect(document.body).not.toHaveClass('auth-page-body')
  })

  test('only adds the description column when given one', () => {
    const { container, rerender } = render(<AuthPage>form</AuthPage>)
    expect(container.querySelector('.description')).not.toBeInTheDocument()
    expect(container.querySelector('.no-description')).toBeInTheDocument()
    rerender(<AuthPage description='about us'>form</AuthPage>)
    expect(container.querySelector('.description')).toHaveTextContent('about us')
    expect(container.querySelector('.no-description')).not.toBeInTheDocument()
  })
})

test('FullPageWrapper renders its children', () => {
  render(<FullPageWrapper>content</FullPageWrapper>)
  expect(screen.getByText('content')).toBeInTheDocument()
})

test('BackendPageContentTitle shows the title, description and controls', () => {
  renderWithProviders(
    <BackendPageContentTitle title='Title' description='Desc' controls={<button>act</button>} />,
  )
  expect(screen.getByText('Title')).toBeInTheDocument()
  expect(screen.getByText('Desc')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'act' })).toBeInTheDocument()
})

test('BackendPageContentTitle renders with the package notice enabled', () => {
  renderWithProviders(<BackendPageContentTitle title='Title' />)
  expect(screen.getByText('Title')).toBeInTheDocument()
})

describe('BackendPageSideMenu', () => {
  const admin = { companyId: 'co-1', role: ROLE_ADMIN, isActive: true, isPending: false }
  const links = () => screen.getAllByRole('link').map((link) => link.getAttribute('href'))

  test('shows the common items to a normal member', () => {
    renderWithProviders(<BackendPageSideMenu />, {
      state: { auth: { user: { id: 'u-1' }, company: acme, companyUsers: [{ ...admin, role: ROLE_NON_ADMIN }] } },
    })
    expect(screen.getByRole('link', { name: 'News/Articles' })).toHaveAttribute('href', ARTICLE_LIST_URL)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('My Company')).not.toBeInTheDocument()
    expect(screen.queryByText('Super Admin')).not.toBeInTheDocument()
  })

  test('shows no admin items without memberships', () => {
    renderWithProviders(<BackendPageSideMenu />)
    expect(links()).toHaveLength(4)
  })

  test('adds the company items for an admin of the current company', () => {
    renderWithProviders(<BackendPageSideMenu />, { state: { auth: { company: acme, companyUsers: [admin] } } })
    expect(screen.getByText('My Company')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Company Info' })).toBeInTheDocument()
    expect(screen.queryByText('Super Admin')).not.toBeInTheDocument()
  })

  test('hides the company items for an admin of another company', () => {
    renderWithProviders(<BackendPageSideMenu />, {
      state: { auth: { company: acme, companyUsers: [{ ...admin, companyId: 'co-2' }] } },
    })
    expect(screen.queryByText('My Company')).not.toBeInTheDocument()
  })

  // Known bug: the menu ignores isActive and isPending, unlike CompanyAdminRoute, so these links lead to a 403.
  test.fails.each([
    ['pending', { isPending: true }],
    ['inactive', { isActive: false }],
  ])('hides the company items for an admin who is %s', (_name, overrides) => {
    renderWithProviders(<BackendPageSideMenu />, {
      state: { auth: { company: acme, companyUsers: [{ ...admin, ...overrides }] } },
    })
    expect(screen.queryByText('My Company')).not.toBeInTheDocument()
  })

  test('shows everything to a super admin', () => {
    renderWithProviders(<BackendPageSideMenu />, { state: { auth: { user: { isSuperAdmin: true } } } })
    expect(screen.getByText('My Company')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Company List' })).toBeInTheDocument()
  })

  test('highlights the selected item', () => {
    renderWithProviders(<BackendPageSideMenu />, { state: { backendPage: { selectedMenuKey: MENU_KEY_ARTICLES } } })
    expect(screen.getByText('News/Articles').closest('li')).toHaveClass('ant-menu-item-selected')
  })

  test('selects nothing without a selected key', () => {
    const { container } = renderWithProviders(<BackendPageSideMenu />, {
      state: { backendPage: { selectedMenuKey: '' } },
    })
    expect(container.querySelector('.ant-menu-item-selected')).not.toBeInTheDocument()
  })
})

describe('BackendPageHeader', () => {
  test('toggles the side menu and its icon', () => {
    const { store, container } = renderWithProviders(<BackendPageHeader />)
    expect(container.querySelector('.anticon-menu-fold')).toBeInTheDocument()
    fireEvent.click(container.querySelector('.anticon-menu-fold') as Element)
    expect(store.getState().backendPage.collapsed).toBe(true)
    expect(container.querySelector('.anticon-menu-unfold')).toBeInTheDocument()
  })

  test('links the avatar to the profile and offers logout', () => {
    renderWithProviders(<BackendPageHeader />, { state: { auth: { user: { nickName: 'Me' } } } })
    expect(screen.getByText('Me').closest('a')).toHaveAttribute('href', MY_PROFILE_URL)
    expect(screen.getByRole('button', { name: 'logout' })).toBeInTheDocument()
  })
})

describe('BackendPage', () => {
  const renderPage = (props = {}, state = {}) =>
    renderWithProviders(
      <BackendPage selectedMenu={MENU_KEY_COMPANY_ADMIN} {...props}>
        <div>page body</div>
      </BackendPage>,
      { state },
    )

  test('renders the frame and selects the menu item', () => {
    const { store } = renderPage({ ContentHeader: <div>page header</div> }, { auth: { company: acme } })
    expect(screen.getByText('page body')).toBeInTheDocument()
    expect(screen.getByText('page header')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText(/ShowMine since/)).toBeInTheDocument()
    expect(store.getState().backendPage.selectedMenuKey).toBe(MENU_KEY_COMPANY_ADMIN)
  })

  test('marks the wrapper when collapsed', () => {
    stubMatchMedia(true)
    const { container } = renderPage({}, { backendPage: { collapsed: true } })
    expect(container.querySelector('.sider-collapsed')).toBeInTheDocument()
  })

  test('shows the page for an active company when checking the package', () => {
    renderPage({ checkPackage: true }, { auth: { company: acme } })
    expect(screen.getByText('page body')).toBeInTheDocument()
  })

  test.each([
    ['no company', undefined, 'Invalid Company'],
    ['a deleted company', { ...acme, isActive: false }, 'Company Deleted'],
  ])('blocks the page for %s when checking the package', (_name, company, title) => {
    renderPage({ checkPackage: true }, { auth: { company } })
    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.queryByText('page body')).not.toBeInTheDocument()
  })

  test('collapses the menu when the screen is small', async () => {
    stubMatchMedia(true)
    const { store } = renderPage()
    await waitFor(() => expect(store.getState().backendPage.collapsed).toBe(true))
  })

  test('expands the menu when the screen is large', async () => {
    const { store } = renderPage({}, { backendPage: { collapsed: true } })
    await waitFor(() => expect(store.getState().backendPage.collapsed).toBe(false))
  })
})
