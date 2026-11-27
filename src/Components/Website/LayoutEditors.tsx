import React, { useState } from 'react'
import { Checkbox, Input, Radio, Select } from 'antd'
import Button from '../Form/Button'
import Space from '../Form/Space'
import MediaPicker from './MediaPicker'
import { checkSection, getImageIds, isLink, Thumbnail } from './SectionEditors'
import IAsset from '../../Types/Asset/IAsset'
import {
  CONTACT_ICONS,
  CONTENT_WIDTHS,
  FONT_PAIRS,
  FOOTER_ITEM_TYPES,
  IWebsiteFooterColumn,
  IWebsiteFooterItem,
  IWebsiteLayout,
  IWebsiteTheme,
  LAYOUT_LIMITS,
} from '../../Types/Website/IWebsite'
import translate from '../../i18n/translate'

// The editors of the Layout page (specs/004-website-visual-editor, slice 4a): header, footer and theme. Problems are
// keyed by the API's paths (layout.footer.columns[0].items[1].text), so the browser's and the API's show alike.
type iErrors = { [path: string]: string }
type iImages = { [assetId: string]: IAsset | null }

const idOf = (path: string) => `layout-${path.replace(/[^a-zA-Z0-9]+/g, '-')}`

const Problem = ({ path, errors }: { path: string; errors: iErrors }) =>
  errors[path] ? (
    <div id={`${idOf(path)}-error`} role={'alert'} className={'ant-form-item-explain-error'}>
      {errors[path]}
    </div>
  ) : null

type iText = {
  path: string
  label: string
  value?: string
  max: number
  multiLine?: boolean
  errors: iErrors
  onChange: (value: string) => void
}
const TextField = ({ path, label, value, max, multiLine, errors, onChange }: iText) => {
  const inputProps = {
    id: idOf(path),
    value: value || '',
    maxLength: max,
    status: errors[path] ? ('error' as const) : undefined,
    'aria-invalid': errors[path] ? true : undefined,
    'aria-describedby': errors[path] ? `${idOf(path)}-error` : undefined,
  }
  return (
    <div className={'website-section-field'}>
      <label htmlFor={inputProps.id}>{label}</label>
      {multiLine ? (
        <Input.TextArea {...inputProps} autoSize={{ minRows: 2 }} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input {...inputProps} onChange={(e) => onChange(e.target.value)} />
      )}
      <Problem path={path} errors={errors} />
    </div>
  )
}

// A bordered group for one link, column or item.
const Box = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div role={'group'} aria-label={label} style={{ border: '1px solid #dee2e6', borderRadius: 6, padding: 8 }}>
    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <Space orientation={'vertical'} style={{ width: '100%' }}>
      {children}
    </Space>
  </div>
)

const replaceAt = <T,>(list: T[], index: number, value: T) => list.map((item, i) => (i === index ? value : item))
const removeAt = <T,>(list: T[], index: number) => list.filter((_, i) => i !== index)

type iHeader = {
  header: NonNullable<IWebsiteLayout['header']>
  pages: { id: string; title: string }[]
  errors: iErrors
  onChange: (header: NonNullable<IWebsiteLayout['header']>) => void
}

export const HeaderEditor = ({ header, pages, errors, onChange }: iHeader) => {
  const links = header.links || []
  const hidden = header.hiddenPageIds || []
  const path = 'layout.header'
  return (
    <Space orientation={'vertical'} style={{ width: '100%' }} size={'large'}>
      <Space orientation={'vertical'}>
        {(['showLogo', 'showName'] as const).map((key) => (
          <Checkbox
            key={key}
            checked={header[key] !== false}
            onChange={(e) => onChange({ ...header, [key]: e.target.checked })}
          >
            {translate(`website-layout-${key === 'showLogo' ? 'show-logo' : 'show-name'}`)}
          </Checkbox>
        ))}
      </Space>
      <div role={'group'} aria-label={translate('website-layout-menu-pages')}>
        <div>{translate('website-layout-menu-pages')}</div>
        <Space orientation={'vertical'}>
          {pages.map((page) => (
            <Checkbox
              key={page.id}
              checked={!hidden.includes(page.id)}
              onChange={(e) =>
                onChange({
                  ...header,
                  hiddenPageIds: e.target.checked ? hidden.filter((id) => id !== page.id) : [...hidden, page.id],
                })
              }
            >
              {page.title}
            </Checkbox>
          ))}
        </Space>
        <Problem path={`${path}.hiddenPageIds`} errors={errors} />
      </div>
      <div>
        <div>{translate('website-layout-links')}</div>
        <Space orientation={'vertical'} style={{ width: '100%' }}>
          {links.map((link, index) => {
            const linkPath = `${path}.links[${index}]`
            const label = translate('website-layout-link', { number: index + 1 })
            return (
              <Box key={index} label={label}>
                <TextField
                  path={`${linkPath}.label`}
                  label={translate('website-layout-link-label')}
                  value={link.label}
                  max={LAYOUT_LIMITS.linkLabel}
                  errors={errors}
                  onChange={(value) =>
                    onChange({ ...header, links: replaceAt(links, index, { ...link, label: value }) })
                  }
                />
                <TextField
                  path={`${linkPath}.url`}
                  label={translate('website-layout-link-url')}
                  value={link.url}
                  max={2000}
                  errors={errors}
                  onChange={(value) => onChange({ ...header, links: replaceAt(links, index, { ...link, url: value }) })}
                />
                <Button danger onClick={() => onChange({ ...header, links: removeAt(links, index) })}>
                  {translate('website-layout-remove', { name: label })}
                </Button>
              </Box>
            )
          })}
          <Button
            disabled={links.length >= LAYOUT_LIMITS.links}
            onClick={() => onChange({ ...header, links: [...links, { label: '', url: '' }] })}
          >
            {translate('website-layout-link-add')}
          </Button>
        </Space>
      </div>
    </Space>
  )
}

