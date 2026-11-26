import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { RootState } from '../../Redux/makeReduxStore'
import { MENU_KEY_WEBSITE_LAYOUT } from '../../Components/Menu/MenuItems'
import BackendPage from '../../Layouts/BackendPage'
import BackendPageContentTitle from '../../Layouts/BackendPageContentTitle'
import InvalidAccessPanel from '../../Components/Error/InvalidAccessPanel'
import Alert from '../../Components/Form/Alert'
import Button from '../../Components/Form/Button'
import Space from '../../Components/Form/Space'
import Spin from '../../Components/Form/Spin'
import message from '../../Components/Form/message'
import PublishBar from '../../Components/Website/PublishBar'
import SiteCanvas, { iCanvasPart } from '../../Components/Website/Canvas/SiteCanvas'
import SectionEditor, { getImageIds, newSection } from '../../Components/Website/SectionEditors'
import BlockPalette from '../../Components/Website/Canvas/BlockPalette'
import { Radio } from 'antd'
import Icons from '../../Components/Icons'
import { BoxTitleDiv } from '../../Styles/AppWrapper'
import {
  checkLayout,
  FooterEditor,
  getLayoutImageIds,
  HeaderEditor,
  ThemeEditor,
  toLayoutPayload,
} from '../../Components/Website/LayoutEditors'
import IAsset from '../../Types/Asset/IAsset'
import IWebsite, {
  IFieldError,
  IWebsiteLayout,
  IWebsitePage,
  IWebsiteSection,
  IWebsiteTheme,
  LAYOUT_LIMITS,
} from '../../Types/Website/IWebsite'
import WebsiteService from '../../Services/WebsiteService'
import Utils from '../../Services/Utils'
import translate from '../../i18n/translate'

// The site layout (specs/004-website-visual-editor, US4, slices 4a and 4b): the header, footer, theme and shared
// blocks every page shows, edited on the canvas with the first page as a sample. Admins only; members see it in the
// page editor.
type iDraft = { theme: IWebsiteTheme; layout: IWebsiteLayout }
type iTab = 'header' | 'footer' | 'theme' | 'blocks'
type iState = {
  loading: boolean
  website?: IWebsite
  pages: IWebsitePage[]
  draft?: iDraft
  loadError?: string
  // Problems by the API's path: layout.header.links[0].url, theme.headingColor.
  errors: { [path: string]: string }
  saving: boolean
  isStale: boolean
  images: { [assetId: string]: IAsset | null }
  count: number
  // The shared block being edited.
  selectedId?: string
}
const initState: iState = { loading: false, pages: [], errors: {}, saving: false, isStale: false, images: {}, count: 0 }

const toDraft = (website: IWebsite): iDraft => ({
  theme: website.theme || {},
  layout: {
    header: website.layout?.header || {},
    footer: website.layout?.footer ?? null,
    sharedAbove: website.layout?.sharedAbove || [],
    sharedBelow: website.layout?.sharedBelow || [],
  },
})
const isSame = (a?: iDraft, b?: iDraft) => JSON.stringify(a) === JSON.stringify(b)
// The tab a problem's field is on.
const tabOf = (path: string): iTab =>
  path.startsWith('layout.footer')
    ? 'footer'
    : path.startsWith('theme')
      ? 'theme'
      : path.startsWith('layout.shared')
        ? 'blocks'
        : 'header'

// The canvas edits the shared blocks as one list, above ones first; `split` is how many are above the sample page.
const getShared = (layout: IWebsiteLayout) => ({
  shared: [...(layout.sharedAbove || []), ...(layout.sharedBelow || [])],
  split: (layout.sharedAbove || []).length,
})
const toLists = (shared: IWebsiteSection[], split: number) => ({
  sharedAbove: shared.slice(0, split),
  sharedBelow: shared.slice(split),
})
// The API's path of a block in the one list: layout.sharedAbove[1] or layout.sharedBelow[0].
const pathOf = (index: number, split: number) =>
  index < split ? `layout.sharedAbove[${index}]` : `layout.sharedBelow[${index - split}]`

// The canvas and the panel side by side, as the page editor; the panel goes under the canvas below 992px.
const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  .layout-canvas {
    min-width: 0;
  }
  .layout-panel {
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: #f8f9fa;
    padding: 12px;
  }
  @media (min-width: 992px) {
    flex-direction: row;
    align-items: flex-start;
    .layout-canvas {
      flex: 1 1 0;
    }
    .layout-panel {
      flex: 0 0 380px;
      position: sticky;
      top: 0;
      max-height: 100vh;
      overflow-y: auto;
    }
  }
