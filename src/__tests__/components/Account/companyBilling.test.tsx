import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { apiError, stubMatchMedia } from '../Access/domHelpers'
import { renderWithProviders } from '../../testUtils'
import CompanyBilling from '../../../Components/Company/CompanyBilling'
import message from '../../../Components/Form/message'
import CompanyService from '../../../Services/CompanyService'
import MenuItems, { MENU_KEY_COMPANY_ADMIN, MENU_KEY_COMPANY_BILLING } from '../../../Components/Menu/MenuItems'

vi.mock('../../../Services/CompanyService', () => ({
  default: { getItemById: vi.fn(), startCheckout: vi.fn(), openBillingPortal: vi.fn() },
}))
vi.mock('../../../Components/Form/message', () => ({ default: { error: vi.fn(), success: vi.fn() } }))

const renderBilling = (adminConfig: object | null) => {
  const company = { id: 'c-1', adminConfig }
  vi.mocked(CompanyService.getItemById).mockResolvedValue(company as never)
  return renderWithProviders(<CompanyBilling />, { state: { auth: { company } } })
}
const assign = vi.fn()

beforeAll(() => {
  stubMatchMedia()
  Object.defineProperty(window, 'location', { value: { ...window.location, assign }, writable: true })
})
beforeEach(() => vi.clearAllMocks())

test('sits right after the company info in the menu', () => {
  const keys = MenuItems.flatMap((item) => item.items ?? []).map((item) => item.key)
  expect(keys.indexOf(MENU_KEY_COMPANY_BILLING)).toBe(keys.indexOf(MENU_KEY_COMPANY_ADMIN) + 1)
})

test('Free shows its plan as current, and sends a paid choice to Stripe', async () => {
  vi.mocked(CompanyService.startCheckout).mockResolvedValue({ url: 'https://stripe.test/s' })
  renderBilling({ plan: 'free' })
  expect(screen.getByText('Current plan')).toBeInTheDocument()
  const choices = screen.getAllByRole('button', { name: 'Choose this plan' })
  expect(choices).toHaveLength(2)
  fireEvent.click(choices[0])
  await waitFor(() => expect(assign).toHaveBeenCalledWith('https://stripe.test/s'))
  expect(CompanyService.startCheckout).toHaveBeenCalledWith('starter')
})

test('a paying company changes plan on the portal', async () => {
  vi.mocked(CompanyService.openBillingPortal).mockResolvedValue({ url: 'https://stripe.test/p' })
  renderBilling({ plan: 'starter', stripeSubscriptionId: 'sub_1' })
  expect(screen.queryByRole('button', { name: 'Choose this plan' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Change plan or cancel' }))
  await waitFor(() => expect(assign).toHaveBeenCalledWith('https://stripe.test/p'))
})

test('a complimentary plan has nothing to pay', () => {
  renderBilling({ plan: 'unlimited', complimentary: true })
  expect(screen.getByText(/complimentary/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Choose this plan' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Change plan or cancel' })).not.toBeInTheDocument()
})

test('a company with no plan has nothing to choose', () => {
  renderBilling(null)
  expect(screen.getByText(/no plan limits/)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('reports a failed checkout, and lets the person try again', async () => {
  vi.mocked(CompanyService.startCheckout).mockRejectedValue(apiError('down'))
  renderBilling({ plan: 'free' })
  fireEvent.click(screen.getAllByRole('button', { name: 'Choose this plan' })[0])
  await waitFor(() => expect(message.error).toHaveBeenCalledWith('down'))
  expect(screen.getAllByRole('button', { name: 'Choose this plan' })[0]).toBeEnabled()
})
