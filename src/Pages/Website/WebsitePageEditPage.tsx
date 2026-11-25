import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Input } from 'antd'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_WEBSITE_PAGES } from '../../Components/Menu/MenuItems'
import { useIsCompanyAdmin } from '../../Components/Route/CompanyAdminRoute'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Alert from '../../Components/Form/Alert'
import Button from '../../Components/Form/Button'
import Space from '../../Components/Form/Space'
import Spin from '../../Components/Form/Spin'
import message from '../../Components/Form/message'
import PublishBar from '../../Components/Website/PublishBar'
import SectionEditor, { checkSection, getImageIds, newSection } from '../../Components/Website/SectionEditors'
import SeoFields from '../../Components/Website/SeoFields'
import SiteCanvas from '../../Components/Website/Canvas/SiteCanvas'
import BlockPalette, { BLOCK_TILE_GAP, BLOCK_TILE_SIZE } from '../../Components/Website/Canvas/BlockPalette'
import styled from 'styled-components'
import Dropdown from '../../Components/Form/Dropdown'
import Modal from '../../Components/Form/Modal'
import Icons from '../../Components/Icons'
import { BoxTitleDiv } from '../../Styles/AppWrapper'
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
  toSeo,
} from '../../Types/Website/IWebsite'
import { COMPANY_WEBSITE_PAGES_URL } from '../../UrlMap'

// Edits one page and its sections (specs/001-website-builder, US2, T035). One Save sends the whole page with the
// updatedAt it was loaded with; Preview opens the saved draft on the Reader; the publish bar publishes it. The page is
// drawn on a canvas as the website shows it; the selected block is edited in the panel (specs/004, US2).
type iDraft = { title: string; slug: string; sections: IWebsiteSection[]; seo: IWebsiteSeo }
type iState = {
  loading: boolean
  page?: IWebsitePage
  // Every page of the website, for the canvas menu.
  pages: IWebsitePage[]
  website?: IWebsite
  draft?: iDraft
  notFound: boolean
  loadError?: string
  // Problems by path: title, slug, or sections[2].heading.
  errors: { [path: string]: string }
  saving: boolean
  isStale: boolean
  // The block edited in the panel.
  selectedId?: string
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
  pages: [],
  isStale: false,
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
  seo: toSeo(page.seo),
})
const isSame = (a?: iDraft, b?: iDraft) => JSON.stringify(a) === JSON.stringify(b)

// The canvas and the panel side by side, as the MConnect form designer (mgg-ui DesignTab): the panel is as wide as a
// row of block tiles (3, then 4 from 1600px and 5 from 1920px); narrower than 992px it goes under the canvas.
const PANEL_PADDING = '12px'
const DesignLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  .design-canvas {
    min-width: 0;
  }
  @media (min-width: 992px) {
    flex-direction: row;
    align-items: flex-start;
    --block-tiles: 3;
    .design-canvas {
      flex: 1 1 0;
    }
    .design-panel {
      flex: 0 0 auto;
      position: sticky;
      top: 0;
    }
    .panel-content {
      width: calc(
        var(--block-tiles) * ${BLOCK_TILE_SIZE} + (var(--block-tiles) - 1) * ${BLOCK_TILE_GAP} + 2 * ${PANEL_PADDING}
      );
    }
  }
  @media (min-width: 1600px) {
    --block-tiles: 4;
  }
  @media (min-width: 1920px) {
    --block-tiles: 5;
  }
`

// The panel: the open tab's content, with the tab rail on the far right and a notch on the active tab.
const SidePanel = styled.div`
  display: flex;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #f8f9fa;
  min-height: 300px;
  .panel-content {
    flex: 1;
    min-width: 0;
    padding: ${PANEL_PADDING};
  }
  .panel-tabs {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #dee2e6;
    background: #f1f3f5;
    button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px 10px;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: #495057;
      font-size: 0.8rem;
      cursor: pointer;
      position: relative;
      .anticon {
        font-size: 20px;
      }
      &.active {
        background: #fff;
        color: #212529;
        font-weight: 600;
      }
      &.active::before,
      &.active::after {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-style: solid;
        border-color: transparent;
      }
      &.active::before {
        left: -10px;
        border-width: 10px 10px 10px 0;
        border-right-color: #dee2e6;
      }
      &.active::after {
        left: -9px;
        border-width: 9px 9px 9px 0;
        border-right-color: #fff;
      }
    }
  }
