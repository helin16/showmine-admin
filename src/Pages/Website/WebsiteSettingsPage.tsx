import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Input, Select } from 'antd'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_WEBSITE_SETTINGS } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Alert from '../../Components/Form/Alert'
import Button from '../../Components/Form/Button'
import Card from '../../Components/Form/Card'
import Space from '../../Components/Form/Space'
import Spin from '../../Components/Form/Spin'
import message from '../../Components/Form/message'
import SeoFields from '../../Components/Website/SeoFields'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import IAsset from '../../Types/Asset/IAsset'
import IWebsite, {
  CUSTOM_DOMAIN_PATTERN,
  CUSTOM_DOMAIN_STATUSES,
  IFieldError,
  IWebsiteSeo,
  WEBSITE_SLUG_PATTERN,
  toSeo,
} from '../../Types/Website/IWebsite'

// The website's settings (specs/001-website-builder, US6, T067): the site's SEO, a ShowMine subdomain and a custom
// domain. The addresses are recorded and checked only; nothing serves them yet.
type iForm = { seo: IWebsiteSeo; subdomain: string; customDomain: string; customDomainStatus?: string }
type iState = {
  loading: boolean
  website?: IWebsite
  form?: iForm
  loadError?: string
  // Problems by field: seo.title, subdomain, customDomain...
  errors: { [path: string]: string }
  saving: boolean
  isStale: boolean
  images: { [assetId: string]: IAsset | null }
  count: number
}
const initState: iState = { loading: false, errors: {}, saving: false, isStale: false, images: {}, count: 0 }

// The API's own words for an address another website has.
const SUBDOMAIN_TAKEN = 'That subdomain is taken.'
const DOMAIN_TAKEN = 'That domain is taken.'

// The fields that show their own problems.
const SHOWN_PATHS = [
  'seo.title',
  'seo.description',
  'seo.imageAssetId',
  'subdomain',
  'customDomain',
  'customDomainStatus',
]

const toForm = (website: IWebsite): iForm => ({
  seo: toSeo(website.seo),
  subdomain: website.subdomain || '',
  customDomain: website.customDomain || '',
  customDomainStatus: website.customDomainStatus,
})
const isSame = (a?: object, b?: object) => JSON.stringify(a) === JSON.stringify(b)

