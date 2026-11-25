import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_WEBSITE_PUBLISH } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Alert from '../../Components/Form/Alert'
import Button from '../../Components/Form/Button'
import Card from '../../Components/Form/Card'
import InputBox from '../../Components/Form/InputBox'
import Space from '../../Components/Form/Space'
import Spin from '../../Components/Form/Spin'
import message from '../../Components/Form/message'
import { BoxTitleDiv, FormInputWrapper } from '../../Styles/AppWrapper'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import IWebsite, { WEBSITE_NAME_MAX } from '../../Types/Website/IWebsite'
import {
  COMPANY_WEBSITE_PAGES_URL,
  COMPANY_WEBSITE_SETTINGS_URL,
  COMPANY_WEBSITE_ANALYTICS_URL,
  COMPANY_WEBSITE_TEMPLATES_URL,
} from '../../UrlMap'
import PublishBar from '../../Components/Website/PublishBar'

// The Website area's first page (specs/001-website-builder, US1, T019): name the website, or change its name, and see
// its addresses and whether it is published. The addresses are made from the name (SMN-81).
type iState = {
  loading: boolean
  // null: the company has no website yet.
  website?: IWebsite | null
  loadError?: string
  name: string
  nameError?: string
  saving: boolean
  isStale: boolean
  count: number
}
const initState: iState = { loading: false, name: '', saving: false, isStale: false, count: 0 }

// Where visitors see the site, on the Reader. Null when the Reader's address is not configured, rather than a wrong
// link on the admin's own address.
export const getPublicUrl = (slug: string) => WebsiteService.getReaderUrl(`/s/${slug}`)

// The API's own words for a name another website has.
const NAME_TAKEN = 'That name is taken.'

const WebsiteOverviewPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const [state, setState] = useState(initState)
  // The company the page shows; answers that arrive after a switch of company are for the old one and are dropped.
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id

  useEffect(() => {
    if (!isOn) return
    let isCurrent = true
    setState((s) => ({
      ...s,
      loading: true,
      website: undefined,
      name: '',
      loadError: undefined,
      isStale: false,
      nameError: undefined,
    }))
    WebsiteService.get()
      .then((website) => isCurrent && setState((s) => ({ ...s, website, name: website.name || '' })))
      .catch((err) => {
        if (!isCurrent) return
        setState((s) => ({
          ...s,
          ...(err?.response?.status === 404
            ? // No website yet: offered under the company name.
              { website: null, name: `${company?.name || ''}`.slice(0, WEBSITE_NAME_MAX) }
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
    const name = state.name.trim()
    if (name === '' || name.length > WEBSITE_NAME_MAX) {
      setState((s) => ({ ...s, nameError: translate('website-name-bad') }))
      return
    }
    const { website } = state
    const companyId = company?.id
    const isSameCompany = () => companyIdRef.current === companyId
    setState((s) => ({ ...s, saving: true, nameError: undefined }))
    const request = website
      ? WebsiteService.update({ name, updatedAt: website.updatedAt })
      : WebsiteService.create(name)
    request
      .then((saved) => {
        if (!isSameCompany()) return
        setState((s) => ({ ...s, website: saved, name: saved.name || '' }))
        message.success(translate('website-saved'))
      })
      .catch((err) => {
        if (!isSameCompany()) return
        const { status, data } = err?.response || {}
        const fieldError = (data?.errors || []).find((error: { path: string }) => error.path === 'name')?.message
        if (fieldError) {
          setState((s) => ({ ...s, nameError: fieldError }))
        } else if (status === 409 && data?.message === NAME_TAKEN) {
          setState((s) => ({ ...s, nameError: translate('website-name-taken') }))
        } else if (status === 409) {
          // Another admin saved or created first: their change is kept, and this one waits for a reload.
          setState((s) => ({ ...s, isStale: true }))
        } else {
          message.error(Utils.getErrorMessage(err))
        }
      })
      .finally(() => setState((s) => ({ ...s, saving: false })))
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
    // The API's Reader address first (SMN-81), as it is what the Reader is configured with; this app's own setting
    // otherwise.
    const publicUrl = website ? website.addresses?.reader || getPublicUrl(website.slug) : null
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
              <label htmlFor={'website-name'}>{translate('website-name')}</label>
            </BoxTitleDiv>
            <Space wrap>
              <InputBox
                id={'website-name'}
                value={state.name}
                maxLength={WEBSITE_NAME_MAX}
                status={state.nameError ? 'error' : undefined}
                aria-invalid={state.nameError ? true : undefined}
                aria-describedby={state.nameError ? 'website-name-help website-name-error' : 'website-name-help'}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value, nameError: undefined }))}
                onPressEnter={save}
                disabled={state.saving || state.isStale}
              />
              <Button
                type={'primary'}
                onClick={save}
                loading={state.saving}
                disabled={state.isStale || (!!website && state.name.trim() === (website.name || ''))}
              >
                {translate(website ? 'website-save' : 'website-create')}
              </Button>
            </Space>
            <div id={'website-name-help'}>{translate('website-name-help')}</div>
            {state.nameError ? (
              <div id={'website-name-error'} role={'alert'} className={'ant-form-item-explain-error'}>
                {state.nameError}
              </div>
            ) : null}
          </FormInputWrapper>
          {website ? (
            <>
              {/* The ShowMine subdomain is the address; it opens once ShowMine serves it (SMN-79). */}
              {website.addresses?.subdomain ? (
                <FormInputWrapper>
                  <BoxTitleDiv>{translate('website-address-subdomain')}</BoxTitleDiv>
                  <span>
                    {website.addresses.subdomain} {translate('website-address-not-open')}
                  </span>
                </FormInputWrapper>
              ) : null}
              <FormInputWrapper>
                <BoxTitleDiv>{translate('website-address')}</BoxTitleDiv>
                {publicUrl === null ? (
                  <span>{translate('website-address-unknown')}</span>
                ) : website.publishedAt ? (
                  <a href={publicUrl} target={'_blank'} rel={'noopener noreferrer'}>
                    {publicUrl}
                  </a>
                ) : (
                  <span>{publicUrl}</span>
                )}
              </FormInputWrapper>
              <FormInputWrapper>
                <BoxTitleDiv>{translate('website-status')}</BoxTitleDiv>
                <PublishBar
                  website={website}
                  onChanged={(changed) => setState((s) => ({ ...s, website: changed }))}
                  onStale={reload}
                />
              </FormInputWrapper>
              <Space wrap>
                <Link to={COMPANY_WEBSITE_PAGES_URL}>{translate('website-pages-edit')}</Link>
                <Link to={COMPANY_WEBSITE_TEMPLATES_URL}>{translate('website-templates-choose')}</Link>
                <Link to={COMPANY_WEBSITE_SETTINGS_URL}>{translate('website-settings')}</Link>
                <Link to={COMPANY_WEBSITE_ANALYTICS_URL}>{translate('website-analytics')}</Link>
              </Space>
            </>
          ) : null}
        </Space>
      </Card>
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_WEBSITE_PUBLISH}
      ContentHeader={<BackendPageContentTitle title={translate('website')} />}
    >
      {isOn ? <Spin spinning={state.loading}>{getContent()}</Spin> : <InvalidAccessPanel />}
    </BackendPage>
  )
}

export default WebsiteOverviewPage
