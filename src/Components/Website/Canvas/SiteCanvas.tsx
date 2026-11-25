import React, { useEffect, useState } from 'react'
import { Segmented } from 'antd'
import Alert from '../../Form/Alert'
import Button from '../../Form/Button'
import PopConfirm from '../../Form/Popconfirm'
import Space from '../../Form/Space'
import ICompany from '../../../Types/Company/ICompany'
import IWebsite, { IWebsiteSection } from '../../../Types/Website/IWebsite'
import WebsiteService from '../../../Services/WebsiteService'
import translate from '../../../i18n/translate'
import { BLOCKS, iImages } from './canvasBlocks'

// The page as the website shows it (specs/004-website-visual-editor, US2): the Reader's /website.css, the theme, the
// menu and the blocks, at three widths. A block is selected by click or keyboard; its toolbar moves or removes it.

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
const FONT_PAIRS = ['modern', 'classic', 'friendly']
const COLOR = /^#[0-9a-fA-F]{6}$/

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
  onSelect: (id: string) => void
  onMove: (index: number, by: number) => void
  onRemove: (index: number) => void
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
    <Space orientation={'vertical'} style={{ width: '100%' }}>
      <Segmented
        aria-label={translate('website-canvas-width')}
        value={width}
        onChange={(value) => setWidth(value as keyof typeof WIDTHS)}
        options={Object.keys(WIDTHS).map((value) => ({ value, label: translate(`website-canvas-${value}`) }))}
      />
      {!stylesUrl || stylesFailed ? (
        <Alert type={'warning'} role={'status'} title={translate('website-canvas-no-styles')} />
      ) : null}
      {css ? <style>{css}</style> : null}
      {/* A click on a map or video selects its block. */}
      <style>{'.site-canvas iframe { pointer-events: none; }'}</style>
      <div
        data-testid={'site-canvas'}
        className={'site-canvas'}
        // Paint containment keeps fixed-position content inside the canvas, off the editor's own buttons.
        style={{
          maxWidth: WIDTHS[width],
          margin: '0 auto',
          border: '1px solid #d9d9d9',
          background: '#fff',
          contain: 'paint',
        }}
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
                <div key={section.id} style={{ margin: '24px 0' }}>
                  {isSelected || hasProblem ? (
                    <Space wrap style={{ marginBottom: 4 }}>
                      {hasProblem ? (
                        <span className={'ant-form-item-explain-error'}>
                          {translate('website-canvas-has-problems')}
                        </span>
                      ) : null}
                      {isSelected ? (
                        <>
                          <Button
                            size={'small'}
                            aria-label={translate('website-move-up', { name })}
                            disabled={index === 0}
                            onClick={() => onMove(index, -1)}
                          >
                            ↑
                          </Button>
                          <Button
                            size={'small'}
                            aria-label={translate('website-move-down', { name })}
                            disabled={index === sections.length - 1}
                            onClick={() => onMove(index, 1)}
                          >
                            ↓
                          </Button>
                          <PopConfirm
                            title={translate('website-section-remove-confirm')}
                            okText={translate('website-remove')}
                            cancelText={translate('cancel')}
                            okButtonProps={{ danger: true }}
                            onConfirm={() => onRemove(index)}
                          >
                            <Button size={'small'} danger aria-label={translate('website-remove-named', { name })}>
                              {translate('website-remove')}
                            </Button>
                          </PopConfirm>
                        </>
                      ) : null}
                    </Space>
                  ) : null}
                  <div
                    role={'button'}
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={translate('website-canvas-edit', { name })}
                    onClick={() => onSelect(section.id)}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        onSelect(section.id)
                      }
                    }}
                    style={{
                      minHeight: 32,
                      cursor: 'pointer',
                      outline: `${isSelected ? 2 : 1}px ${isSelected || hasProblem ? 'solid' : 'dashed'} ${
                        hasProblem ? '#ff4d4f' : isSelected ? '#1677ff' : '#d9d9d9'
                      }`,
                      outlineOffset: 4,
                    }}
                  >
                    {Block ? <Block section={section} images={images} company={company} /> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Space>
  )
}

export default SiteCanvas