`

const WebsitePageEditPage = () => {
  const isAdmin = useIsCompanyAdmin()
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState(initState)
  // The right panel's tab when no block is selected (SMN-85, as the MConnect form designer).
  const [panelTab, setPanelTab] = useState<'blocks' | 'settings'>('blocks')
  // The confirmation open: deleting the page, or leaving it with unsaved changes.
  const [confirming, setConfirming] = useState<'delete' | 'leave' | null>(null)
  const [deleting, setDeleting] = useState(false)
  // A problem with a field in Settings opens that tab, each time, so the message is seen. Says whether it did.
  const showSettingsFor = (errors: { [path: string]: string }) => {
    const isSettings = Object.keys(errors).some(
      (path) => path === 'title' || path === 'slug' || path.startsWith('seo.'),
    )
    if (isSettings) {
      setPanelTab('settings')
      setState((s) => ({ ...s, selectedId: undefined }))
    }
    return isSettings
  }
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
            ? {
                ...s,
                page,
                pages,
                website,
                draft: kept ?? toDraft(page),
                // Nothing selected: the panel shows the blocks to add.
                selectedId: undefined,
              }
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
  const select = (selectedId?: string) => setState((s) => ({ ...s, selectedId }))

  // A problem in a block selects the first such block, so its field is seen.
  const selectProblem = (errors: { [path: string]: string }, sections: IWebsiteSection[]) => {
    const index = sections.findIndex((_, i) => Object.keys(errors).some((path) => path.startsWith(`sections[${i}].`)))
    if (index >= 0) select(sections[index].id)
  }

  // Added at the end, and selected. (The blocks to add show only while no block is selected, as in the MConnect form
  // designer; dragging to a place comes in slice 3.)
  const addSection = (type: string) => {
    const section = newSection(type)
    setSections([...(state.draft?.sections || []), section])
    select(section.id)
  }

  const moveSection = (index: number, by: number) => {
    const sections = [...(state.draft?.sections || [])]
    const [section] = sections.splice(index, 1)
    sections.splice(index + by, 0, section)
    setSections(sections)
    setState((s) => ({
      ...s,
      // Problems are kept by position: after a move they would mark the wrong block. The next save finds them again.
      errors: {},
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
      if (!showSettingsFor(errors)) selectProblem(errors, draft.sections)
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
          if (!showSettingsFor(fieldErrors)) selectProblem(fieldErrors, draft.sections)
          message.error(translate('website-page-has-problems'))
        } else if (status === 409 && data?.message === STALE_PAGE) {
          setState((s) => ({ ...s, isStale: true }))
        } else if (status === 409) {
          setState((s) => ({ ...s, errors: { slug: translate('website-page-slug-taken') } }))
          showSettingsFor({ slug: '' })
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

  // The right panel, as the MConnect form designer: the selected block's fields with Back, or the open tab (the blocks
  // to add, or the page settings); the tab rail on the far right.
  const getPanel = (sections: IWebsiteSection[]) => {
    const index = sections.findIndex((section) => section.id === state.selectedId)
    const section = sections[index]
    const isFull = sections.length >= MAX_SECTIONS
    const tabs = [
      { key: 'blocks', label: translate('website-panel-blocks'), Icon: Icons.BuildOutlined },
      { key: 'settings', label: translate('website-panel-settings'), Icon: Icons.SettingOutlined },
    ] as const
    return (
      <SidePanel>
        <div className={'panel-content'} role={'region'} aria-label={translate('website-panel')}>
          {section ? (
            <>
              <Button type={'link'} size={'small'} style={{ paddingLeft: 0 }} onClick={() => select(undefined)}>
                <Icons.ArrowLeftOutlined aria-hidden /> {translate('website-panel-back')}
              </Button>
              <BoxTitleDiv>{`${index + 1}. ${translate(`website-section-type-${section.type}`)}`}</BoxTitleDiv>
              <SectionEditor
                key={section.id}
                section={section}
                errors={sectionErrors(index)}
                images={state.images}
                onImagesPicked={addImages}
                onChange={(changed) => setSections(sections.map((s) => (s.id === section.id ? changed : s)))}
              />
            </>
          ) : null}
          {!section && panelTab === 'blocks' ? (
            <>
              <BlockPalette isFull={isFull} onAdd={addSection} />
              <small style={{ display: 'block', marginTop: 8, color: '#6c757d' }}>
                {translate('website-blocks-hint')}{' '}
                {isFull
                  ? translate('website-sections-full', { max: MAX_SECTIONS })
                  : translate('website-section-count', { count: sections.length, max: MAX_SECTIONS })}
              </small>
            </>
          ) : null}
          {!section && panelTab === 'settings' ? getSettings() : null}
        </div>
        <div className={'panel-tabs'} role={'group'} aria-label={translate('website-panel')}>
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              type={'button'}
              className={!section && panelTab === key ? 'active' : ''}
              aria-pressed={!section && panelTab === key}
              onClick={() => {
                select(undefined)
                setPanelTab(key)
              }}
            >
              <Icon aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </SidePanel>
    )
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

  // Delete page, for admins, after confirming: the page goes, and so does any unsaved change.
  const deletePage = () => {
    const { page } = state
    // The confirmation is busy while deleting, and Delete page is disabled while saving, so neither can overlap.
    if (!page) return
    const companyId = company?.id
    const isSameCompany = () => companyIdRef.current === companyId
    setDeleting(true)
    WebsiteService.deletePage(`${page.id}`)
      .then(() => {
        if (!isSameCompany()) return
        message.success(translate('website-page-deleted', { title: page.title }))
        navigate(COMPANY_WEBSITE_PAGES_URL)
      })
      .catch((err) => isSameCompany() && message.error(Utils.getErrorMessage(err)))
      .finally(() => {
        setDeleting(false)
        setConfirming(null)
      })
  }

  // The page's settings, in the panel's Settings tab (specs/004-website-visual-editor, US1; SMN-85).
  const getSettings = () => {
    const { draft, page } = state
    if (!draft || !page) return null
    return (
      <Space orientation={'vertical'} style={{ width: '100%' }} size={'large'}>
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
        <div>
          <BoxTitleDiv>{translate('website-seo')}</BoxTitleDiv>
          <SeoFields
            idPrefix={'page-seo'}
            seo={draft.seo}
            help={translate('website-seo-page-help')}
            errors={seoErrors}
            images={state.images}
            onImagesPicked={addImages}
            onChange={(seo) => setDraft({ seo })}
          />
        </div>
        {isAdmin ? (
          <Button danger disabled={state.saving} onClick={() => setConfirming('delete')}>
            {translate('website-page-delete')}
          </Button>
        ) : null}
      </Space>
    )
  }

  // The leave and delete confirmations.
  const getConfirmation = () => {
    const { page } = state
    if (!page || !confirming) return null
    return confirming === 'delete' ? (
      <Modal
        open
        title={translate(isDirty ? 'website-page-delete-confirm-unsaved' : 'website-page-delete-confirm', {
          title: page.title,
        })}
        okText={translate('website-delete')}
        cancelText={translate('cancel')}
        okButtonProps={{ danger: true, loading: deleting }}
        onOk={deletePage}
        onCancel={() => !deleting && setConfirming(null)}
      />
    ) : (
      <Modal
        open
        title={translate('website-page-leave-confirm')}
        okText={translate('website-page-leave')}
        cancelText={translate('cancel')}
        onOk={() => navigate(COMPANY_WEBSITE_PAGES_URL)}
        onCancel={() => setConfirming(null)}
      />
    )
  }

  const backToPages = () => (isDirty ? setConfirming('leave') : navigate(COMPANY_WEBSITE_PAGES_URL))

  // As on an article (SMN-85): Save, Publish for admins, and Options with the rest.
  const getControls = () => {
    const { draft, website } = state
    if (!draft) return null
    const items = [
      { key: 'preview', icon: <Icons.EyeOutlined aria-hidden />, label: translate('website-preview') },
      { key: 'settings', icon: <Icons.SettingOutlined aria-hidden />, label: translate('website-page-settings') },
      { key: 'back', icon: <Icons.ArrowLeftOutlined aria-hidden />, label: translate('website-pages-back') },
      ...(isAdmin
        ? [
            {
              key: 'delete',
              icon: <Icons.DeleteOutlined aria-hidden />,
              label: translate('website-page-delete'),
              danger: true,
              disabled: state.saving,
            },
          ]
        : []),
    ]
    const onMenu = ({ key }: { key: string }) => {
      if (key === 'preview') preview()
      if (key === 'settings') {
        select(undefined)
        setPanelTab('settings')
      }
      if (key === 'back') backToPages()
      if (key === 'delete') setConfirming('delete')
    }
    return (
      <Space wrap align={'start'}>
        {isDirty ? <span>{translate('website-page-unsaved')}</span> : null}
        {state.previewUrl ? (
          <a href={state.previewUrl} target={'_blank'} rel={'noopener noreferrer'}>
            {translate('website-preview-open')}
          </a>
        ) : null}
        <Button onClick={save} loading={state.saving} disabled={!isDirty || state.isStale}>
          {translate('website-save')}
        </Button>
        {/* Publishing is for admins only (SMN-80); a member saves and previews. Unpublishing is on the overview. */}
        {website && isAdmin ? (
          <PublishBar
            website={website}
            hasUnsavedChanges={isDirty}
            canUnpublish={false}
            onChanged={(changed) => setState((s) => ({ ...s, website: changed }))}
            onStale={reload}
          />
        ) : null}
        <Dropdown trigger={['click']} menu={{ items, onClick: onMenu }}>
          <Button>
            {translate('options')} <Icons.DownOutlined aria-hidden />
          </Button>
        </Dropdown>
      </Space>
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
    const pages = [...state.pages].sort((a, b) => a.position - b.position)
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
        <DesignLayout>
          <div className={'design-canvas'}>
            <SiteCanvas
              website={website}
              company={company ?? undefined}
              pageTitles={pages.map((p) => (p.id === state.page?.id ? draft.title : p.title))}
              currentIndex={pages.findIndex((p) => p.id === state.page?.id)}
              sections={draft.sections}
              images={state.images}
              selectedId={state.selectedId}
              problemIds={draft.sections
                .filter((_, i) => Object.keys(state.errors).some((path) => path.startsWith(`sections[${i}].`)))
                .map((section) => section.id)}
              onSelect={select}
              onPreview={preview}
              onMove={moveSection}
              // The panel then asks for a block to be selected.
              onRemove={(index) => {
                setSections(draft.sections.filter((_, i) => i !== index))
                setState((s) => ({ ...s, errors: {} }))
              }}
            />
          </div>
          <div className={'design-panel'}>{getPanel(draft.sections)}</div>
        </DesignLayout>
      </Space>
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_WEBSITE_PAGES}
      ContentHeader={
        <BackendPageContentTitle
          title={
            state.page ? translate('website-page-editing', { title: state.page.title }) : translate('website-pages')
          }
          controls={getControls()}
        />
      }
    >
      {isOn ? <Spin spinning={state.loading}>{getContent()}</Spin> : <InvalidAccessPanel />}
      {isOn ? getConfirmation() : null}
    </BackendPage>
  )
}

export default WebsitePageEditPage
