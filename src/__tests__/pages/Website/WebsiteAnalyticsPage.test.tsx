import React from 'react'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import WebsiteAnalyticsPage from '../../../Pages/Website/WebsiteAnalyticsPage'
import WebsiteService from '../../../Services/WebsiteService'
import { changeCompany } from '../../../Redux/reduxers/auth.slice'
import { renderWithProviders } from '../../testUtils'
import { stubMatchMedia } from '../../components/Access/domHelpers'

// The website analytics page (specs/001-website-builder, US7, T070).
vi.mock('../../../Services/WebsiteService', () => ({ default: { getPageViews: vi.fn() } }))
vi.mock('@ant-design/charts', () => ({
  Line: ({ data }: { data: unknown }) => <pre data-testid={'line'}>{JSON.stringify(data)}</pre>,
}))
vi.mock('../../../Layouts/BackendPage', () => ({
  default: ({ children, ContentHeader }: { children: React.ReactNode; ContentHeader?: React.ReactNode }) => (
    <main>
      <header>{ContentHeader}</header>
      {children}
    </main>
  ),
}))

beforeAll(() => stubMatchMedia())
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-25T08:00:00Z'))
})
afterEach(() => vi.useRealTimers())

const company = { id: 'co-1', name: 'Acme', websiteBuilderEnabled: true }
const views = (from: string, to: string, days: object[] = [], updatedAt: string | null = null) => ({
  from,
  to,
  updatedAt,
  days,
})
const renderPage = (auth: object = { company, user: { id: 'u-1' } }) =>
  renderWithProviders(<WebsiteAnalyticsPage />, { state: { auth } })