`

const WebsiteLayoutPage = () => {
  const { company } = useSelector((s: RootState) => s.auth)
  const isOn = company?.websiteBuilderEnabled === true
  const [state, setState] = useState(initState)
  const [tab, setTab] = useState<iTab>('header')
  const [addTo, setAddTo] = useState<'above' | 'below'>('below')
  const companyIdRef = useRef(company?.id)
  companyIdRef.current = company?.id
  const isDirty = !!state.website && !!state.draft && !isSame(state.draft, toDraft(state.website))

  useEffect(() => {
    if (!isOn) return
    let isCurrent = true
    setState((s) => ({ ...s, loading: true, loadError: undefined, isStale: false, errors: {} }))
    Promise.all([WebsiteService.get(), WebsiteService.getPages()])
      .then(([website, pages]) => {
        if (!isCurrent) return
        const sorted = [...pages].sort((a, b) => a.position - b.position)
        setState((s) => ({ ...s, website, pages: sorted, draft: toDraft(website) }))
        const ids = Array.from(
          new Set([...getLayoutImageIds(website.layout), ...getImageIds(sorted[0]?.sections || [])]),
        )
        if (ids.length > 0) {
          // Thumbnails only: a failure leaves them loading, and saving still works.
          WebsiteService.getImages(1, ids)
            .then(({ data }) => {
              if (!isCurrent) return
              const found = Object.fromEntries(data.map((asset) => [`${asset.id}`, asset]))
              setState((s) => ({
                ...s,
                images: { ...s.images, ...Object.fromEntries(ids.map((id) => [id, found[id] ?? null])) },
              }))
            })
            .catch(() => undefined)
        }
      })
      .catch((err) => isCurrent && setState((s) => ({ ...s, draft: undefined, loadError: Utils.getErrorMessage(err) })))
      .finally(() => isCurrent && setState((s) => ({ ...s, loading: false })))
    return () => {
      isCurrent = false
    }
  }, [isOn, company?.id, state.count])

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
  // Problems are kept by position: after an edit they could mark the wrong field. The next save finds them again.
  const setDraft = (changes: Partial<iDraft>) =>
    setState((s) => (s.draft ? { ...s, errors: {}, draft: { ...s.draft, ...changes } } : s))
  const setLayout = (changes: Partial<IWebsiteLayout>) =>
    setState((s) =>
      s.draft ? { ...s, errors: {}, draft: { ...s.draft, layout: { ...s.draft.layout, ...changes } } } : s,
    )
  const addImages = (assets: IAsset[]) =>
    setState((s) => ({
      ...s,
      images: { ...s.images, ...Object.fromEntries(assets.map((asset) => [`${asset.id}`, asset])) },
    }))
  const select = (selectedId?: string) => {
    setState((s) => ({ ...s, selectedId }))
    if (selectedId) setTab('blocks')
  }
  // A problem in a shared block selects that block, so its field is seen.
  const showProblems = (errors: { [path: string]: string }, layout: IWebsiteLayout) => {
    const { shared, split } = getShared(layout)
    const withProblem = shared.find((_, i) =>
      Object.keys(errors).some((path) => path.startsWith(`${pathOf(i, split)}.`)),
    )
    const [first] = Object.keys(errors)
    const firstTab = first ? tabOf(first) : tab
    // Only when the Blocks tab opens, so the canvas does not mark a block while another tab shows.
    setState((s) => ({ ...s, errors, selectedId: firstTab === 'blocks' ? withProblem?.id : undefined }))
    setTab(firstTab)
    message.error(translate('website-layout-has-problems'))
  }
  const setShared = (shared: IWebsiteSection[], split: number) => setLayout(toLists(shared, split))
  // Added at the end of its place (above: just before the sample page), and selected.
  const addBlock = (type: string) => {
    if (!state.draft) return
    const { shared, split } = getShared(state.draft.layout)
    const section = newSection(type)
    const at = addTo === 'above' ? split : shared.length
    setShared([...shared.slice(0, at), section, ...shared.slice(at)], addTo === 'above' ? split + 1 : split)
    select(section.id)
  }
  // Moving the last block above down, or the first below up, takes it past the sample page.
  const moveBlock = (index: number, by: number) => {
    if (!state.draft) return
    const { shared, split } = getShared(state.draft.layout)
    if (by === 1 && index === split - 1) return setShared(shared, split - 1)
    if (by === -1 && index === split) return setShared(shared, split + 1)
    const moved = [...shared]
    const [section] = moved.splice(index, 1)
    moved.splice(index + by, 0, section)
    setShared(moved, split)
  }
  const removeBlock = (index: number) => {
    if (!state.draft) return
    const { shared, split } = getShared(state.draft.layout)
    setShared(
      shared.filter((_, i) => i !== index),
      index < split ? split - 1 : split,
    )
  }

  const save = () => {
    const { draft, website } = state
    if (!draft || !website) return
    const errors = checkLayout(draft.layout)
    if (Object.keys(errors).length > 0) {
      showProblems(errors, draft.layout)
      return
    }
    const companyId = company?.id
    const isSameCompany = () => companyIdRef.current === companyId
    setState((s) => ({ ...s, saving: true, errors: {} }))
    WebsiteService.update({ theme: draft.theme, layout: toLayoutPayload(draft.layout), updatedAt: website.updatedAt })
      .then((saved) => {
        if (!isSameCompany()) return
        // Typing that went on during the save is kept: the saved layout replaces the draft only if it is unchanged.
        setState((s) => ({ ...s, website: saved, draft: isSame(s.draft, draft) ? toDraft(saved) : s.draft }))
        message.success(translate('website-saved'))
      })
      .catch((err) => {
        if (!isSameCompany()) return
        const { status, data } = err?.response || {}
        const fieldErrors = Object.fromEntries(((data?.errors || []) as IFieldError[]).map((e) => [e.path, e.message]))
        if (Object.keys(fieldErrors).length > 0) {
          showProblems(fieldErrors, draft.layout)
        } else if (status === 409) {
          // Another admin saved first: their change is kept, and this one waits for a reload.
          setState((s) => ({ ...s, isStale: true }))
        } else {
          message.error(Utils.getErrorMessage(err))
        }
      })
      .finally(() => setState((s) => ({ ...s, saving: false })))
  }

  // The saved site, in a new tab opened while the click counts, so the browser does not block it.
  const preview = async () => {
    const opened = window.open('', '_blank')
    if (opened) opened.opener = null
    try {
      const { url } = await WebsiteService.getPreviewUrl()
      if (opened) opened.location.href = url
    } catch (err) {
      opened?.close()
      message.error(Utils.getErrorMessage(err))
    }
  }

  const getPanel = (draft: iDraft) => {
    const tabs = [
      { key: 'header', label: translate('website-layout-header') },
      { key: 'footer', label: translate('website-layout-footer') },
      { key: 'theme', label: translate('website-layout-theme') },
      { key: 'blocks', label: translate('website-layout-blocks') },
    ] as const
    return (
      <div className={'layout-panel'}>
        <div role={'group'} aria-label={translate('website-panel-tabs')} style={{ marginBottom: 12 }}>
          <Space wrap>
            {tabs.map(({ key, label }) => (
              <Button
                key={key}
                type={tab === key ? 'primary' : 'default'}
                aria-pressed={tab === key}
                onClick={() => {
                  setTab(key)
                  setState((s) => ({ ...s, selectedId: undefined }))
                }}
              >
                {label}
              </Button>
            ))}
          </Space>
        </div>
        <div role={'region'} aria-label={translate('website-panel')}>
          {tab === 'header' ? (
            <HeaderEditor
              header={draft.layout.header || {}}
              pages={state.pages.map((page) => ({ id: `${page.id}`, title: page.title }))}
              errors={state.errors}
              onChange={(header) => setLayout({ header })}
            />
          ) : null}
          {tab === 'footer' ? (
            <FooterEditor
              footer={draft.layout.footer}
              errors={state.errors}
              images={state.images}
              onImagesPicked={addImages}
              onChange={(footer) => setLayout({ footer })}
            />
          ) : null}
          {tab === 'theme' ? (
            <ThemeEditor theme={draft.theme} errors={state.errors} onChange={(theme) => setDraft({ theme })} />
          ) : null}
          {tab === 'blocks' ? getBlocksPanel(draft.layout) : null}
        </div>
      </div>
    )
  }

  // The selected shared block's fields with Back, as the page editor; else where new blocks go and the blocks to add.
  const getBlocksPanel = (layout: IWebsiteLayout) => {
    const { shared, split } = getShared(layout)
    // Problems about the shared blocks as a whole, or a block's type or id, which have no field of their own.
    const general = Object.entries(state.errors).filter(
      ([path]) =>
        /^layout\.shared(Above|Below)?$/.test(path) || /^layout\.shared(Above|Below)\[\d+\]\.(type|id)$/.test(path),
    )
    const generalAlert =
      general.length > 0 ? (
        <Alert type={'error'} style={{ marginBottom: 8 }} message={general.map(([, problem]) => problem).join(' ')} />
      ) : null
    const index = shared.findIndex((section) => section.id === state.selectedId)
    const section = shared[index]
    if (section) {
      const prefix = `${pathOf(index, split)}.`
      const errors = Object.fromEntries(
        Object.entries(state.errors)
          .filter(([path]) => path.startsWith(prefix))
          .map(([path, problem]) => [path.slice(prefix.length), problem]),
      )
      return (
        <>
          <Button type={'link'} size={'small'} style={{ paddingLeft: 0 }} onClick={() => select(undefined)}>
            <Icons.ArrowLeftOutlined aria-hidden /> {translate('website-panel-back')}
          </Button>
          {generalAlert}
          <BoxTitleDiv>
            {`${translate(index < split ? 'website-layout-above' : 'website-layout-below')}: ${translate(
              `website-section-type-${section.type}`,
            )}`}
          </BoxTitleDiv>
          <SectionEditor
            key={section.id}
            section={section}
            errors={errors}
            images={state.images}
            onImagesPicked={addImages}
            onChange={(changed) =>
              setShared(
                shared.map((s) => (s.id === section.id ? changed : s)),
                split,
              )
            }
          />
        </>
      )
    }
    const isFull = shared.length >= LAYOUT_LIMITS.shared
    return (
      <>
        <p style={{ color: '#6c757d' }}>{translate('website-layout-blocks-hint')}</p>
        {generalAlert}
        <div style={{ marginBottom: 8 }}>
          <span id={'layout-add-to'}>{translate('website-layout-add-to')}</span>{' '}
          <Radio.Group
            aria-labelledby={'layout-add-to'}
            value={addTo}
            onChange={(e) => setAddTo(e.target.value)}
            options={[
              { value: 'above', label: translate('website-layout-above') },
              { value: 'below', label: translate('website-layout-below') },
            ]}
          />
        </div>
        <BlockPalette isFull={isFull} onAdd={addBlock} />
        <small style={{ display: 'block', marginTop: 8, color: '#6c757d' }}>
          {isFull
            ? translate('website-layout-blocks-full', { max: LAYOUT_LIMITS.shared })
            : translate('website-layout-blocks-count', { count: shared.length, max: LAYOUT_LIMITS.shared })}
        </small>
      </>
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
    const { draft, website } = state
    if (!draft || !website) return null
    const sample = state.pages[0]
    const { shared, split } = getShared(draft.layout)
    return (
      <Space orientation={'vertical'} style={{ width: '100%' }}>
        {state.isStale ? (
          <Alert
            type={'warning'}
            message={translate('website-stale')}
            action={<Button onClick={reload}>{translate('website-reload')}</Button>}
          />
        ) : null}
        <Alert type={'info'} message={translate('website-layout-note')} />
        <Layout>
          <div className={'layout-canvas'}>
            <SiteCanvas
              website={{ ...website, theme: draft.theme, layout: draft.layout }}
              company={company ?? undefined}
              pages={state.pages.map((page) => ({ id: `${page.id}`, title: page.title }))}
              currentIndex={0}
              // The shared blocks are edited here; the first page is shown between them as a sample.
              sections={shared}
              fixedBlocks={[
                {
                  at: split,
                  sections: sample?.sections || [],
                  note: sample ? translate('website-layout-sample', { page: sample.title }) : undefined,
                },
              ]}
              images={state.images}
              selectedId={state.selectedId}
              problemIds={shared
                .filter((_, i) => Object.keys(state.errors).some((path) => path.startsWith(`${pathOf(i, split)}.`)))
                .map((section) => section.id)}
              selectedPart={tab === 'header' || tab === 'footer' ? tab : undefined}
              onSelectPart={(part: iCanvasPart) => {
                setTab(part)
                setState((s) => ({ ...s, selectedId: undefined }))
              }}
              onSelect={select}
              onMove={moveBlock}
              canMove={(index, by) =>
                (by === -1 && index === split) ||
                (by === 1 && index === split - 1) ||
                (index + by >= 0 && index + by < shared.length)
              }
              onRemove={removeBlock}
              onPreview={preview}
              // The preview shows what is saved.
              canPreview={!isDirty && !state.saving}
            />
          </div>
          {getPanel(draft)}
        </Layout>
      </Space>
    )
  }

  const getControls = () => {
    const { website } = state
    if (!website || !state.draft) return null
    return (
      <Space wrap align={'start'}>
        {isDirty ? <span>{translate('website-page-unsaved')}</span> : null}
        <Button onClick={save} loading={state.saving} disabled={!isDirty || state.isStale}>
          {translate('website-save')}
        </Button>
        <PublishBar
          website={website}
          hasUnsavedChanges={isDirty}
          canUnpublish={false}
          onChanged={(changed) => setState((s) => ({ ...s, website: changed }))}
          onStale={reload}
        />
      </Space>
    )
  }

  return (
    <BackendPage
      selectedMenu={MENU_KEY_WEBSITE_LAYOUT}
      ContentHeader={<BackendPageContentTitle title={translate('website-layout')} controls={getControls()} />}
    >
      {isOn ? <Spin spinning={state.loading}>{getContent()}</Spin> : <InvalidAccessPanel />}
    </BackendPage>
  )
}

export default WebsiteLayoutPage
