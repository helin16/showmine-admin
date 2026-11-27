import React from 'react'
import { render, screen } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import { vi } from 'vitest'
import { makeTestStore, renderWithProviders } from '../../testUtils'
import WebsiteService from '../../../Services/WebsiteService'
import CompanyLogo from '../../../Components/Menu/CompanyLogo'
import MenuItems, {
  defaultSelectedKey,
  MENU_ACCESS_LEVEL_COMPANY_ADMIN,
  MENU_ACCESS_LEVEL_SUPER_ADMIN,
  MENU_KEY_COMPANY_LIST,
  MENU_KEY_COMPANY_USERS,
  MENU_KEY_DASHBOARD,
  MENU_KEY_MEDIA,
  MENU_KEY_WEBSITE,
  MENU_KEY_WEBSITE_PAGES,
  MENU_KEY_WEBSITE_PUBLISH,
  MENU_KEY_WEBSITE_SETTINGS,
  MENU_KEY_WEBSITE_LAYOUT,
  MENU_KEY_WEBSITE_MESSAGES,
  MENU_KEY_WEBSITE_TEMPLATES,
} from '../../../Components/Menu/MenuItems'
import { messages } from '../../../i18n/messages'
import {
  BACK_END_URL,
  COMPANY_LIST_URL,
  COMPANY_USERS_URL,
  COMPANY_WEBSITE_MESSAGES_URL,
  COMPANY_WEBSITE_PAGES_URL,
  COMPANY_WEBSITE_SETTINGS_URL,
  COMPANY_WEBSITE_LAYOUT_URL,
  COMPANY_WEBSITE_TEMPLATES_URL,
  COMPANY_WEBSITE_URL,
} from '../../../UrlMap'

type Item = (typeof MenuItems)[number]
type Entry = { key: string; url?: string; icon?: unknown; adminOnly?: boolean; children?: Entry[] }
const entries = MenuItems.flatMap((section: Item) =>
  'items' in section ? (section.items as Entry[]) : [section as Entry],
)
// The pages a menu entry opens: a submenu's children stand for it (SMN-80).
const links = entries.flatMap((entry: Entry) => entry.children || [entry]) as Item[]
const website = entries.find((entry) => entry.key === MENU_KEY_WEBSITE)
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

  test('every link has a unique key and a url, and every top entry an icon', () => {
    const keys = [...entries.filter((entry) => entry.children), ...links].map((link) => link.key)
    expect(new Set(keys).size).toBe(keys.length)
    links.forEach((link: Item) => expect(link.url).toEqual(expect.stringMatching(/^\//)))
    entries.forEach((entry) => expect(entry.icon).toBeTruthy())
  })

  // SMN-80: the website sits under Components, after Media; pages and page views for every member.
  test('the website is a submenu under Components, after Media, with admin-only items marked', () => {
    expect(sectionOf(MENU_KEY_MEDIA)?.items?.map((item) => item.key)).toEqual(
      expect.arrayContaining([MENU_KEY_MEDIA, MENU_KEY_WEBSITE]),
    )
    expect(sectionOf(MENU_KEY_MEDIA)?.access).toBeUndefined()
    expect(website?.children?.map(({ key, url, adminOnly }) => [key, url, adminOnly === true])).toEqual([
      [MENU_KEY_WEBSITE_PAGES, COMPANY_WEBSITE_PAGES_URL, false],
      [MENU_KEY_WEBSITE_PUBLISH, COMPANY_WEBSITE_URL, true],
      [MENU_KEY_WEBSITE_LAYOUT, COMPANY_WEBSITE_LAYOUT_URL, true],
      [MENU_KEY_WEBSITE_MESSAGES, COMPANY_WEBSITE_MESSAGES_URL, true],
      [MENU_KEY_WEBSITE_TEMPLATES, COMPANY_WEBSITE_TEMPLATES_URL, true],
      [MENU_KEY_WEBSITE_SETTINGS, COMPANY_WEBSITE_SETTINGS_URL, true],
    ])
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
    // The Messages name reads the company (its unread count), so the labels need a store.
    vi.spyOn(WebsiteService, 'getMessages').mockReturnValue(new Promise(() => {}))
    render(
      <Provider store={makeTestStore()}>
        <IntlProvider locale={locale} messages={messages[locale as keyof typeof messages]} onError={onError}>
          {labels}
        </IntlProvider>
      </Provider>,
    )
    expect(onError).not.toHaveBeenCalled()
  })
})
