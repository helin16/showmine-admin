import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Input, Select } from 'antd'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_COMPANY_WEBSITE } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Alert from '../../Components/Form/Alert'
import Button from '../../Components/Form/Button'
import Card from '../../Components/Form/Card'
import PopConfirm from '../../Components/Form/Popconfirm'
import Space from '../../Components/Form/Space'
import Spin from '../../Components/Form/Spin'
import message from '../../Components/Form/message'
import PublishBar from '../../Components/Website/PublishBar'
import SectionEditor, { ADDABLE_SECTION_TYPES, checkSection, newSection } from '../../Components/Website/SectionEditors'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import IWebsite, { IFieldError, IWebsitePage, IWebsiteSection, PAGE_SLUG_PATTERN } from '../../Types/Website/IWebsite'
import { COMPANY_WEBSITE_PAGES_URL } from '../../UrlMap'

// Edits one page and its sections (specs/001-website-builder, US2, T035). One Save sends the whole page with the
// updatedAt it was loaded with; Preview opens the saved draft on the Reader; the publish bar publishes it.
type iDraft = { title: string; slug: string; sections: IWebsiteSection[] }
type iState = {
  loading: boolean
  page?: IWebsitePage
  website?: IWebsite
  draft?: iDraft
  notFound: boolean
  loadError?: string
  // Problems by path: title, slug, or sections[2].heading.
  errors: { [path: string]: string }
  saving: boolean
  isStale: boolean
  addingType: string
  count: number
}
const initState: iState = {
  loading: false,
  notFound: false,
  errors: {},
  saving: false,
  isStale: false,
  addingType: 'text',
  count: 0,
}

// The API's own words for a stale save.
const STALE_PAGE = 'The page was changed by someone else. Reload and try again.'

const toDraft = (page: IWebsitePage): iDraft => ({ title: page.title, slug: page.slug, sections: page.sections || [] })
const isSame = (a?: iDraft, b?: iDraft) => JSON.stringify(a) === JSON.stringify(b)

const WebsitePageEditPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState(initState)
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id
  const isDirty = !!state.page && !!state.draft && !isSame(state.draft, toDraft(state.page))

  useEffect(() => {
    if (!isOn) return
    let isCurrent = true
    setState((s) => ({ ...s, loading: true, loadError: undefined, notFound: false, isStale: false, errors: {} }))
    Promise.all([WebsiteService.getPages(), WebsiteService.get()])
      .then(([pages, website]) => {
        if (!isCurrent) return
        const page = pages.find((p) => p.id === id)
        setState((s) =>
          page
            ? { ...s, page, website, draft: toDraft(page) }
            : { ...s, page: undefined, draft: undefined, notFound: true },
        )
      })
      .catch((err) => {
        if (!isCurrent) return
        setState((s) => ({
          ...s,
          page: undefined,
          draft: undefined,
          ...(err?.response?.status === 404 ? { notFound: true } : { loadError: Utils.getErrorMessage(err) }),
        }))
      })
      .finally(() => isCurrent && setState((s) => ({ ...s, loading: false })))
    return () => {
      isCurrent = false
    }
  }, [isOn, company?.id, id, state.count])

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

  const setDraft = (changes: Partial<iDraft>) =>
    setState((s) => (s.draft ? { ...s, draft: { ...s.draft, ...changes } } : s))
  const setSections = (sections: IWebsiteSection[]) => setDraft({ sections })

  const moveSection = (index: number, by: number) => {
    const sections = [...(state.draft?.sections || [])]
    const [section] = sections.splice(index, 1)
    sections.splice(index + by, 0, section)
    setSections(sections)
  }

  // Saves the draft. Resolves with whether it was saved, so Preview can wait for it.
  const save = (): Promise<boolean> => {
    const { draft, page } = state
    if (!draft || !page) return Promise.resolve(false)
    const errors: { [path: string]: string } = {
      ...(draft.title.trim() === '' ? { title: translate('website-page-title-required') } : {}),
      ...(PAGE_SLUG_PATTERN.test(draft.slug) ? {} : { slug: translate('website-page-slug-bad') }),
    }
    draft.sections.forEach((section, index) =>
      Object.entries(checkSection(section)).forEach(([field, problem]) => {
        errors[`sections[${index}].${field}`] = problem
      }),
    )
    if (Object.keys(errors).length > 0) {
      setState((s) => ({ ...s, errors }))
      message.error(translate('website-page-has-problems'))
      return Promise.resolve(false)
    }
    const companyId = company?.id
    const isSameCompany = () => companyIdRef.current === companyId
    setState((s) => ({ ...s, saving: true, errors: {} }))
    return WebsiteService.updatePage(`${page.id}`, { ...draft, title: draft.title.trim(), updatedAt: page.updatedAt })
      .then(async (saved) => {
        if (!isSameCompany()) return false
        // The website's "unpublished changes" follows the save.
        const website = await WebsiteService.get().catch(() => state.website)
        setState((s) => ({ ...s, page: saved, draft: toDraft(saved), website }))
        message.success(translate('website-saved'))
        return true
      })
      .catch((err) => {
        if (!isSameCompany()) return false
        const { status, data } = err?.response || {}
        const fieldErrors = Object.fromEntries(((data?.errors || []) as IFieldError[]).map((e) => [e.path, e.message]))
        if (Object.keys(fieldErrors).length > 0) {
          setState((s) => ({ ...s, errors: fieldErrors }))
          message.error(translate('website-page-has-problems'))
        } else if (status === 409 && data?.message === STALE_PAGE) {
          setState((s) => ({ ...s, isStale: true }))
        } else if (status === 409) {
          setState((s) => ({ ...s, errors: { slug: translate('website-page-slug-taken') } }))
        } else {
          message.error(Utils.getErrorMessage(err))
        }
        return false
      })
      .finally(() => setState((s) => ({ ...s, saving: false })))
  }

  // The tab is opened now, while the click counts as the admin's, so the browser does not block it; it gets its
  // address once the draft is saved and the link is made.
  const preview = async () => {
    const tab = window.open('', '_blank')
    if (tab) {
      tab.opener = null
    }
    const isSaved = isDirty ? await save() : true
    if (!isSaved) {
      tab?.close()
      return
    }
    try {
      const { url } = await WebsiteService.getPreviewUrl()
      if (tab) {
        tab.location.href = url
      } else {
        // The browser blocked the early tab; this one may still open.
        window.open(url, '_blank', 'noopener')
      }
    } catch (err) {
      tab?.close()
      message.error(Utils.getErrorMessage(err))
    }
  }

  const sectionErrors = (index: number) =>
    Object.fromEntries(
      Object.entries(state.errors)
        .filter(([path]) => path.startsWith(`sections[${index}].`))
        .map(([path, problem]) => [path.slice(`sections[${index}].`.length), problem]),
    )

  const getSection = (section: IWebsiteSection, index: number, sections: IWebsiteSection[]) => {
    const name = `${index + 1}. ${translate(`website-section-type-${section.type}`)}`
    return (
      <Card
        key={section.id}
        title={name}
        extra={
          <Space wrap>
            <Button
              aria-label={translate('website-move-up', { name })}
              disabled={index === 0}
              onClick={() => moveSection(index, -1)}
            >
              ↑
            </Button>
            <Button
              aria-label={translate('website-move-down', { name })}
              disabled={index === sections.length - 1}
              onClick={() => moveSection(index, 1)}
            >
              ↓
            </Button>
            <PopConfirm
              title={translate('website-section-remove-confirm')}
              okText={translate('website-remove')}
              cancelText={translate('cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => setSections(sections.filter((s) => s.id !== section.id))}
            >
              <Button danger aria-label={translate('website-remove-named', { name })}>
                {translate('website-remove')}
              </Button>
            </PopConfirm>
          </Space>
        }
      >
        <SectionEditor
          section={section}
          errors={sectionErrors(index)}
          onChange={(changed) => setSections(sections.map((s) => (s.id === section.id ? changed : s)))}
        />
      </Card>
    )
  }

  const getContent = () => {
    if (state.notFound) {
      return (
        <Alert
          type={'warning'}
          message={translate('website-page-not-found')}
          action={<Link to={COMPANY_WEBSITE_PAGES_URL}>{translate('website-pages')}</Link>}
        />
      )
    }
    if (state.loadError) {
      return (
        <Alert
          type={'error'}
          message={translate('website-pages-load-failed', { message: state.loadError })}
          action={<Button onClick={reload}>{translate('retry')}</Button>}
        />
      )
    }
    const { draft, website } = state
    if (!draft) {
      return null
    }
    const fieldError = (path: string) =>
      state.errors[path] ? (
        <div id={`page-${path}-error`} role={'alert'} className={'ant-form-item-explain-error'}>
          {state.errors[path]}
        </div>
      ) : null
    return (
      <Space orientation={'vertical'} style={{ width: '100%' }}>
        {state.isStale ? (
          <Alert
            type={'warning'}
            message={translate('website-page-stale')}
            action={<Button onClick={reload}>{translate('website-reload')}</Button>}
          />
        ) : null}
        {website ? (
          <Card>
            <PublishBar
              website={website}
              hasUnsavedChanges={isDirty}
              onChanged={(changed) => setState((s) => ({ ...s, website: changed }))}
              onStale={reload}
            />
          </Card>
        ) : null}
        <Card>
          <Space orientation={'vertical'} style={{ width: '100%' }}>
            {(['title', 'slug'] as const).map((name) => (
              <div key={name}>
                <label htmlFor={`page-${name}`}>{translate(`website-page-${name}`)}</label>
                <Input
                  id={`page-${name}`}
                  value={draft[name]}
                  maxLength={name === 'title' ? 80 : 40}
                  status={state.errors[name] ? 'error' : undefined}
                  aria-invalid={state.errors[name] ? true : undefined}
                  aria-describedby={state.errors[name] ? `page-${name}-error` : undefined}
                  onChange={(e) => setDraft({ [name]: e.target.value })}
                />
                {fieldError(name)}
              </div>
            ))}
          </Space>
        </Card>
        {draft.sections.map(getSection)}
        {draft.sections.length === 0 ? <Alert type={'info'} message={translate('website-sections-none')} /> : null}
        <Card>
          <Space wrap>
            <label htmlFor={'add-section-type'}>{translate('website-section-add-type')}</label>
            <Select
              id={'add-section-type'}
              value={state.addingType}
              style={{ minWidth: 180 }}
              onChange={(addingType: string) => setState((s) => ({ ...s, addingType }))}
              options={ADDABLE_SECTION_TYPES.map((type) => ({
                value: type,
                label: translate(`website-section-type-${type}`),
              }))}
            />
            <Button onClick={() => setSections([...draft.sections, newSection(state.addingType)])}>
              {translate('website-section-add')}
            </Button>
          </Space>
        </Card>
        <Card>
          <Space wrap>
            <Button type={'primary'} onClick={save} loading={state.saving} disabled={!isDirty || state.isStale}>
              {translate('website-save')}
            </Button>
            <Button onClick={preview} disabled={state.saving || state.isStale}>
              {translate('website-preview')}
            </Button>
            {isDirty ? <span>{translate('website-page-unsaved')}</span> : null}
          </Space>
        </Card>
      </Space>
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_COMPANY_WEBSITE}
      ContentHeader={
        <BackendPageContentTitle
          title={state.page ? state.page.title : translate('website-pages')}
          controls={
            isDirty ? (
              <PopConfirm
                title={translate('website-page-leave-confirm')}
                okText={translate('website-page-leave')}
                cancelText={translate('cancel')}
                onConfirm={() => navigate(COMPANY_WEBSITE_PAGES_URL)}
              >
                <Button>{translate('website-pages-back')}</Button>
              </PopConfirm>
            ) : (
              <Link to={COMPANY_WEBSITE_PAGES_URL}>{translate('website-pages-back')}</Link>
            )
          }
        />
      }
    >
      {isOn ? <Spin spinning={state.loading}>{getContent()}</Spin> : <InvalidAccessPanel />}
    </BackendPage>
  )
}

export default WebsitePageEditPage
