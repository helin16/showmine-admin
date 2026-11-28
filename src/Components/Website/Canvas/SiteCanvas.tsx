import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Alert from '../../Form/Alert'
import Button from '../../Form/Button'
import PopConfirm from '../../Form/Popconfirm'
import Icons from '../../Icons'
import ICompany from '../../../Types/Company/ICompany'
import IWebsite, { IWebsiteSection } from '../../../Types/Website/IWebsite'
import WebsiteService from '../../../Services/WebsiteService'
import translate from '../../../i18n/translate'
import { BLOCKS, Footer, getThemeStyle, iImages } from './canvasBlocks'
import getRows from './getRows'

// The page as the website shows it (specs/004-website-visual-editor, US2): the Reader's /website.css, the theme, the
// menu and the blocks, at three widths. Laid out as the MConnect form designer (mgg-ui DesignTab, SMN-85): a bar with
// the widths and Preview, a grey canvas, and on each block an outline and a corner toolbar to edit, move or remove it.

// Read once per address. It is fetched, not linked, so the admin's content policy needs no Reader address: fetching
// any https address and inline styles are already allowed.
const styles: { [url: string]: Promise<string> } = {}
export const loadSiteStyles = (url: string) => {
  styles[url] =
    styles[url] ||
    fetch(url)
      .then((resp) => (resp.ok ? resp.text() : Promise.reject(new Error(`${resp.status}`))))
      // Files the styles name from the site's root (the airy style's font, SMN-93) come from the Reader, not the admin.
      .then((text) => text.replace(/url\(\//g, `url(${new URL(url).origin}/`))
  // A failure is tried again next time.
  styles[url].catch(() => delete styles[url])
  return styles[url]
}

export const WIDTHS = { desktop: '100%', tablet: '768px', phone: '375px' }
const WIDTH_ICONS = { desktop: Icons.DesktopOutlined, tablet: Icons.TabletOutlined, phone: Icons.MobileOutlined }
const FONT_PAIRS = ['modern', 'classic', 'friendly']
// Bootstrap Icons "list" (MIT), as the Reader's menu button (SMN-86).
const LIST_ICON =
  'M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5'

// Above the canvas: the widths in the middle, Preview on the right.
const Toolbar = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  border: 1px solid #dee2e6;
  border-bottom: 0;
  border-radius: 6px 6px 0 0;
  background: #fff;
  .canvas-bar-button {
    border: 0;
    border-radius: 0;
    padding: 0.6rem 1rem;
    background: transparent;
    color: #495057;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
  }
  .canvas-devices {
    display: flex;
    border-left: 1px solid #dee2e6;
    border-right: 1px solid #dee2e6;
  }
  .canvas-devices .canvas-bar-button[aria-pressed='true'] {
    background: #e9ecef;
    color: #212529;
  }
  .canvas-bar-end {
    text-align: right;
  }
  .canvas-bar-end .canvas-bar-button {
    border-left: 1px solid #dee2e6;
    height: 100%;
  }
`

// The grey canvas around the page, and the outlines and tools on its blocks.
const Canvas = styled.div`
  background: #f0f2f5;
  padding: 1.5rem 1rem;
  min-height: 300px;
  border-radius: 0 0 6px 6px;
  .site-canvas {
    margin: 0 auto;
    transition: max-width 0.2s;
    background: #fff;
    /* Paint containment keeps fixed-position content inside the canvas, off the editor's own buttons. */
    contain: paint;
    padding-top: 1.2rem;
  }
  /* The open menu pushes the page down instead of covering it, so paint containment cannot cut it off. */
  .site-canvas .site-nav.is-open ul {
    position: static;
    box-shadow: none;
  }
  /* A click on a map or video selects its block. */
  .site-canvas iframe {
    pointer-events: none;
  }
  /* On the Layout page the header and footer are picked like blocks. */
  .canvas-part {
    cursor: pointer;
    outline: 1px dashed transparent;
    outline-offset: -2px;
    &:hover {
      outline-color: #91caff;
    }
    &.is-selected {
      outline: 2px solid #1677ff;
    }
  }
  .canvas-sample {
    margin: 24px 0;
  }
  .canvas-sample-note {
    display: inline-block;
    margin-bottom: 4px;
    padding: 0 6px;
    border-radius: 4px;
    background: #f0f2f5;
    color: #6c757d;
    font:
      12px/20px system-ui,
      sans-serif;
  }
  .canvas-item {
    position: relative;
    margin: 24px 0;
    min-height: 32px;
    cursor: pointer;
    outline: 1px dashed transparent;
    outline-offset: 4px;
    &:hover {
      outline-color: #91caff;
    }
    &.is-selected {
      outline: 2px solid #1677ff;
    }
    &.has-problem {
      outline: 2px solid #ff4d4f;
    }
  }
  .canvas-problem {
    position: absolute;
    top: -1.1rem;
    left: 0;
    z-index: 2;
    font-size: 12px;
  }
  .canvas-tools {
    position: absolute;
    top: -1.1rem;
    right: 0;
    z-index: 2;
    display: flex;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    .ant-btn {
      height: 22px;
      padding: 0 6px;
    }
  }
  .canvas-item:hover > .canvas-tools,
  .canvas-item.is-selected > .canvas-tools,
  .canvas-tools:focus-within {
    opacity: 1;
    pointer-events: auto;
  }
`

export type iCanvasPart = 'header' | 'footer'
type iSiteCanvas = {
  // Its theme and layout are drawn: the Layout page passes its unsaved ones.
  website?: IWebsite
  company?: ICompany
  // Every page, in order, with the title as typed; the layout's hidden pages are left out of the menu.
  pages: { id?: string; title: string }[]
  // The page being edited, by position; its title as typed.
  currentIndex: number
  sections: IWebsiteSection[]
  images: iImages
  selectedId?: string
  // Section ids with a problem to fix.
  problemIds: string[]
  // A block's id, or nothing when the grey canvas around the page is clicked.
  onSelect: (id?: string) => void
  onMove: (index: number, by: number) => void
  // Whether a block may move; by default, within the list. The Layout page also moves one past the sample page.
  canMove?: (index: number, by: number) => boolean
  onRemove: (index: number) => void
  onPreview: () => void
  // Not while a save is in flight or the page is stale.
  canPreview: boolean
  // Blocks shown, not edited, before the editable block at `at` (or after the last): the layout's shared blocks in
  // the page editor, the sample page on the Layout page. A note says why they cannot be edited here.
  fixedBlocks?: { at: number; sections: IWebsiteSection[]; note?: string }[]
  // The Layout page: the header and footer are picked.
  selectedPart?: iCanvasPart
  onSelectPart?: (part: iCanvasPart) => void
}

const SiteCanvas = ({
  website,
  company,
  pages,
  currentIndex,
  sections,
  images,
  selectedId,
  problemIds,
  onSelect,
  onMove,
  canMove = (index: number, by: number) => index + by >= 0 && index + by < sections.length,
  onRemove,
  onPreview,
  canPreview,
  fixedBlocks = [],
  selectedPart,
  onSelectPart,
}: iSiteCanvas) => {
  const [css, setCss] = useState<string | null>(null)
  const [width, setWidth] = useState<keyof typeof WIDTHS>('desktop')
  const [stylesFailed, setStylesFailed] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  // Focus goes back to the button, not to the page, when the links fold away.
  const closeMenu = () => {
    setIsMenuOpen(false)
    menuButton.current?.focus()
  }
  const stylesUrl = WebsiteService.getReaderUrl('/website.css')

  useEffect(() => {
    if (!stylesUrl) return
    let isCurrent = true
    loadSiteStyles(stylesUrl)
      .then((text) => isCurrent && setCss(text))
      .catch(() => isCurrent && setStylesFailed(true))
    return () => {
      isCurrent = false
    }
  }, [stylesUrl])

  const { fontPair, style } = website?.theme || {}
  const header = website?.layout?.header || {}
  const hidden = header.hiddenPageIds || []
  // As the Reader: with no logo shown, the name always is, so the home link is never empty.
  const showsLogo = header.showLogo !== false && !!company?.LogoAsset?.url
  const showsName = header.showName !== false || !showsLogo
  const partClass = (part: iCanvasPart) =>
    onSelectPart ? `canvas-part${selectedPart === part ? ' is-selected' : ''}` : ''
  const nameOf = (section: IWebsiteSection, index: number) =>
    `${index + 1}. ${translate(`website-section-type-${section.type}`)}`
  const getFixed = (at: number) =>
    fixedBlocks
      .filter((group) => group.at === at && group.sections.length > 0)
      .map((group, groupIndex) => (
        <div key={`fixed-${at}-${groupIndex}`} className={'canvas-sample'}>
          {group.note ? <span className={'canvas-sample-note'}>{group.note}</span> : null}
          {group.sections.map((section) => {
            const Block = BLOCKS[section.type]
            return Block ? <Block key={section.id} section={section} images={images} company={company} /> : null
          })}
        </div>
      ))

  return (
    <div>
      {!stylesUrl || stylesFailed ? (
        <Alert
          type={'warning'}
          role={'status'}
          title={translate('website-canvas-no-styles')}
          style={{ marginBottom: 8 }}
        />
      ) : null}
      {css ? <style>{css}</style> : null}
      <Toolbar>
        <div />
        <div className={'canvas-devices'} role={'group'} aria-label={translate('website-canvas-width')}>
          {(Object.keys(WIDTHS) as (keyof typeof WIDTHS)[]).map((key) => {
            const Icon = WIDTH_ICONS[key]
            const label = translate(`website-canvas-${key}`)
            return (
              <button
                key={key}
                type={'button'}
                className={'canvas-bar-button'}
                aria-label={label}
                title={label}
                aria-pressed={width === key}
                onClick={() => {
                  setWidth(key)
                  setIsMenuOpen(false)
                }}
              >
                <Icon aria-hidden />
              </button>
            )
          })}
        </div>
        <div className={'canvas-bar-end'}>
          <button
            type={'button'}
            className={'canvas-bar-button'}
            aria-label={translate('website-preview')}
            title={translate('website-preview')}
            disabled={!canPreview}
            onClick={onPreview}
          >
            <Icons.EyeOutlined aria-hidden />
          </button>
        </div>
      </Toolbar>
      {/* Clicking the canvas outside a block unselects it. */}
      <Canvas onClick={() => onSelect(undefined)}>
        <div
          data-testid={'site-canvas'}
          className={'site-canvas'}
          style={{ maxWidth: WIDTHS[width] }}
          // Canvas links go nowhere: the admin stays on the editor.
          onClickCapture={(e) => (e.target as HTMLElement).closest('a') && e.preventDefault()}
        >
          <div
            className={`site site-font-${FONT_PAIRS.includes(`${fontPair}`) ? fontPair : 'modern'}${
              style === 'airy' ? ' site-style-airy' : ''
            }`}
            style={getThemeStyle(website?.theme || {})}
          >
            {/* As the Reader's Nav: below 1024 px of canvas width /website.css folds the links behind the button. */}
            <nav
              className={`site-nav${isMenuOpen ? ' is-open' : ''} ${partClass('header')}`.trim()}
              aria-label={translate('website-pages')}
              onKeyDown={(e) => isMenuOpen && e.key === 'Escape' && closeMenu()}
              // The menu is not a block: using it keeps the selected block. On the Layout page it picks the header.
              onClick={(e) => {
                e.stopPropagation()
                onSelectPart?.('header')
              }}
            >
              <a className={'site-name'} href={'#'} aria-label={showsName ? undefined : company?.name}>
                {showsLogo ? <img src={company?.LogoAsset?.url} alt={''} /> : null}
                {showsName ? <span>{company?.name}</span> : null}
              </a>
              <button
                ref={menuButton}
                type={'button'}
                className={'site-menu-button'}
                aria-expanded={isMenuOpen}
                aria-controls={'site-menu'}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? 'Close' : 'Menu'}
                {isMenuOpen ? (
                  <span aria-hidden>×</span>
                ) : (
                  <svg aria-hidden viewBox={'0 0 16 16'} fill={'currentColor'}>
                    <path fillRule={'evenodd'} d={LIST_ICON} />
                  </svg>
                )}
              </button>
              <ul id={'site-menu'}>
                {pages.map(({ id, title }, index) =>
                  id && hidden.includes(id) ? null : (
                    <li key={`${index}-${title}`}>
                      <a href={'#'} aria-current={index === currentIndex ? 'page' : undefined} onClick={closeMenu}>
                        {title}
                      </a>
                    </li>
                  ),
                )}
                {(header.links || []).map((link, index) =>
                  link.label ? (
                    <li key={`link-${index}`}>
                      <a href={'#'} onClick={closeMenu}>
                        {link.label}
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            </nav>
            <div className={'site-page'}>
              {getRows(sections).map((row) => {
                const items = row.map((index) => {
                  const section = sections[index]
                  const Block = BLOCKS[section.type]
                  const name = nameOf(section, index)
                  const isSelected = section.id === selectedId
                  const hasProblem = problemIds.includes(section.id)
                  return (
                    <React.Fragment key={section.id}>
                      {index === row[1] ? null : getFixed(index)}
                      <div
                        data-testid={`canvas-item-${section.id}`}
                        className={`canvas-item${isSelected ? ' is-selected' : ''}${hasProblem ? ' has-problem' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(section.id)
                        }}
                      >
                        {hasProblem ? (
                          <span className={'canvas-problem ant-form-item-explain-error'}>
                            {translate('website-canvas-has-problems')}
                          </span>
                        ) : null}
                        {/* The keyboard way in: the tools show while one of them has focus. */}
                        <div className={'canvas-tools'} onClick={(e) => e.stopPropagation()}>
                          <Button
                            type={'primary'}
                            size={'small'}
                            aria-label={translate('website-canvas-edit', { name })}
                            aria-pressed={isSelected}
                            icon={<Icons.EditOutlined aria-hidden />}
                            onClick={() => onSelect(section.id)}
                          />
                          <Button
                            type={'primary'}
                            size={'small'}
                            aria-label={translate('website-move-up', { name })}
                            disabled={!canMove(index, -1)}
                            icon={<Icons.UpOutlined aria-hidden />}
                            onClick={() => onMove(index, -1)}
                          />
                          <Button
                            type={'primary'}
                            size={'small'}
                            aria-label={translate('website-move-down', { name })}
                            disabled={!canMove(index, 1)}
                            icon={<Icons.DownOutlined aria-hidden />}
                            onClick={() => onMove(index, 1)}
                          />
                          <PopConfirm
                            title={translate('website-section-remove-confirm')}
                            okText={translate('website-remove')}
                            cancelText={translate('cancel')}
                            okButtonProps={{ danger: true }}
                            onConfirm={() => onRemove(index)}
                          >
                            <Button
                              type={'primary'}
                              danger
                              size={'small'}
                              aria-label={translate('website-remove-named', { name })}
                              icon={<Icons.DeleteOutlined aria-hidden />}
                            />
                          </PopConfirm>
                        </div>
                        {Block ? <Block section={section} images={images} company={company} /> : null}
                      </div>
                    </React.Fragment>
                  )
                })
                return row.length === 2 ? (
                  <React.Fragment key={sections[row[0]].id}>
                    {getFixed(row[1])}
                    <div className={'site-row'}>{items}</div>
                  </React.Fragment>
                ) : (
                  items[0]
                )
              })}
              {getFixed(sections.length)}
            </div>
            <div
              className={partClass('footer')}
              onClick={(e) => {
                if (!onSelectPart) return
                e.stopPropagation()
                onSelectPart('footer')
              }}
            >
              <Footer layout={website?.layout} images={images} />
            </div>
          </div>
        </div>
      </Canvas>
    </div>
  )
}

export default SiteCanvas
