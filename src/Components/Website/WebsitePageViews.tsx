import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Input, Select } from 'antd'
import { RootState } from '../../Redux/makeReduxStore'
import Line from '../Charts/Line'
import Alert from '../Form/Alert'
import Button from '../Form/Button'
import Card from '../Form/Card'
import Empty from '../Form/Empty'
import Space from '../Form/Space'
import Spin from '../Form/Spin'
import Table from '../Form/Table'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import { IWebsitePageViews } from '../../Types/Website/IWebsite'

// Page views of the published website (specs/001-website-builder, US7, T074), on the dashboard since SMN-82. Days are
// UTC days, as the API counts them; days with no views are shown as zeros. Nothing for a company without a website.
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_DAYS = 366
const PRESETS = ['7', '30', '90']
const CUSTOM = 'custom'

const toDay = (time: number) => new Date(time).toISOString().slice(0, 10)
const toTime = (day: string) => Date.parse(`${day}T00:00:00Z`)
const lastDays = (count: number) => ({ from: toDay(Date.now() - (count - 1) * DAY_MS), to: toDay(Date.now()) })
// Every day from the start to the end, or none when the period is not one the API takes. An empty date (NaN) or an
// end before the start gives a length Array.from treats as 0.
const getDays = (from: string, to: string) => {
  const start = toTime(from)
  const length = (toTime(to) - start) / DAY_MS + 1
  return length > MAX_DAYS ? [] : Array.from({ length }, (_, index) => toDay(start + index * DAY_MS))
}

type iState = {
  preset: string
  from: string
  to: string
  loading: boolean
  views?: IWebsitePageViews
  loadError?: string
  count: number
}

const WebsitePageViews = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const [state, setState] = useState<iState>({ preset: '7', ...lastDays(7), loading: false, count: 0 })
  const days = getDays(state.from, state.to)
  const isValid = days.length > 0

  useEffect(() => {
    // A load cut short by a change of period or company never finishes, so nothing old may stay on show.
    if (!isOn || !isValid) {
      setState((s) => ({ ...s, loading: false, loadError: undefined, views: undefined }))
      return
    }
    let isCurrent = true
    setState((s) => ({ ...s, loading: true, loadError: undefined, views: undefined }))
    WebsiteService.getPageViews(state.from, state.to)
      .then((views) => isCurrent && setState((s) => ({ ...s, views })))
      .catch((err) => isCurrent && setState((s) => ({ ...s, loadError: Utils.getErrorMessage(err) })))
      .finally(() => isCurrent && setState((s) => ({ ...s, loading: false })))
    return () => {
      isCurrent = false
    }
  }, [isOn, isValid, company?.id, state.from, state.to, state.count])

  // Trying again also moves a preset period on to today, for a page left open past midnight (UTC).
  const retry = () =>
    setState((s) => ({ ...s, count: s.count + 1, ...(s.preset === CUSTOM ? {} : lastDays(Number(s.preset))) }))
  const choosePreset = (preset: string) =>
    setState((s) => ({ ...s, preset, ...(preset === CUSTOM ? {} : lastDays(Number(preset))) }))

  const getViews = () => {
    const { views } = state
    if (!views) return null
    if (views.days.length === 0) {
      return <Empty description={translate('website-analytics-empty')} />
    }
    const pageSlugs = Array.from(new Set(views.days.map((day) => day.pageSlug))).sort()
    const counts = new Map(views.days.map((day) => [`${day.date} ${day.pageSlug}`, day.count]))
    const chartData = pageSlugs.flatMap((pageSlug) =>
      days.map((date) => ({ date, page: pageSlug, views: counts.get(`${date} ${pageSlug}`) || 0 })),
    )
    const totals = pageSlugs
      .map((pageSlug) => ({
        pageSlug,
        views: views.days.filter((day) => day.pageSlug === pageSlug).reduce((sum, day) => sum + day.count, 0),
      }))
      .sort((a, b) => b.views - a.views || a.pageSlug.localeCompare(b.pageSlug))
    return (
      <>
        <div role={'img'} aria-label={translate('website-analytics-chart')}>
          <Line data={chartData} xField={'date'} yField={'views'} colorField={'page'} />
        </div>
        <Table
          rowKey={'pageSlug'}
          pagination={false}
          dataSource={totals}
          columns={[
            { title: translate('website-analytics-page'), dataIndex: 'pageSlug' },
            { title: translate('website-analytics-views'), dataIndex: 'views', align: 'right' },
          ]}
        />
      </>
    )
  }

  const getContent = () => (
    <Space orientation={'vertical'} style={{ width: '100%' }}>
      <Card>
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          <div>{translate('website-analytics-help')}</div>
          <Space wrap>
            <label htmlFor={'website-analytics-period'}>{translate('website-analytics-period')}</label>
            <Select
              id={'website-analytics-period'}
              value={state.preset}
              style={{ minWidth: 160 }}
              onChange={choosePreset}
              options={[...PRESETS, CUSTOM].map((preset) => ({
                value: preset,
                label: translate(`website-analytics-preset-${preset}`),
              }))}
            />
            {state.preset === CUSTOM
              ? (['from', 'to'] as const).map((field) => (
                  <span key={field}>
                    <label htmlFor={`website-analytics-${field}`}>{translate(`website-analytics-${field}`)}</label>{' '}
                    <Input
                      id={`website-analytics-${field}`}
                      type={'date'}
                      value={state[field]}
                      style={{ width: 'auto' }}
                      aria-invalid={isValid ? undefined : true}
                      aria-describedby={isValid ? undefined : 'website-analytics-range-error'}
                      onChange={(e) => {
                        const value = e.target.value
                        setState((s) => ({ ...s, [field]: value }))
                      }}
                    />
                  </span>
                ))
              : null}
          </Space>
          {isValid ? (
            <div>{translate('website-analytics-showing', { from: state.from, to: state.to })}</div>
          ) : (
            <div id={'website-analytics-range-error'} role={'alert'} className={'ant-form-item-explain-error'}>
              {translate('website-analytics-range-bad')}
            </div>
          )}
          {state.views?.updatedAt ? (
            <div>
              {translate('website-analytics-updated', { time: new Date(state.views.updatedAt).toLocaleString() })}
            </div>
          ) : null}
        </Space>
      </Card>
      {isValid && state.loadError ? (
        <Alert
          type={'error'}
          message={translate('website-analytics-load-failed', { message: state.loadError })}
          action={<Button onClick={retry}>{translate('retry')}</Button>}
        />
      ) : null}
      {isValid ? <Card>{getViews()}</Card> : null}
    </Space>
  )

  return isOn ? <Spin spinning={state.loading}>{getContent()}</Spin> : null
}

export default WebsitePageViews