const newItem = (type: (typeof FOOTER_ITEM_TYPES)[number]): IWebsiteFooterItem => {
  switch (type) {
    case 'contact':
      return { type, icon: 'address', text: '' }
    case 'button':
      return { type, label: '', url: '' }
    case 'image':
      return { type, assetId: '' }
    default:
      return { type: 'text', text: '' }
  }
}

type iFooter = {
  footer: IWebsiteLayout['footer']
  errors: iErrors
  images: iImages
  onImagesPicked: (assets: IAsset[]) => void
  onChange: (footer: IWebsiteLayout['footer']) => void
}

export const FooterEditor = ({ footer, errors, images, onImagesPicked, onChange }: iFooter) => {
  // The image item the picker is choosing for.
  const [picking, setPicking] = useState<{ column: number; item: number }>()
  const columns = footer?.columns || []
  const path = 'layout.footer'
  const setColumn = (index: number, column: IWebsiteFooterColumn) =>
    footer && onChange({ ...footer, columns: replaceAt(columns, index, column) })

  const itemFields = (item: IWebsiteFooterItem, itemPath: string, set: (item: IWebsiteFooterItem) => void) => {
    switch (item.type) {
      case 'text':
        return (
          <TextField
            path={`${itemPath}.text`}
            label={translate('website-layout-item-text')}
            value={item.text}
            max={LAYOUT_LIMITS.text}
            multiLine
            errors={errors}
            onChange={(text) => set({ ...item, text })}
          />
        )
      case 'contact':
        return (
          <>
            <div className={'website-section-field'}>
              <label htmlFor={idOf(`${itemPath}.icon`)}>{translate('website-layout-item-icon')}</label>
              <Select
                id={idOf(`${itemPath}.icon`)}
                value={item.icon}
                style={{ width: '100%' }}
                options={CONTACT_ICONS.map((icon) => ({
                  value: icon,
                  label: translate(`website-layout-icon-${icon}`),
                }))}
                onChange={(icon) => set({ ...item, icon })}
              />
              <Problem path={`${itemPath}.icon`} errors={errors} />
            </div>
            <TextField
              path={`${itemPath}.text`}
              label={translate('website-layout-item-text')}
              value={item.text}
              max={LAYOUT_LIMITS.contact}
              errors={errors}
              onChange={(text) => set({ ...item, text })}
            />
          </>
        )
      case 'button':
        return (
          <>
            <TextField
              path={`${itemPath}.label`}
              label={translate('website-layout-link-label')}
              value={item.label}
              max={LAYOUT_LIMITS.buttonLabel}
              errors={errors}
              onChange={(label) => set({ ...item, label })}
            />
            <TextField
              path={`${itemPath}.url`}
              label={translate('website-layout-link-url')}
              value={item.url}
              max={2000}
              errors={errors}
              onChange={(url) => set({ ...item, url })}
            />
          </>
        )
      case 'image':
        return (
          <>
            <div role={'group'} aria-label={translate('website-section-image')}>
              <Space wrap>
                {item.assetId ? (
                  <Thumbnail id={item.assetId} images={images} />
                ) : (
                  <span>{translate('website-image-none')}</span>
                )}
                <Button
                  onClick={() => {
                    const [column, index] = itemPath.match(/\d+/g)!.map(Number)
                    setPicking({ column, item: index })
                  }}
                >
                  {translate(item.assetId ? 'website-image-change' : 'website-image-choose')}
                </Button>
              </Space>
              <Problem path={`${itemPath}.assetId`} errors={errors} />
            </div>
            <TextField
              path={`${itemPath}.alt`}
              label={translate('website-layout-item-alt')}
              value={item.alt}
              max={LAYOUT_LIMITS.alt}
              errors={errors}
              onChange={(alt) => set({ ...item, alt })}
            />
            <TextField
              path={`${itemPath}.link`}
              label={translate('website-layout-item-link')}
              value={item.link}
              max={2000}
              errors={errors}
              onChange={(link) => set({ ...item, link })}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <Space orientation={'vertical'} style={{ width: '100%' }} size={'large'}>
      <Checkbox
        checked={!!footer}
        onChange={(e) => onChange(e.target.checked ? { columns: [{ items: [] }], copyright: '' } : null)}
      >
        {translate('website-layout-show-footer')}
      </Checkbox>
      {footer ? (
        <>
          {columns.map((column, index) => {
            const columnPath = `${path}.columns[${index}]`
            const items = column.items || []
            const columnLabel = translate('website-layout-column', { number: index + 1 })
            return (
              <Box key={index} label={columnLabel}>
                <TextField
                  path={`${columnPath}.heading`}
                  label={translate('website-layout-column-heading')}
                  value={column.heading}
                  max={LAYOUT_LIMITS.heading}
                  errors={errors}
                  onChange={(heading) => setColumn(index, { ...column, heading })}
                />
                {items.map((item, itemIndex) => {
                  const itemPath = `${columnPath}.items[${itemIndex}]`
                  const itemLabel = `${itemIndex + 1}. ${translate(`website-layout-item-type-${item.type}`)}`
                  const set = (changed: IWebsiteFooterItem) =>
                    setColumn(index, { ...column, items: replaceAt(items, itemIndex, changed) })
                  return (
                    <Box key={itemIndex} label={itemLabel}>
                      {itemFields(item, itemPath, set)}
                      <Button danger onClick={() => setColumn(index, { ...column, items: removeAt(items, itemIndex) })}>
                        {translate('website-layout-remove', { name: itemLabel })}
                      </Button>
                    </Box>
                  )
                })}
                <Problem path={`${columnPath}.items`} errors={errors} />
                <Space wrap>
                  {FOOTER_ITEM_TYPES.map((type) => (
                    <Button
                      key={type}
                      size={'small'}
                      disabled={items.length >= LAYOUT_LIMITS.items}
                      aria-label={translate('website-layout-item-add-to', {
                        type: translate(`website-layout-item-type-${type}`),
                        column: columnLabel,
                      })}
                      onClick={() => setColumn(index, { ...column, items: [...items, newItem(type)] })}
                    >
                      + {translate(`website-layout-item-type-${type}`)}
                    </Button>
                  ))}
                </Space>
                <Button danger onClick={() => onChange({ ...footer, columns: removeAt(columns, index) })}>
                  {translate('website-layout-remove', { name: columnLabel })}
                </Button>
              </Box>
            )
          })}
          <Button
            disabled={columns.length >= LAYOUT_LIMITS.columns}
            onClick={() => onChange({ ...footer, columns: [...columns, { items: [] }] })}
          >
            {translate('website-layout-column-add')}
          </Button>
          <TextField
            path={`${path}.copyright`}
            label={translate('website-layout-copyright')}
            value={footer.copyright}
            max={LAYOUT_LIMITS.copyright}
            errors={errors}
            onChange={(copyright) => onChange({ ...footer, copyright })}
          />
          <MediaPicker
            open={picking !== undefined}
            onCancel={() => setPicking(undefined)}
            onPick={(assets) => {
              const target = picking
              setPicking(undefined)
              if (!target || assets.length === 0) return
              onImagesPicked(assets)
              const column = columns[target.column]
              const item = column.items[target.item]
              setColumn(target.column, {
                ...column,
                items: replaceAt(column.items, target.item, {
                  ...item,
                  assetId: `${assets[0].id}`,
                } as IWebsiteFooterItem),
              })
            }}
          />
        </>
      ) : null}
    </Space>
  )
}

const THEME_COLORS = [
  ['primaryColor', '#1a73e8'],
  ['backgroundColor', '#ffffff'],
  ['headingColor', '#222222'],
  // The buttons' colours (specs/005-website-blocks); the site picks dark or white text for each. With no button
  // colour the first button has the main colour.
  ['buttonColor', undefined],
  ['secondaryColor', '#6c757d'],
] as const

type iTheme = { theme: IWebsiteTheme; errors: iErrors; onChange: (theme: IWebsiteTheme) => void }

export const ThemeEditor = ({ theme, errors, onChange }: iTheme) => (
  <Space orientation={'vertical'} style={{ width: '100%' }} size={'large'}>
    {THEME_COLORS.map(([key, fallback]) => (
      <div key={key} className={'website-section-field'}>
        <label htmlFor={idOf(`theme.${key}`)}>{translate(`website-theme-${key}`)}</label>
        <div>
          <input
            id={idOf(`theme.${key}`)}
            type={'color'}
            value={theme[key] || fallback || theme.primaryColor || '#1a73e8'}
            onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
          />
          {/* A button colour set can be dropped, so the first button follows the main colour again (spec 005). */}
          {key === 'buttonColor' && theme.buttonColor ? (
            <Button
              type={'link'}
              size={'small'}
              onClick={() => {
                const next = { ...theme }
                delete next.buttonColor
                onChange(next)
              }}
            >
              {translate('website-theme-button-reset')}
            </Button>
          ) : null}
        </div>
        <Problem path={`theme.${key}`} errors={errors} />
      </div>
    ))}
    <div role={'radiogroup'} aria-label={translate('website-theme-font')}>
      <div>{translate('website-theme-font')}</div>
      <Radio.Group
        value={theme.fontPair || 'modern'}
        onChange={(e) => onChange({ ...theme, fontPair: e.target.value })}
      >
        {FONT_PAIRS.map((pair) => (
          <Radio key={pair} value={pair}>
            {translate(`website-theme-font-${pair}`)}
          </Radio>
        ))}
      </Radio.Group>
    </div>
    <div role={'radiogroup'} aria-label={translate('website-theme-width')}>
      <div>{translate('website-theme-width')}</div>
      <Radio.Group
        value={theme.contentWidth || 960}
        onChange={(e) => onChange({ ...theme, contentWidth: e.target.value })}
      >
        {CONTENT_WIDTHS.map((width) => (
          <Radio key={width} value={width}>
            {`${width} px`}
          </Radio>
        ))}
      </Radio.Group>
      <Problem path={'theme.contentWidth'} errors={errors} />
    </div>
  </Space>
)

// The layout as sent: empty optional fields left out, as the API refuses an empty link.
export const toLayoutPayload = (layout: IWebsiteLayout): IWebsiteLayout => ({
  ...layout,
  ...(layout.footer
    ? {
        footer: {
          ...layout.footer,
          columns: layout.footer.columns.map((column) => ({
            ...column,
            items: column.items.map((item) => {
              if (item.type !== 'image') return item
              const { link, alt, ...rest } = item
              return { ...rest, ...(alt ? { alt } : {}), ...(link ? { link } : {}) }
            }),
          })),
        },
      }
    : {}),
})

// The checks the browser can make before saving; the API checks everything again.
export const checkLayout = (layout: IWebsiteLayout): iErrors => {
  const errors: iErrors = {}
  const required = (path: string, value?: string) => {
    if (!value || value.trim() === '') errors[path] = translate('website-layout-required')
  }
  const link = (path: string, value?: string, isOptional = false) => {
    if (isOptional && !value) return
    if (!value || !isLink(value)) errors[path] = translate('website-section-bad-link')
  }
  ;(layout.header?.links || []).forEach((item, index) => {
    required(`layout.header.links[${index}].label`, item.label)
    link(`layout.header.links[${index}].url`, item.url)
  })
  ;(layout.footer?.columns || []).forEach((column, index) =>
    column.items.forEach((item, itemIndex) => {
      const path = `layout.footer.columns[${index}].items[${itemIndex}]`
      if (item.type === 'text' || item.type === 'contact') required(`${path}.text`, item.text)
      if (item.type === 'button') {
        required(`${path}.label`, item.label)
        link(`${path}.url`, item.url)
      }
      if (item.type === 'image') {
        if (!item.assetId) errors[`${path}.assetId`] = translate('website-section-image-required')
        link(`${path}.link`, item.link, true)
      }
    }),
  )
  ;(['sharedAbove', 'sharedBelow'] as const).forEach((key) =>
    (layout[key] || []).forEach((section, index) =>
      Object.entries(checkSection(section)).forEach(([field, problem]) => {
        errors[`layout.${key}[${index}].${field}`] = problem
      }),
    ),
  )
  return errors
}

// Every image id the layout uses.
export const getLayoutImageIds = (layout?: IWebsiteLayout | null) => [
  ...(layout?.footer?.columns || []).flatMap((column) =>
    column.items.flatMap((item) => (item.type === 'image' && item.assetId ? [item.assetId] : [])),
  ),
  ...getImageIds([...(layout?.sharedAbove || []), ...(layout?.sharedBelow || [])]),
]
