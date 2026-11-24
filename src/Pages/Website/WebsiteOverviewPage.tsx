import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import moment from 'moment'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_WEBSITE } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Alert from '../../Components/Form/Alert'
import Button from '../../Components/Form/Button'
import Card from '../../Components/Form/Card'
import InputBox from '../../Components/Form/InputBox'
import Space from '../../Components/Form/Space'
import Spin from '../../Components/Form/Spin'
import Tag from '../../Components/Form/Tag'
import message from '../../Components/Form/message'
import { BoxTitleDiv, FormInputWrapper } from '../../Styles/AppWrapper'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import IWebsite, { WEBSITE_SLUG_PATTERN } from '../../Types/Website/IWebsite'

// The Website area's first page (specs/001-website-builder, US1, T019): create the website by choosing its address
// name, or change the name, and see the public address and whether the site is published.
type iState = {
  loading: boolean
  // null: the company has no website yet.
  website?: IWebsite | null
  loadError?: string
  slug: string
  slugError?: string
  saving: boolean
  isStale: boolean
  count: number
}
const initState: iState = { loading: false, slug: '', saving: false, isStale: false, count: 0 }

// Where visitors see the site, on the Reader.
export const getPublicUrl = (slug: string) =>
  `${`${process.env.REACT_APP_FRONT_END_URL || ''}`.trim().replace(/\/$/, '')}/s/${slug}`

const WebsiteOverviewPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const [state, setState] = useState(initState)

  useEffect(() => {
    if (!isOn) return
    // A switch of company while loading must not show the old company's website.
    let isCurrent = true
    setState((s) => ({ ...s, loading: true, loadError: undefined, isStale: false, slugError: undefined }))
    WebsiteService.get()
      .then((website) => isCurrent && setState((s) => ({ ...s, website, slug: website.slug })))
      .catch((err) => {
        if (!isCurrent) return
        setState((s) => ({
          ...s,
          ...(err?.response?.status === 404
            ? { website: null, slug: '' }
            : { website: undefined, loadError: Utils.getErrorMessage(err) }),
        }))
      })
      .finally(() => isCurrent && setState((s) => ({ ...s, loading: false })))
    return () => {
      isCurrent = false
    }
  }, [isOn, company?.id, state.count])

  const reload = () => setState((s) => ({ ...s, count: s.count + 1 }))

  const save = () => {
    const slug = state.slug.trim()
    if (!WEBSITE_SLUG_PATTERN.test(slug)) {
      setState((s) => ({ ...s, slugError: translate('website-slug-invalid') }))
      return
    }
    const { website } = state
    setState((s) => ({ ...s, saving: true, slugError: undefined }))
    const request = website ? WebsiteService.update({ slug, updatedAt: website.updatedAt }) : WebsiteService.create(slug)
    request
      .then((saved) => {
        setState((s) => ({ ...s, website: saved, slug: saved.slug }))
        message.success(translate('website-saved'))
      })
      .catch((err) => {
        const { status, data } = err?.response || {}
        const fieldError = (data?.errors || []).find((error: { path: string }) => error.path === 'slug')?.message
        if (fieldError) {
          setState((s) => ({ ...s, slugError: fieldError }))
        } else if (status === 409 && /taken/i.test(`${data?.message || ''}`)) {
          setState((s) => ({ ...s, slugError: translate('website-slug-taken') }))
        } else if (status === 409) {
          // Another admin saved first: their change is kept, and this one waits for a reload.
          setState((s) => ({ ...s, isStale: true }))
        } else {
          message.error(Utils.getErrorMessage(err))
        }
      })
      .finally(() => setState((s) => ({ ...s, saving: false })))
  }

  const getStatus = (website: IWebsite) => {
    if (!website.publishedAt) {
      return <Tag>{translate('website-not-published')}</Tag>
    }
    const date = moment(website.publishedAt).format('lll')
    return website.hasUnpublishedChanges ? (
      <Tag color={'orange'}>{translate('website-unpublished-changes', { date })}</Tag>
    ) : (
      <Tag color={'green'}>{translate('website-published', { date })}</Tag>
    )
  }

  const getContent = () => {
    if (state.loadError) {
      return (
        <Alert
          type={'error'}
          message={translate('website-load-failed', { message: state.loadError })}
          action={<Button onClick={reload}>{translate('retry')}</Button>}
        />
      )
    }
    if (state.website === undefined) {
      return null
    }
    const { website } = state
    const publicUrl = website ? getPublicUrl(website.slug) : ''
    return (
      <Card>
        <Space orientation={'vertical'} style={{ width: '100%' }} size={'large'}>
          {website ? null : (
            <div>
              <BoxTitleDiv>{translate('website-create-title')}</BoxTitleDiv>
              <div>{translate('website-create-help')}</div>
            </div>
          )}
          {state.isStale ? (
            <Alert
              type={'warning'}
              message={translate('website-stale')}
              action={<Button onClick={reload}>{translate('website-reload')}</Button>}
            />
          ) : null}
          <FormInputWrapper>
            <BoxTitleDiv>
              <label htmlFor={'website-slug'}>{translate('website-slug')}</label>
            </BoxTitleDiv>
            <Space wrap>
              <InputBox
                id={'website-slug'}
                value={state.slug}
                maxLength={40}
                status={state.slugError ? 'error' : undefined}
                aria-invalid={state.slugError ? true : undefined}
                aria-describedby={state.slugError ? 'website-slug-error' : undefined}
                onChange={(e) => setState((s) => ({ ...s, slug: e.target.value, slugError: undefined }))}
                onPressEnter={save}
                disabled={state.saving || state.isStale}
              />
              <Button
                type={'primary'}
                onClick={save}
                loading={state.saving}
                disabled={state.isStale || (!!website && state.slug.trim() === website.slug)}
              >
                {translate(website ? 'website-save' : 'website-create')}
              </Button>
            </Space>
            {state.slugError ? (
              <div id={'website-slug-error'} role={'alert'} className={'ant-form-item-explain-error'}>
                {state.slugError}
              </div>
            ) : null}
          </FormInputWrapper>
          {website ? (
            <>
              <FormInputWrapper>
                <BoxTitleDiv>{translate('website-address')}</BoxTitleDiv>
                {website.publishedAt ? (
                  <a href={publicUrl} target={'_blank'} rel={'noopener noreferrer'}>
                    {publicUrl}
                  </a>
                ) : (
                  <span>{publicUrl}</span>
                )}
              </FormInputWrapper>
              <FormInputWrapper>
                <BoxTitleDiv>{translate('website-status')}</BoxTitleDiv>
                {getStatus(website)}
              </FormInputWrapper>
            </>
          ) : null}
        </Space>
      </Card>
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_WEBSITE}
      ContentHeader={<BackendPageContentTitle title={translate('website')} />}
    >
      {isOn ? <Spin spinning={state.loading}>{getContent()}</Spin> : <InvalidAccessPanel />}
    </BackendPage>
  )
}

export default WebsiteOverviewPage
