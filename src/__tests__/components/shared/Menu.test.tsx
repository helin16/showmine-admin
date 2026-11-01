import React from 'react'
import { render, screen } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { renderWithProviders } from '../../testUtils'
import CompanyLogo from '../../../Components/Menu/CompanyLogo'
import MenuItems, {
  defaultSelectedKey,
  MENU_ACCESS_LEVEL_COMPANY_ADMIN,
  MENU_ACCESS_LEVEL_SUPER_ADMIN,
  MENU_KEY_COMPANY_LIST,
  MENU_KEY_COMPANY_USERS,
  MENU_KEY_DASHBOARD,
} from '../../../Components/Menu/MenuItems'
import { messages } from '../../../i18n/messages'
import { BACK_END_URL, COMPANY_LIST_URL, COMPANY_USERS_URL } from '../../../UrlMap'

type Item = (typeof MenuItems)[number]
const links = MenuItems.flatMap((section: Item) => ('items' in section ? (section.items as Item[]) : [section]))
const sectionOf = (key: string) =>
  MenuItems.find((section: Item) => 'items' in section && section.items?.some((item) => item.key === key))

describe('CompanyLogo', () => {
  test('shows the current company name', () => {
    renderWithProviders(<CompanyLogo />, { state: { auth: { company: { name: 'Acme Pty Ltd' } } } })
    expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument()
  })

  test.each([
    ['undefined', undefined],
    ['null', null],
    ['without a name', {}],
  ])('renders nothing when the company is %s', (_label, company) => {
    const { container } = renderWithProviders(<CompanyLogo />, { state: { auth: { company } } as never })
    expect(container).toBeEmptyDOMElement()
  })
})

describe('MenuItems', () => {
  test('the dashboard is the default and links to the back end home', () => {
    expect(defaultSelectedKey).toBe(MENU_KEY_DASHBOARD)
    expect(links[0]).toMatchObject({ key: MENU_KEY_DASHBOARD, url: BACK_END_URL })
  })

  test('every link has a unique key, a url and an icon', () => {
    const keys = links.map((link: Item) => link.key)
    expect(new Set(keys).size).toBe(keys.length)
    links.forEach((link: Item) => {
      expect(link.url).toEqual(expect.stringMatching(/^\//))
      expect(link.icon).toBeTruthy()
    })
  })

  test('company pages need company admin access', () => {
    expect(sectionOf(MENU_KEY_COMPANY_USERS)?.access).toBe(MENU_ACCESS_LEVEL_COMPANY_ADMIN)
    expect(links.find((link: Item) => link.key === MENU_KEY_COMPANY_USERS)?.url).toBe(COMPANY_USERS_URL)
  })

  test('the company list needs super admin access', () => {
    expect(sectionOf(MENU_KEY_COMPANY_LIST)?.access).toBe(MENU_ACCESS_LEVEL_SUPER_ADMIN)
    expect(links.find((link: Item) => link.key === MENU_KEY_COMPANY_LIST)?.url).toBe(COMPANY_LIST_URL)
  })

  test('only the two admin sections are restricted', () => {
    expect(MenuItems.filter((section: Item) => section.access).length).toBe(2)
    expect(MenuItems.filter((section: Item) => !section.access).length).toBe(2)
  })

  test.each(Object.keys(messages))('every label has a %s translation', (locale) => {
    const onError = vi.fn()
    const labels = [...MenuItems, ...links].map((item: Item, index: number) => <p key={index}>{item.name}</p>)
    render(
      <IntlProvider locale={locale} messages={messages[locale as keyof typeof messages]} onError={onError}>
        {labels}
      </IntlProvider>,
    )
    expect(onError).not.toHaveBeenCalled()
  })
})