const chart = () => JSON.parse(screen.getByTestId('line').textContent || '[]')
const choose = async (label: string) => {
  fireEvent.mouseDown(screen.getByLabelText('Period'))
  fireEvent.click(await screen.findByTitle(label))
}
const setDate = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('WebsiteAnalyticsPage', () => {
  test('with the builder off, shows the not-allowed panel and asks the API nothing', () => {
    renderPage({ company: { ...company, websiteBuilderEnabled: false } })
    expect(screen.getByText('Sorry, you are not authorized to access this page.')).toBeInTheDocument()
    expect(WebsiteService.getPageViews).not.toHaveBeenCalled()
  })

  test('shows the last 7 UTC days per page, with zeros on days without views, totals and the update time', async () => {
    const updatedAt = '2026-11-24T10:00:00.000Z'
    vi.mocked(WebsiteService.getPageViews).mockResolvedValue(
      views(
        '2026-11-19',
        '2026-11-25',
        [
          { date: '2026-11-19', pageSlug: 'home', count: 3 },
          { date: '2026-11-24', pageSlug: 'about', count: 1 },
          { date: '2026-11-24', pageSlug: 'home', count: 2 },
        ],
        updatedAt,
      ) as never,
    )
    renderPage()

    expect(await screen.findByText('2026-11-19 to 2026-11-25')).toBeInTheDocument()
    expect(WebsiteService.getPageViews).toHaveBeenCalledWith('2026-11-19', '2026-11-25')
    expect(await screen.findByText(`Last updated: ${new Date(updatedAt).toLocaleString()}`)).toBeInTheDocument()
    const data = chart()
    expect(data).toHaveLength(14)
    expect(
      data.filter((point: { page: string }) => point.page === 'home').map((p: { views: number }) => p.views),
    ).toEqual([3, 0, 0, 0, 0, 2, 0])
    expect(data[0]).toEqual({ date: '2026-11-19', page: 'about', views: 0 })
    expect(screen.getByRole('img', { name: 'Page views per day, by page' })).toBeInTheDocument()
    const rows = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent)
    expect(rows).toEqual(['home5', 'about1'])
  })

  test('a period with no views says so', async () => {
    vi.mocked(WebsiteService.getPageViews).mockResolvedValue(views('2026-11-19', '2026-11-25') as never)
    renderPage()
    expect(await screen.findByText('No page views in this period.')).toBeInTheDocument()
    expect(screen.queryByTestId('line')).toBeNull()
    expect(screen.queryByText(/Last updated/)).toBeNull()
  })

  test.each([
    ['Last 30 days', '2026-10-27'],
    ['Last 90 days', '2026-08-28'],
  ])('%s asks for that period', async (label, from) => {
    vi.mocked(WebsiteService.getPageViews).mockResolvedValue(views('x', 'y') as never)
    renderPage()
    await choose(label)
    expect(WebsiteService.getPageViews).toHaveBeenLastCalledWith(from, '2026-11-25')
    expect(await screen.findByText(`${from} to 2026-11-25`)).toBeInTheDocument()
  })

  test('chosen dates of up to 366 days are asked for; longer, reversed or empty ones are not', async () => {
    vi.mocked(WebsiteService.getPageViews).mockResolvedValue(views('x', 'y') as never)
    renderPage()
    await choose('Choose dates')
    setDate('From', '2025-11-25')
    expect(WebsiteService.getPageViews).toHaveBeenLastCalledWith('2025-11-25', '2026-11-25')
    const calls = vi.mocked(WebsiteService.getPageViews).mock.calls.length

    for (const [from, to] of [
      ['2025-11-24', '2026-11-25'],
      ['2026-11-25', '2026-11-24'],
      ['', '2026-11-24'],
    ]) {
      // The start is emptied first, so no valid period shows in between.
      setDate('From', '')
      setDate('To', to)
      setDate('From', from)
      expect(screen.getByRole('alert')).toHaveTextContent('Pick a start and an end, at most 366 days apart.')
      expect(screen.getByLabelText('From')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.queryByText('No page views in this period.')).toBeNull()
    }
    expect(WebsiteService.getPageViews).toHaveBeenCalledTimes(calls)

    setDate('From', '2026-11-24')
    setDate('To', '2026-11-24')
    expect(WebsiteService.getPageViews).toHaveBeenLastCalledWith('2026-11-24', '2026-11-24')
  })

  test('a load cut short by an invalid period leaves no spinner and nothing old on show', async () => {
    vi.mocked(WebsiteService.getPageViews).mockResolvedValueOnce(
      views('2026-11-19', '2026-11-25', [], '2026-11-24T10:00:00.000Z') as never,
    )
    vi.mocked(WebsiteService.getPageViews).mockReturnValueOnce(new Promise(() => undefined) as never)
    const { container } = renderPage()
    expect(await screen.findByText(/Last updated/)).toBeInTheDocument()
    await choose('Choose dates')
    setDate('From', '2026-11-20')
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeNull())
    setDate('From', '')
    expect(container.querySelector('.ant-spin-spinning')).toBeNull()
    expect(screen.queryByText(/Last updated/)).toBeNull()
    expect(screen.getByLabelText('From')).not.toBeDisabled()
  })

  test('trying again moves a preset period on to today', async () => {
    vi.mocked(WebsiteService.getPageViews).mockRejectedValueOnce(new Error('offline'))
    vi.mocked(WebsiteService.getPageViews).mockResolvedValueOnce(views('x', 'y') as never)
    renderPage()
    await screen.findByText('Try again')
    vi.setSystemTime(new Date('2026-11-26T00:30:00Z'))
    fireEvent.click(screen.getByText('Try again'))
    expect(WebsiteService.getPageViews).toHaveBeenLastCalledWith('2026-11-20', '2026-11-26')
    expect(await screen.findByText('2026-11-20 to 2026-11-26')).toBeInTheDocument()
  })

  test('a failed load says why and can be tried again', async () => {
    vi.mocked(WebsiteService.getPageViews).mockRejectedValueOnce(
      Object.assign(new Error('x'), {
        response: { status: 404, data: { message: 'This company has no website yet.' } },
      }),
    )
    vi.mocked(WebsiteService.getPageViews).mockResolvedValueOnce(views('2026-11-19', '2026-11-25') as never)
    renderPage()
    expect(
      await screen.findByText('The page views could not be loaded: This company has no website yet.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByText('Try again'))
    expect(await screen.findByText('No page views in this period.')).toBeInTheDocument()
  })

  test('an answer for the company before a switch is dropped, and the new company is asked', async () => {
    let finish: (value: unknown) => void = () => undefined
    vi.mocked(WebsiteService.getPageViews).mockReturnValueOnce(new Promise((resolve) => (finish = resolve)) as never)
    vi.mocked(WebsiteService.getPageViews).mockReturnValueOnce(new Promise(() => undefined) as never)
    const { store } = renderPage()
    act(() => {
      store.dispatch(changeCompany({ company: { id: 'co-2', name: 'Other', websiteBuilderEnabled: true } }))
    })
    expect(WebsiteService.getPageViews).toHaveBeenCalledTimes(2)
    await act(async () => finish(views('2026-11-19', '2026-11-25')))
    expect(screen.queryByText('No page views in this period.')).toBeNull()
    // Still waiting for the new company's answer.
    await waitFor(() => expect(document.querySelector('.ant-spin-spinning')).not.toBeNull())
  })
})
