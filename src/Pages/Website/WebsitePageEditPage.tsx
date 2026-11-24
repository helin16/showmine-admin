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
import SectionEditor, {
  ADDABLE_SECTION_TYPES,
  checkSection,
  getImageIds,
  newSection,
} from '../../Components/Website/SectionEditors'
import SeoFields from '../../Components/Website/SeoFields'
import Collapse from '../../Components/Form/Collapse'
import IAsset from '../../Types/Asset/IAsset'
import translate from '../../i18n/translate'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import IWebsite, {
  IFieldError,
  IWebsitePage,
  IWebsiteSection,
  IWebsiteSeo,
  PAGE_SLUG_PATTERN,
} from '../../Types/Website/IWebsite'
import { COMPANY_WEBSITE_PAGES_URL } from '../../UrlMap'

// Edits one page and its sections (specs/001-website-builder, US2, T035). One Save sends the whole page with the
// updatedAt it was loaded with; Preview opens the saved draft on the Reader; the publish bar publishes it.
type iDraft = { title: string; slug: string; sections: IWebsiteSection[]; seo: IWebsiteSeo }
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
  // A preview link the browser would not open in a new tab.
  previewUrl?: string
  // Read by screen readers after a section moves.
  announcement: string
  // The page's images by id; null for one that is no longer among the website images.
  images: { [assetId: string]: IAsset | null }
  count: number
}
const initState: iState = {
  loading: false,
  notFound: false,
  errors: {},
  saving: false,
  isStale: false,
  addingType: 'text',
  announcement: '',
  images: {},
  count: 0,
}

// The API's own words for a stale save.
const STALE_PAGE = 'The page was changed by someone else. Reload and try again.'

// The API's limit on sections per page.
const MAX_SECTIONS = 30

const toDraft = (page: IWebsitePage): iDraft => ({
  title: page.title,
  slug: page.slug,
  sections: page.sections || [],
  seo: page.seo || {},
})
const isSame = (a?: iDraft, b?: iDraft) => JSON.stringify(a) === JSON.stringify(b)

const WebsitePageEditPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState(initState)
  const [isSeoOpen, setIsSeoOpen] = useState(false)
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id
  // The admin's own version, kept across a reload when they chose to keep it after someone else's change.
  const keptDraftRef = useRef<iDraft | undefined>(undefined)
  const isDirty = !!state.page && !!state.draft && !isSame(state.draft, toDraft(state.page))

  useEffect(() => {
    if (!isOn) return
    let isCurrent = true
    setState((s) => ({ ...s, loading: true, loadError: undefined, notFound: false, isStale: false, errors: {} }))
    Promise.all([WebsiteService.getPages(), WebsiteService.get()])
      .then(([pages, website]) => {
        if (!isCurrent) return
        const page = pages.find((p) => p.id === id)
        const kept = keptDraftRef.current
        keptDraftRef.current = undefined
        setState((s) =>
          page
            ? { ...s, page, website, draft: kept ?? toDraft(page) }
            : { ...s, page: undefined, draft: undefined, notFound: true },
        )
        const shown = kept ?? (page ? toDraft(page) : undefined)
        const ids = [
          ...getImageIds(shown?.sections || []),
          ...(shown?.seo.imageAssetId ? [shown.seo.imageAssetId] : []),
        ]
        if (ids.length > 0) {
          // Thumbnails only: a failure leaves them loading, and saving or publishing still works.
          WebsiteService.getImages(1, ids)
            .then(({ data }) => {
              if (!isCurrent) return
              const found = Object.fromEntries(data.map((asset) => [`${asset.id}`, asset]))
              setState((s) => ({
                ...s,
                images: { ...s.images, ...Object.fromEntries(ids.map((assetId) => [assetId, found[assetId] ?? null])) },
              }))
            })
            .catch(() => undefined)
        }
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

  const reload = () => setState((s) => ({ ...s, count: s.count + 1, previewUrl: undefined }))

  // Loads the other admin's saved page but keeps this admin's draft on top, so saving replaces their change.
  const keepMine = () => {
    keptDraftRef.current = state.draft
    reload()
  }

  const setDraft = (changes: Partial<iDraft>) =>
    setState((s) => (s.draft ? { ...s, draft: { ...s.draft, ...changes } } : s))
  const setSections = (sections: IWebsiteSection[]) => setDraft({ sections })

  const moveSection = (index: number, by: number) => {
    const sections = [...(state.draft?.sections || [])]
    const [section] = sections.splice(index, 1)
    sections.splice(index + by, 0, section)
    setSections(sections)
    setState((s) => ({
      ...s,
      announcement: translate('website-section-moved', {
        name: translate(`website-section-type-${section.type}`),
        number: index + by + 1,
      }),
    }))
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
        // Typing that went on during the save is kept: the saved page replaces the draft only if it is unchanged.
        setState((s) => ({ ...s, page: saved, draft: isSame(s.draft, draft) ? toDraft(saved) : s.draft, website }))
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
    const companyId = company?.id
    const isSameCompany = () => companyIdRef.current === companyId
    setState((s) => ({ ...s, previewUrl: undefined }))
    const isSaved = isDirty ? await save() : true
    if (!isSaved || !isSameCompany()) {
      tab?.close()
      return
    }
    try {
      const { url } = await WebsiteService.getPreviewUrl()
      if (!isSameCompany()) {
        tab?.close()
      } else if (tab) {
        tab.location.href = url
      } else {
        // The browser blocked the tab: the admin opens the link themselves.
        setState((s) => ({ ...s, previewUrl: url }))
      }
    } catch (err) {
      tab?.close()
      message.error(Utils.getErrorMessage(err))
    }
  }

  const addImages = (assets: IAsset[]) =>
    setState((s) => ({
      ...s,
      images: { ...s.images, ...Object.fromEntries(assets.map((asset) => [`${asset.id}`, asset])) },
    }))

  const sectionErrors = (index: number) =>
    Object.fromEntries(
      Object.entries(state.errors)
        .filter(([path]) => path.startsWith(`sections[${index}].`))
        .map(([path, problem]) => [path.slice(`sections[${index}].`.length), problem]),
    )

  // Problems about the sections as a whole, or a section's type or id, which have no field of their own.
  const getPageProblems = () =>
    Object.entries(state.errors)
      .filter(([path]) => path === 'sections' || /^sections\[\d+\]\.(type|id)$/.test(path))
      .map(([path, problem]) =>
        path === 'sections'
          ? problem
          : `${translate('website-section-number', { number: Number(path.slice(9, path.indexOf(']'))) + 1 })}: ${problem}`,
      )

  const getSection = (section: IWebsiteSection, index: number, sections: IWebsiteSection[]) => {
    const name = `${index + 1}. ${translate(`website-section-type-${section.type}`)}`
    return (
      // Keyed by position: moving a section changes the content of the cards, never moves a text editor's frame,
      // which would reload it.
      <Card
        key={index}
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
          images={state.images}
          onImagesPicked={addImages}
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
    const seoErrors = Object.fromEntries(
      Object.entries(state.errors)
        .filter(([path]) => path.startsWith('seo.'))
        .map(([path, problem]) => [path.slice(4), problem]),
    )
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
            action={
              <Space wrap>
                <Button onClick={reload}>{translate('website-reload')}</Button>
                <Button onClick={keepMine}>{translate('website-page-keep-mine')}</Button>
              </Space>
            }
          />
        ) : null}
        <div aria-live={'polite'} className={'sr-only'} style={{ position: 'absolute', left: -10000 }}>
          {state.announcement}
        </div>
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
        <Collapse
          items={[
            {
              key: 'seo',
              label: translate('website-seo'),
              // Open while it has a problem, so the message is seen.
              children: (
                <SeoFields
                  idPrefix={'page-seo'}
                  seo={draft.seo}
                  help={translate('website-seo-page-help')}
                  errors={seoErrors}
                  images={state.images}
                  onImagesPicked={addImages}
                  onChange={(seo) => setDraft({ seo })}
                />
              ),
            },
          ]}
          activeKey={isSeoOpen || Object.keys(seoErrors).length > 0 ? ['seo'] : []}
          onChange={(keys) => setIsSeoOpen(([] as string[]).concat(keys).includes('seo'))}
        />
        {draft.sections.map(getSection)}
        {draft.sections.length === 0 ? <Alert type={'info'} message={translate('website-sections-none')} /> : null}
        {getPageProblems().length > 0 ? (
          <Alert
            type={'error'}
            message={
              <ul>
                {getPageProblems().map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            }
          />
        ) : null}
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
            <Button
              disabled={draft.sections.length >= MAX_SECTIONS}
              onClick={() => setSections([...draft.sections, newSection(state.addingType)])}
            >
              {translate('website-section-add')}
            </Button>
            {draft.sections.length >= MAX_SECTIONS ? (
              <span>{translate('website-sections-full', { max: MAX_SECTIONS })}</span>
            ) : null}
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
            {state.previewUrl ? (
              <a href={state.previewUrl} target={'_blank'} rel={'noopener noreferrer'}>
                {translate('website-preview-open')}
              </a>
            ) : null}
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
