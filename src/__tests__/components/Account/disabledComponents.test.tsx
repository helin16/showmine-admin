/* eslint-disable camelcase -- these are field names in API responses */
import React from 'react'
import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { renderWithProviders } from '../../testUtils'
import RetrievePasswordForm from '../../../Components/Auth/RetrievePasswordForm'
import CompanyBasicInfoEditor from '../../../Components/Company/CompanyBasicInfoEditor'
import CompanyList from '../../../Components/Company/CompanyList'
import CompanyUserInviteBtn from '../../../Components/User/CompanyUserInviteBtn'
import ChannelEditor from '../../../Components/Channel/ChannelEditor'
import ChannelList from '../../../Components/Channel/ChannelList'
import RedirectChannelEditor from '../../../Components/Channel/Wizard/RedirectChannelEditor'
import ShowMineChannelEditor from '../../../Components/Channel/Wizard/ShowMineChannelEditor'
import WordPressChannelEditor from '../../../Components/Channel/Wizard/WordPressChannelEditor'
import CardForm from '../../../Components/Package/CardForm'
import PackageCard from '../../../Components/Package/PackageCard'
import PackageNoticeBoard from '../../../Components/Package/PackageNoticeBoard'
import PlanPackageSwitcher from '../../../Components/Package/PlanPackageSwitcher'
import PlanSubscribe from '../../../Components/Package/PlanSubscribe'
import InvoiceColumns from '../../../Components/Package/InvoiceColumns'
import useResponsiveFontSize from '../../../Components/Package/useResponsiveFontSize'
import UpgradeBtn from '../../../Components/Billing/UpgradeBtn'
import CompanyNewChannelPage from '../../../Pages/Channel/CompanyNewChannelPage'

vi.mock('@stripe/stripe-js', () => ({ loadStripe: () => null }))
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: () => <div />,
  CardElement: () => <div />,
  useStripe: () => null,
  useElements: () => null,
}))

const channel = { type: 'Facebook', name: 'Page' } as never
const company = { id: 'co-1', name: 'Acme' } as never

// These features are commented out in the source: pin that they stay out of the UI until they are restored.
test.each([
  ['RetrievePasswordForm', <RetrievePasswordForm key='0' />],
  ['CompanyBasicInfoEditor', <CompanyBasicInfoEditor key='0' company={company} />],
  ['CompanyList', <CompanyList key='0' />],
  ['CompanyUserInviteBtn', <CompanyUserInviteBtn key='0' company={company} />],
  ['ChannelEditor', <ChannelEditor key='0' channel={channel} />],
  ['ChannelList', <ChannelList key='0' />],
  ['RedirectChannelEditor', <RedirectChannelEditor key='0' channel={channel} />],
  ['ShowMineChannelEditor', <ShowMineChannelEditor key='0' channel={channel} />],
  ['CardForm', <CardForm key='0' />],
  ['PackageCard', <PackageCard key='0' />],
  ['PackageNoticeBoard', <PackageNoticeBoard key='0' />],
  ['PlanPackageSwitcher', <PlanPackageSwitcher key='0' />],
  ['PlanSubscribe', <PlanSubscribe key='0' />],
  ['UpgradeBtn', <UpgradeBtn key='0' />],
  ['CompanyNewChannelPage', <CompanyNewChannelPage key='0' />],
])('%s is disabled and renders nothing', (_name, ui) => {
  expect(renderWithProviders(ui).container).toBeEmptyDOMElement()
})

test('WordPressChannelEditor renders an empty placeholder', () => {
  const { container } = renderWithProviders(<WordPressChannelEditor channel={channel} />)
  expect(container.innerHTML).toBe('<div></div>')
})

describe('InvoiceColumns', () => {
  const column = (key: string) => InvoiceColumns.find((c) => c.key === key)
  const record = { currency: 'aud', total: 1999, amount_paid: 500 }

  test('lists the invoice fields in order', () => {
    expect(InvoiceColumns.map((c) => c.title)).toEqual(['Invoice', 'Total Amount', 'Paid Amount', 'Email', 'Date'])
  })

  test('formats amounts from cents with an upper-case currency', () => {
    expect(column('total')?.render?.(record)).toBe('AUD 19.99')
    expect(column('amount_paid')?.render?.(record)).toBe('AUD 5')
  })

  test('formats the date from a unix timestamp and drops the time part', () => {
    const toLocaleString = vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function (this: Date) {
      return `${this.getTime()}, 10:00:00`
    })
    expect(column('created')?.render?.(1700000000)).toBe('1700000000000')
    expect(toLocaleString).toHaveBeenCalledOnce()
  })
})

describe('useResponsiveFontSize', () => {
  const resizeTo = (width: number) => {
    window.innerWidth = width
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }

  test('follows the window width', () => {
    window.innerWidth = 400
    const { result } = renderHook(() => useResponsiveFontSize())
    expect(result.current).toBe('16px')
    resizeTo(1024)
    expect(result.current).toBe('18px')
    resizeTo(449)
    expect(result.current).toBe('16px')
  })

  test('stops listening after unmounting', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    renderHook(() => useResponsiveFontSize()).unmount()
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})