const WebsiteSettingsPage = () => {
  const { company, user } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const isSuperAdmin = user?.isSuperAdmin === true
  const [state, setState] = useState(initState)
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id

  useEffect(() => {
    if (!isOn) return
    let isCurrent = true
    setState((s) => ({ ...s, loading: true, loadError: undefined, isStale: false, errors: {}, website: undefined }))
    WebsiteService.get()
      .then((website) => {
        if (!isCurrent) return
        setState((s) => ({ ...s, website, form: toForm(website) }))
        const imageId = website.seo?.imageAssetId
        if (imageId) {
          // The thumbnail only: a failure leaves it loading, and saving still works.
          WebsiteService.getImages(1, [imageId])
            .then(({ data }) => {
              if (!isCurrent) return
              const found = data.find((asset) => `${asset.id}` === imageId) ?? null
              setState((s) => ({ ...s, images: { ...s.images, [imageId]: found } }))
            })
            .catch(() => undefined)
        }
      })
      .catch((err) => isCurrent && setState((s) => ({ ...s, form: undefined, loadError: Utils.getErrorMessage(err) })))
      .finally(() => isCurrent && setState((s) => ({ ...s, loading: false })))
    return () => {
      isCurrent = false
    }
  }, [isOn, company?.id, state.count])

  const isDirty = !!state.form && !!state.website && !isSame(state.form, toForm(state.website))

  // Closing or reloading the tab with unsaved changes asks first.
  useEffect(() => {
    if (!isDirty) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const reload = () => setState((s) => ({ ...s, count: s.count + 1 }))
  const setForm = (changes: Partial<iForm>) => setState((s) => (s.form ? { ...s, form: { ...s.form, ...changes } } : s))

  const save = () => {
    const { form, website } = state
    if (!form || !website) return
    const subdomain = form.subdomain.trim().toLowerCase()
    const customDomain = form.customDomain.trim().toLowerCase()
    const errors: { [path: string]: string } = {
      ...(subdomain === '' || WEBSITE_SLUG_PATTERN.test(subdomain)
        ? {}
        : { subdomain: translate('website-subdomain-bad') }),
      ...(customDomain === '' || CUSTOM_DOMAIN_PATTERN.test(customDomain)
        ? {}
        : { customDomain: translate('website-domain-bad') }),
    }
    if (Object.keys(errors).length > 0) {
      setState((s) => ({ ...s, errors }))
      return
    }
    const companyId = company?.id
    const isSameCompany = () => companyIdRef.current === companyId
    setState((s) => ({ ...s, saving: true, errors: {} }))
    WebsiteService.update({
      // Sent only when changed: an SEO change counts as something to publish.
      ...(isSame(form.seo, toSeo(website.seo)) ? {} : { seo: form.seo }),
      subdomain: subdomain || null,
      customDomain: customDomain || null,
      // Only staff may send it, only a change, and only for the saved domain: a new domain is pending until checked.
      ...(isSuperAdmin &&
      form.customDomainStatus !== website.customDomainStatus &&
      customDomain !== '' &&
      customDomain === website.customDomain
        ? { customDomainStatus: form.customDomainStatus }
        : {}),
      updatedAt: website.updatedAt,
    })
      .then((saved) => {
        if (!isSameCompany()) return
        // Typing that went on during the save is kept: the saved settings replace the form only if it is unchanged.
        setState((s) => ({ ...s, website: saved, form: isSame(s.form, form) ? toForm(saved) : s.form }))
        message.success(translate('website-saved'))
      })
      .catch((err) => {
        if (!isSameCompany()) return
        const { status, data } = err?.response || {}
        const fieldErrors = Object.fromEntries(((data?.errors || []) as IFieldError[]).map((e) => [e.path, e.message]))
        if (Object.keys(fieldErrors).length > 0) {
          setState((s) => ({ ...s, errors: fieldErrors }))
          // A problem with no field on the page is said out loud instead.
          const unshown = Object.entries(fieldErrors).filter(([path]) => !SHOWN_PATHS.includes(path))
          if (unshown.length > 0) {
            message.error(unshown.map(([, problem]) => problem).join(' '))
          }
        } else if (status === 409 && data?.message === SUBDOMAIN_TAKEN) {
          setState((s) => ({ ...s, errors: { subdomain: translate('website-subdomain-taken') } }))
        } else if (status === 409 && data?.message === DOMAIN_TAKEN) {
          setState((s) => ({ ...s, errors: { customDomain: translate('website-domain-taken') } }))
        } else if (status === 409) {
          // Another admin saved first: their change is kept, and this one waits for a reload.
          setState((s) => ({ ...s, isStale: true }))
        } else {
          message.error(Utils.getErrorMessage(err))
        }
      })
      .finally(() => setState((s) => ({ ...s, saving: false })))
  }

  const fieldError = (path: string) =>
    state.errors[path] ? (
      <div id={`website-${path}-error`} role={'alert'} className={'ant-form-item-explain-error'}>
        {state.errors[path]}
      </div>
    ) : null

  const addressField = (field: 'subdomain' | 'customDomain', maxLength: number, status: string) => (
    <div>
      <label htmlFor={`website-${field}`}>{translate(`website-${field}`)}</label>
      <Input
        id={`website-${field}`}
        value={state.form?.[field]}
        maxLength={maxLength}
        status={state.errors[field] ? 'error' : undefined}
        aria-invalid={state.errors[field] ? true : undefined}
        aria-describedby={
          state.errors[field] ? `website-${field}-help website-${field}-error` : `website-${field}-help`
        }
        onChange={(e) => setForm({ [field]: e.target.value })}
      />
      <div id={`website-${field}-help`}>{translate(`website-${field}-help`)}</div>
      {fieldError(field)}
      <div>{translate('website-address-state', { state: translate(`website-address-state-${status}`) })}</div>
    </div>
  )

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
    const { form, website } = state
    if (!form || !website) return null
    const seoErrors = Object.fromEntries(
      Object.entries(state.errors)
        .filter(([path]) => path.startsWith('seo.'))
        .map(([path, problem]) => [path.slice(4), problem]),
    )
    return (
      <Space orientation={'vertical'} style={{ width: '100%' }}>
        {state.isStale ? (
          <Alert
            type={'warning'}
            message={translate('website-stale')}
            action={<Button onClick={reload}>{translate('website-reload')}</Button>}
          />
        ) : null}
        <Card title={translate('website-seo')}>
          <SeoFields
            idPrefix={'website-seo'}
            seo={form.seo}
            help={translate('website-seo-site-help')}
            errors={seoErrors}
            images={state.images}
            onImagesPicked={(assets) =>
              setState((s) => ({
                ...s,
                images: { ...s.images, ...Object.fromEntries(assets.map((asset) => [`${asset.id}`, asset])) },
              }))
            }
            onChange={(seo) => setForm({ seo })}
          />
        </Card>
        <Card title={translate('website-addresses')}>
          <Space orientation={'vertical'} style={{ width: '100%' }}>
            <Alert type={'info'} message={translate('website-addresses-not-served')} />
            {addressField('subdomain', 40, website.subdomainStatus || 'none')}
            {addressField('customDomain', 253, website.customDomainStatus || 'none')}
            {isSuperAdmin && website.customDomain ? (
              <div>
                <label htmlFor={'website-customDomainStatus'}>{translate('website-domain-state-set')}</label>
                <Select
                  id={'website-customDomainStatus'}
                  value={form.customDomainStatus}
                  style={{ minWidth: 180 }}
                  onChange={(customDomainStatus: string) => setForm({ customDomainStatus })}
                  options={CUSTOM_DOMAIN_STATUSES.map((status) => ({
                    value: status,
                    label: translate(`website-address-state-${status}`),
                  }))}
                />
                {fieldError('customDomainStatus')}
              </div>
            ) : null}
          </Space>
        </Card>
        <Card>
          <Button type={'primary'} onClick={save} loading={state.saving} disabled={state.isStale || !isDirty}>
            {translate('website-save')}
          </Button>
        </Card>
      </Space>
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_WEBSITE_SETTINGS}
      ContentHeader={<BackendPageContentTitle title={translate('website-settings')} />}
    >
      {isOn ? <Spin spinning={state.loading}>{getContent()}</Spin> : <InvalidAccessPanel />}
    </BackendPage>
  )
}

export default WebsiteSettingsPage
