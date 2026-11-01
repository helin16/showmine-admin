/* eslint-disable react/display-name -- simple stand-ins for mocked components */
import React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import Donut from '../../../Components/Charts/Donut'
import Line from '../../../Components/Charts/Line'
import message from '../../../Components/Form/message'
import EmptyStats from '../../../Components/Stats/EmptyStats'
import UsageWrapperLink from '../../../Components/Stats/UsageWrapperLink'
import VisitStats from '../../../Components/Stats/VisitStats'
import VisitsByChannelChart from '../../../Components/Stats/VisitsByChannelChart'
import VisitsByChannelLineChart from '../../../Components/Stats/VisitsByChannelLineChart'
import VisitsBySharerChart from '../../../Components/Stats/VisitsBySharerChart'
import { OP_GTE } from '../../../Helpers/ServiceHelper'
import ItemVisitService from '../../../Services/ItemVisitService'
import IItemVisit from '../../../Types/Article/IItemVisit'
import { renderWithProviders } from '../../testUtils'
import { FIXED_DATE, deferred, httpError, listOf, makeArticle } from '../Article/fixtures'

vi.mock('../../../Services/ItemVisitService')
vi.mock('../../../Components/Form/message', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('@ant-design/charts', () => {
  const stub =
    (name: string) =>
    ({ data, ...props }: { data: unknown }) => (
      <pre data-testid={name} data-props={JSON.stringify(props)}>
        {JSON.stringify(data)}
      </pre>
    )
  return { Pie: stub('pie'), Line: stub('line') }
})

const service = vi.mocked(ItemVisitService)
const visit = (overrides: object) => ({ createdAt: FIXED_DATE, ...overrides }) as unknown as IItemVisit
const chartData = (id: string) => JSON.parse(screen.getByTestId(id).textContent as string)
const chartProps = (id: string) => JSON.parse(screen.getByTestId(id).getAttribute('data-props') as string)

describe('chart wrappers', () => {
  const config = { data: [], angleField: 'value', colorField: 'type' }

  test('Donut derives the inner radius from the radius', () => {
    renderWithProviders(<Donut {...config} radius={0.8} className="mine" />)
    expect(chartProps('pie')).toMatchObject({ radius: 0.8, innerRadius: 0.6 })
    expect(chartProps('pie').className).toBe('app-chart-donut mine')
  })

  test('Donut keeps an explicit inner radius', () => {
    renderWithProviders(<Donut {...config} radius={0.8} innerRadius={0.5} />)
    expect(chartProps('pie').innerRadius).toBe(0.5)
  })

  test('Line adds its class name', () => {
    renderWithProviders(<Line data={[]} xField="x" yField="y" className="mine" />)
    expect(chartProps('line').className).toBe('app-chart-Line mine')
  })
})

describe('EmptyStats', () => {
  test('shows the title and the empty picture', () => {
    const { container } = renderWithProviders(<EmptyStats title="Visits" />)
    expect(screen.getByText('Visits')).toBeInTheDocument()
    expect(container.querySelector('.ant-empty')).toBeInTheDocument()
  })
})

describe('UsageWrapperLink', () => {
  test('renders nothing without children', () => {
    const { container } = renderWithProviders(<UsageWrapperLink url="/x" />)
    expect(container).toBeEmptyDOMElement()
  })

  test('renders the children without a link when there is no url', () => {
    renderWithProviders(<UsageWrapperLink>figure</UsageWrapperLink>)
    expect(screen.getByText('figure')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  test.each([
    [-1, 'Your Plan: Unlimited'],
    [50, 'Your Plan: 50'],
  ])('links the children and explains the plan %s on hover', async (planValue, expected) => {
    renderWithProviders(
      <UsageWrapperLink url="/b/media" currentValue={3} planValue={planValue}>
        figure
      </UsageWrapperLink>,
    )
    const link = screen.getByRole('link', { name: 'figure' })
    expect(link).toHaveAttribute('href', '/b/media')
    fireEvent.mouseEnter(link)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Current Usage: 3')
    expect(screen.getByRole('tooltip')).toHaveTextContent(expected)
  })
})

describe('VisitsByChannelChart', () => {
  test('shows the empty state with the title', () => {
    renderWithProviders(<VisitsByChannelChart title="Channels" itemVisits={[]} />)
    expect(screen.getByText('Channels')).toBeInTheDocument()
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument()
  })

  test('handles a missing title', () => {
    const { container } = renderWithProviders(<VisitsByChannelChart itemVisits={[]} />)
    expect(container.querySelector('.ant-empty')).toBeInTheDocument()
  })

  test('counts visits per channel, ignoring case and spaces', () => {
    const visits = [{ source: ' web ' }, { source: 'WEB' }, { source: 'app' }].map(visit)
    renderWithProviders(<VisitsByChannelChart title="Channels" itemVisits={visits} />)
    expect(chartData('pie')).toEqual([
      { type: 'WEB', value: 2 },
      { type: 'APP', value: 1 },
    ])
  })

  test('groups visits with no source together', () => {
    renderWithProviders(<VisitsByChannelChart itemVisits={[visit({ source: null }), visit({ source: '' })]} />)
    expect(chartData('pie')).toEqual([{ type: '', value: 2 }])
  })

  test('translates WeChat channel names', () => {
    renderWithProviders(<VisitsByChannelChart itemVisits={[visit({ source: 'timeline' })]} />)
    expect(chartData('pie')).toEqual([{ type: 'WeChat Moments', value: 1 }])
  })
})

describe('VisitsByChannelLineChart', () => {
  test('shows the empty state with the title', () => {
    renderWithProviders(<VisitsByChannelLineChart title="Trend" itemVisits={[]} itemsOverDays={7} />)
    expect(screen.getByText('Trend')).toBeInTheDocument()
    expect(screen.queryByTestId('line')).not.toBeInTheDocument()
  })

  test('handles a missing title', () => {
    const { container } = renderWithProviders(<VisitsByChannelLineChart itemVisits={[]} itemsOverDays={7} />)
    expect(container.querySelector('.ant-empty')).toBeInTheDocument()
  })

  test('counts visits per channel per day', () => {
    const nextDay = new Date(2024, 2, 16, 9, 30)
    const visits = [
      visit({ source: 'web' }),
      visit({ source: ' WEB ' }),
      visit({ source: 'web', createdAt: nextDay }),
      visit({ source: 'app' }),
      visit({ source: null }),
    ]
    renderWithProviders(<VisitsByChannelLineChart itemVisits={visits} itemsOverDays={7} />)
    expect(chartData('line')).toEqual([
      { date: 'Mar 15, 2024', total: 2, type: 'WEB' },
      { date: 'Mar 16, 2024', total: 1, type: 'WEB' },
      { date: 'Mar 15, 2024', total: 1, type: 'APP' },
      { date: 'Mar 15, 2024', total: 1, type: '' },
    ])
  })

  test('groups by hour for a one-day range', () => {
    renderWithProviders(<VisitsByChannelLineChart itemVisits={[visit({ source: 'web' })]} itemsOverDays={1} />)
    expect(chartData('line')).toEqual([{ date: '9', total: 1, type: 'WEB' }])
  })

  // Bug: the 'h' format drops AM/PM, so 9 AM and 9 PM in a one-day range land in the same bucket.
  test.fails('keeps morning and evening apart in a one-day range', () => {
    const evening = new Date(2024, 2, 15, 21, 30)
    const visits = [visit({ source: 'web' }), visit({ source: 'web', createdAt: evening })]
    renderWithProviders(<VisitsByChannelLineChart itemVisits={visits} itemsOverDays={1} />)
    expect(chartData('line')).toHaveLength(2)
  })
})

describe('VisitsBySharerChart', () => {
  test('shows the empty state with the title', () => {
    renderWithProviders(<VisitsBySharerChart title="Sharers" itemVisits={[]} />)
    expect(screen.getByText('Sharers')).toBeInTheDocument()
  })

  test('handles a missing title', () => {
    const { container } = renderWithProviders(<VisitsBySharerChart itemVisits={[]} />)
    expect(container.querySelector('.ant-empty')).toBeInTheDocument()
  })

  test('counts visits per sharer and labels the rest Unknown', () => {
    const visits = [
      visit({ SharedBy: { nickName: 'Ann' } }),
      visit({ SharedBy: { nickName: 'Ann' } }),
      visit({}),
    ]
    renderWithProviders(<VisitsBySharerChart itemVisits={visits} />)
    expect(chartData('pie')).toEqual([
      { type: 'Ann', value: 2 },
      { type: 'Unknown', value: 1 },
    ])
  })
})

describe('VisitStats', () => {
  const FROZEN = new Date(2024, 2, 15, 12, 0)
  const lastQuery = () => JSON.parse(service.getAll.mock.lastCall?.[0]?.where as string)

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(FROZEN)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('asks for the last ten days of active company visits', async () => {
    service.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<VisitStats />)

    expect(await screen.findByText('Mar 5, 2024')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Latest 10 day/ })).toBeInTheDocument()
    expect(lastQuery()).toEqual({ createdAt: { [OP_GTE]: new Date(2024, 2, 5, 12, 0).toISOString() }, isActive: true })
    expect(service.getAll.mock.lastCall?.[0]?.include).toBe('SharedBy')
  })

  test('limits the visits to one article when given', async () => {
    service.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<VisitStats article={makeArticle()} />)
    await waitFor(() => expect(service.getAll).toHaveBeenCalled())
    expect(lastQuery().itemId).toBe('art-1')
  })

  test('shows the three charts once visits arrive', async () => {
    service.getAll.mockResolvedValue(listOf([visit({ source: 'web', SharedBy: { nickName: 'Ann' } })]))
    renderWithProviders(<VisitStats />)
    expect(await screen.findByTestId('line')).toBeInTheDocument()
    expect(chartData('line')).toEqual([{ date: 'Mar 15, 2024', total: 1, type: 'WEB' }])
    expect(screen.getAllByTestId('pie')).toHaveLength(2)
  })

  test('shows empty panels when there are no visits', async () => {
    service.getAll.mockResolvedValue(listOf([]))
    const { container } = renderWithProviders(<VisitStats />)
    await waitFor(() => expect(container.querySelectorAll('.ant-empty').length).toBe(3))
    expect(screen.queryByTestId('pie')).not.toBeInTheDocument()
  })

  test('spins while loading', async () => {
    const request = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(request.promise as never)
    const { container } = renderWithProviders(<VisitStats />)
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument())
    request.resolve(listOf([]))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('reports a failed load', async () => {
    service.getAll.mockRejectedValue(httpError('denied'))
    const { container } = renderWithProviders(<VisitStats />)
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('denied'))
    await waitFor(() => expect(container.querySelector('.ant-spin-spinning')).not.toBeInTheDocument())
  })

  test('ignores a reply and a failure that arrive after unmount', async () => {
    const first = deferred<ReturnType<typeof listOf>>()
    service.getAll.mockReturnValue(first.promise as never)
    renderWithProviders(<VisitStats />).unmount()
    first.resolve(listOf([visit({ source: 'web' })]))
    await first.promise

    const second = deferred<never>()
    service.getAll.mockReturnValue(second.promise)
    renderWithProviders(<VisitStats />).unmount()
    second.reject(httpError('late'))
    await second.promise.catch(() => undefined)
    expect(message.error).not.toHaveBeenCalled()
  })

  test.each([
    ['Latest 1 day', 1, new Date(2024, 2, 14, 12, 0), 'Mar 14, 2024'],
    ['Latest 7 day', 7, new Date(2024, 2, 8, 12, 0), 'Mar 8, 2024'],
    ['Latest 1 month', 30, new Date(2024, 1, 14, 12, 0), 'Feb 14, 2024'],
    ['Latest 1 year', 365, new Date(2023, 2, 16, 12, 0), 'Mar 16, 2023'],
  ])('switches the range to %s', async (label, _, since, heading) => {
    service.getAll.mockResolvedValue(listOf([]))
    renderWithProviders(<VisitStats />)
    fireEvent.mouseEnter(await screen.findByRole('button', { name: /Latest 10 day/ }))
    fireEvent.click(await screen.findByRole('menuitem', { name: label }))

    expect(await screen.findByText(heading)).toBeInTheDocument()
    await waitFor(() => expect(lastQuery().createdAt[OP_GTE]).toBe(since.toISOString()))
    expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument()
  })
})
