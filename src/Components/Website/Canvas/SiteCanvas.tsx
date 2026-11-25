import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import Alert from '../../Form/Alert'
import Button from '../../Form/Button'
import PopConfirm from '../../Form/Popconfirm'
import Icons from '../../Icons'
import ICompany from '../../../Types/Company/ICompany'
import IWebsite, { IWebsiteSection } from '../../../Types/Website/IWebsite'
import WebsiteService from '../../../Services/WebsiteService'
import translate from '../../../i18n/translate'
import { BLOCKS, iImages } from './canvasBlocks'

// The page as the website shows it (specs/004-website-visual-editor, US2): the Reader's /website.css, the theme, the
// menu and the blocks, at three widths. Laid out as the MConnect form designer (mgg-ui DesignTab, SMN-85): a bar with
// the widths and Preview, a grey canvas, and on each block an outline and a corner toolbar to edit, move or remove it.

// Read once per address. It is fetched, not linked, so the admin's content policy needs no Reader address: fetching
// any https address and inline styles are already allowed.
const styles: { [url: string]: Promise<string> } = {}
export const loadSiteStyles = (url: string) => {
  styles[url] =
    styles[url] || fetch(url).then((resp) => (resp.ok ? resp.text() : Promise.reject(new Error(`${resp.status}`))))
  // A failure is tried again next time.
  styles[url].catch(() => delete styles[url])
  return styles[url]
}

export const WIDTHS = { desktop: '100%', tablet: '768px', phone: '375px' }
const WIDTH_ICONS = { desktop: Icons.DesktopOutlined, tablet: Icons.TabletOutlined, phone: Icons.MobileOutlined }
const FONT_PAIRS = ['modern', 'classic', 'friendly']
const COLOR = /^#[0-9a-fA-F]{6}$/

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
  /* A click on a map or video selects its block. */
  .site-canvas iframe {
    pointer-events: none;
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

type iSiteCanvas = {
  website?: IWebsite
  company?: ICompany
  pageTitles: string[]
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
  onRemove: (index: number) => void
  onPreview: () => void
  // Not while a save is in flight or the page is stale.
  canPreview: boolean
}

const SiteCanvas = ({
  website,
  company,
  pageTitles,
  currentIndex,
  sections,
  images,
  selectedId,
  problemIds,
  onSelect,
  onMove,
  onRemove,
  onPreview,
  canPreview,
}: iSiteCanvas) => {
  const [css, setCss] = useState<string | null>(null)
  const [width, setWidth] = useState<keyof typeof WIDTHS>('desktop')
  const [stylesFailed, setStylesFailed] = useState(false)
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

  const { primaryColor, fontPair } = website?.theme || {}
  const nameOf = (section: IWebsiteSection, index: number) =>
    `${index + 1}. ${translate(`website-section-type-${section.type}`)}`

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
                onClick={() => setWidth(key)}
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
            className={`site site-font-${FONT_PAIRS.includes(`${fontPair}`) ? fontPair : 'modern'}`}
            style={
              COLOR.test(`${primaryColor}`) ? ({ '--site-primary': primaryColor } as React.CSSProperties) : undefined
            }
          >
            <nav className={'site-nav'} aria-label={translate('website-pages')}>
              <a className={'site-name'} href={'#'}>
                {company?.LogoAsset?.url ? <img src={company.LogoAsset.url} alt={''} /> : null}
                <span>{company?.name}</span>
              </a>
              <ul>
                {pageTitles.map((title, index) => (
                  <li key={`${index}-${title}`}>
                    <a href={'#'} aria-current={index === currentIndex ? 'page' : undefined}>
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className={'site-page'}>
              {sections.map((section, index) => {
                const Block = BLOCKS[section.type]
                const name = nameOf(section, index)
                const isSelected = section.id === selectedId
                const hasProblem = problemIds.includes(section.id)
                return (
                  <div
                    key={section.id}
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
                        disabled={index === 0}
                        icon={<Icons.UpOutlined aria-hidden />}
                        onClick={() => onMove(index, -1)}
                      />
                      <Button
                        type={'primary'}
                        size={'small'}
                        aria-label={translate('website-move-down', { name })}
                        disabled={index === sections.length - 1}
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
                )
              })}
            </div>
          </div>
        </div>
      </Canvas>
    </div>
  )
}

export default SiteCanvas
