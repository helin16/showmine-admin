import React, { useMemo } from 'react'
import DOMPurify from 'dompurify'
import IAsset from '../../../Types/Asset/IAsset'
import ICompany from '../../../Types/Company/ICompany'
import {
  BASES,
  IWebsiteFooterItem,
  IWebsiteLayout,
  IWebsiteSection,
  IWebsiteTheme,
  ROW_OPTIONS,
} from '../../../Types/Website/IWebsite'
import { isLink } from '../SectionEditors'
import translate from '../../../i18n/translate'

// The blocks as the Reader draws them (specs/004-website-visual-editor, research R2): markup and class names copied
// from showmine-reader src/components/Website (sections/index.tsx, Nav.tsx, Site.tsx), styled by its /website.css.
// ponytail: two copies of the markup; tests in both repositories pin the class names. A shared package if they drift.

export type iImages = { [assetId: string]: IAsset | null }
type iBlock = {
  section: IWebsiteSection
  images: iImages
  company?: ICompany
  // The page editor's selection, for the blocks inside a row (they are picked on the canvas like page blocks).
  selectedId?: string
  onSelect?: (id: string) => void
  problemIds?: string[]
}

// The hosts the API keeps frames from (showmine-api HtmlSanitizer).
const FRAME_HOSTS = ['player.bilibili.com', 'v.qq.com', 'www.youtube.com']
// The canvas's own instance, so its hook touches no other use of DOMPurify.
const purify = DOMPurify(window)
purify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName !== 'iframe') return
  let host = ''
  try {
    const url = new URL((node as Element).getAttribute('src') || '')
    host = url.protocol === 'https:' ? url.hostname : ''
  } catch {
    // Not a full address: dropped.
  }
  if (!FRAME_HOSTS.includes(host)) node.parentNode?.removeChild(node)
})

// Unsaved text, not yet cleaned by the API, shown inside the signed-in admin (research R2a): cleaned here first.
// As the API's allow-list, tighter where it is safe; the canvas also stops link clicks.
export const cleanHtml = (html: string) =>
  purify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder'],
    // No ids or names: they would become globals of the admin page (DOM clobbering).
    FORBID_ATTR: ['id', 'name'],
    FORBID_TAGS: ['form', 'input', 'button', 'textarea', 'select', 'style'],
    // Web, email and phone links, and relative ones; no other scheme, and no //host.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|(?![a-z][a-z0-9+.-]*:|\/\/))/i,
  })

const urlOf = (images: iImages, assetId: unknown) =>
  typeof assetId === 'string' ? images[assetId]?.url || undefined : undefined

// A band's buttons (reader sections/index.tsx Buttons, spec 005): a button shows with both its text and link.
const Buttons = ({ section }: iBlock) => {
  const hasFirst = !!(section.buttonUrl && section.buttonText)
  const hasSecond = !!(section.button2Url && section.button2Text)
  if (!hasFirst && !hasSecond && !section.note) return null
  return (
    <div className={'site-buttons'}>
      {/* Canvas links go nowhere. */}
      {hasFirst ? (
        <a className={'site-button'} href={'#'}>
          {`${section.buttonText}`}
        </a>
      ) : null}
      {hasSecond ? (
        <a className={'site-button second'} href={'#'}>
          {`${section.button2Text}`}
        </a>
      ) : null}
      {section.note ? <p className={'site-note'}>{`${section.note}`}</p> : null}
    </div>
  )
}

const Hero = ({ section, images }: iBlock) => {
  const imageUrl = urlOf(images, section.imageAssetId)
  return (
    <section
      className={`site-hero${imageUrl ? ' with-image' : ''}${section.fullWidth === true ? ' site-full' : ''}${section.darkText === true ? ' dark-text' : ''}`}
      style={imageUrl ? { backgroundImage: `url("${encodeURI(imageUrl)}")` } : undefined}
    >
      {section.heading ? <h1>{`${section.heading}`}</h1> : null}
      {section.subheading ? <p>{`${section.subheading}`}</p> : null}
      <Buttons section={section} images={images} />
    </section>
  )
}

// Image beside text (reader sections/index.tsx Split, spec 005).
const Split = ({ section, images }: iBlock) => {
  const imageUrl = urlOf(images, section.imageAssetId)
  return (
    <section className={`site-split image-${section.imageSide === 'right' ? 'right' : 'left'}`}>
      {imageUrl ? <img src={imageUrl} alt={`${section.imageAlt || ''}`} /> : null}
      <div className={'site-split-text'}>
        {section.heading ? <h2>{`${section.heading}`}</h2> : null}
        {section.text ? <p>{`${section.text}`}</p> : null}
        <Buttons section={section} images={images} />
      </div>
    </section>
  )
}

// Card grid (reader sections/index.tsx Cards, spec 005 slice 88b). Canvas links go nowhere.
const Cards = ({ section, images }: iBlock) => {
  const columns = ['2', '3', '4'].includes(`${section.columns}`) ? `${section.columns}` : '3'
  const items = (Array.isArray(section.items) ? section.items : []) as {
    imageAssetId?: string
    title?: string
    text?: string
    link?: string
  }[]
  return (
    <section className={`site-cards columns-${columns}${section.boxed === true ? ' boxed' : ''}`}>
      {section.heading ? <h2>{`${section.heading}`}</h2> : null}
      {section.intro ? <p className={'site-cards-intro'}>{`${section.intro}`}</p> : null}
      <ul>
        {items.map((item, index) => {
          const imageUrl = urlOf(images, item?.imageAssetId)
          const card = (
            <>
              {imageUrl ? <img src={imageUrl} alt={''} /> : null}
              <div>
                {item?.title ? <h3>{`${item.title}`}</h3> : null}
                {item?.text ? <p>{`${item.text}`}</p> : null}
              </div>
            </>
          )
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li key={index}>
              {item?.link ? (
                <a className={'site-card'} href={'#'}>
                  {card}
                </a>
              ) : (
                <div className={'site-card'}>{card}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Pricing plans (reader sections/index.tsx Pricing, spec 005 slice 88c). Canvas links go nowhere.
const Pricing = ({ section }: iBlock) => {
  const plans = (Array.isArray(section.plans) ? section.plans : []) as {
    name?: string
    price?: string
    period?: string
    features?: unknown
    buttonText?: string
    buttonUrl?: string
    highlight?: boolean
  }[]
  return (
    <section className={'site-pricing'}>
      {section.heading ? <h2>{`${section.heading}`}</h2> : null}
      {section.intro ? <p className={'site-cards-intro'}>{`${section.intro}`}</p> : null}
      <ul>
        {plans.map((plan, index) => {
          const features = Array.isArray(plan?.features)
            ? (plan.features as unknown[]).filter((line): line is string => typeof line === 'string' && !!line.trim())
            : []
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li key={index} className={`site-plan${plan?.highlight === true ? ' highlight' : ''}`}>
              {plan?.name ? <h3>{`${plan.name}`}</h3> : null}
              <p className={'site-price'}>
                <strong>{`${plan?.price ?? ''}`}</strong>
                {plan?.period ? <span> {`${plan.period}`}</span> : null}
              </p>
              {features.length > 0 ? (
                <ul>
                  {features.map((line, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              ) : null}
              {plan?.buttonUrl && plan?.buttonText ? (
                <a className={'site-button'} href={'#'}>
                  {`${plan.buttonText}`}
                </a>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// A map on its own (reader sections/index.tsx MapBlock, spec 005 slice 88c).
const MapBlock = ({ section }: iBlock) =>
  /^https:\/\//.test(`${section.mapUrl || ''}`) ? (
    <section
      className={`site-map-block ${['small', 'medium', 'large'].includes(`${section.height}`) ? section.height : 'medium'}${section.fullWidth === true ? ' site-full' : ''}`}
    >
      <iframe
        className={'site-map'}
        src={`${section.mapUrl}`}
        title={'Map'}
        loading={'lazy'}
        sandbox={'allow-scripts allow-same-origin'}
        referrerPolicy={'no-referrer'}
      />
    </section>
  ) : null

// Message form (reader MessageForm.tsx, specs/006): the same markup, its fields disabled; nothing is sent here.
const FORM_FIELDS = [
  ['firstName', 'First name 名'],
  ['lastName', 'Last name 姓'],
  ['email', 'Email 邮箱'],
  ['message', 'Message 留言'],
] as const
const MessageForm = ({ section }: iBlock) => (
  <section className={'site-form'}>
    {section.heading ? <h2>{`${section.heading}`}</h2> : null}
    {section.intro ? <p className={'site-cards-intro'}>{`${section.intro}`}</p> : null}
    <form onSubmit={(e) => e.preventDefault()}>
      {FORM_FIELDS.map(([name, label]) => (
        <div key={name} className={`site-form-field ${name}`}>
          <label>{label}</label>
          {name === 'message' ? <textarea rows={5} disabled /> : <input type={'text'} disabled />}
        </div>
      ))}
      <button className={'site-button'} type={'button'} disabled>
        {`${section.buttonText || 'Send'}`}
      </button>
    </form>
  </section>
)

// Cleaned again only when its text changes, so typing in another block stays quick (SC-003).
const Text = ({ section }: iBlock) => {
  const html = `${section.html || ''}`
  const clean = useMemo(() => cleanHtml(html), [html])
  return <section className={'site-text'} dangerouslySetInnerHTML={{ __html: clean }} />
}

const Image = ({ section, images }: iBlock) => {
  const url = urlOf(images, section.assetId)
  return url ? (
    // The Reader sets its margin as a child of .site-page; here the block's frame has it.
    <figure className={'site-image'} style={{ margin: 0 }}>
      <img src={url} alt={`${section.alt || ''}`} />
      {section.caption ? <figcaption>{`${section.caption}`}</figcaption> : null}
    </figure>
  ) : null
}

const Gallery = ({ section, images }: iBlock) => (
  <section className={'site-gallery'}>
    {((section.images as { assetId: string; alt?: string }[]) || [])
      .map((image) => ({ ...image, url: urlOf(images, image.assetId) }))
      .filter((image) => image.url)
      .map((image, index) => (
        <img key={`${image.assetId}-${index}`} src={image.url} alt={image.alt || ''} />
      ))}
  </section>
)

const Contact = ({ section, company }: iBlock) => {
  const phone = company?.contactNumber
  const email = company?.email
  const address = company?.address
  return (
    <section className={'site-contact'}>
      <h2>Contact 联系我们</h2>
      <ul>
        {section.showPhone && phone ? (
          <li>
            <a href={'#'}>{phone}</a>
          </li>
        ) : null}
        {section.showEmail && email ? (
          <li>
            <a href={'#'}>{email}</a>
          </li>
        ) : null}
        {section.showAddress && address ? <li>{address}</li> : null}
      </ul>
      {/^https:\/\//.test(`${section.mapUrl || ''}`) ? (
        <iframe
          className={'site-map'}
          src={`${section.mapUrl}`}
          title={'Map'}
          loading={'lazy'}
          sandbox={'allow-scripts allow-same-origin'}
          referrerPolicy={'no-referrer'}
        />
      ) : null}
    </section>
  )
}

// Buttons on their own (reader sections/index.tsx ButtonsBlock, SMN-96).
const ButtonsBlock = (props: iBlock) => (
  <section className={'site-buttons-block'}>
    <Buttons {...props} />
  </section>
)

// A small card (reader sections/index.tsx Tile, SMN-96); a link makes the whole card a link. Canvas links go nowhere.
const Tile = ({ section, images }: iBlock) => {
  const imageUrl = urlOf(images, section.imageAssetId)
  const body = (
    <>
      {imageUrl ? <img className={'site-tile-icon'} src={imageUrl} alt={`${section.imageAlt || ''}`} /> : null}
      <div className={'site-tile-body'}>
        {section.title ? <h3 className={'site-tile-title'}>{`${section.title}`}</h3> : null}
        {section.text ? <p className={'site-tile-text'}>{`${section.text}`}</p> : null}
      </div>
    </>
  )
  return typeof section.link === 'string' && isLink(section.link) ? (
    <a className={'site-tile'} href={'#'}>
      {body}
    </a>
  ) : (
    <section className={'site-tile'}>{body}</section>
  )
}

// A row (reader sections/index.tsx Row, SMN-96): its blocks drawn through the same map, so a row can hold a row.
// Values outside the lists fall back to the defaults, as the Reader's. A block inside is picked by clicking it.
const pick = (value: unknown, allowed: readonly string[], fallback: string) =>
  allowed.includes(`${value}`) ? `${value}` : fallback
const Row = (props: iBlock) => {
  const { section, selectedId, onSelect, problemIds = [] } = props
  const blocks = Array.isArray(section.blocks) ? (section.blocks as IWebsiteSection[]) : []
  const { width, padding, direction, justify, align, gap } = ROW_OPTIONS
  const hasBackground = /^#[0-9a-fA-F]{6}$/.test(`${section.background}`)
  return (
    <section
      className={`site-flex site-flex-${pick(section.width, width.values, width.fallback)} site-pad-${pick(section.padding, padding.values, padding.fallback)}`}
      style={hasBackground ? ({ '--flex-bg': `${section.background}` } as React.CSSProperties) : undefined}
    >
      <div
        className={`site-flex-inner site-dir-${pick(section.direction, direction.values, direction.fallback)} site-justify-${pick(section.justify, justify.values, justify.fallback)} site-align-${pick(section.align, align.values, align.fallback)} site-gap-${pick(section.gap, gap.values, gap.fallback)}${section.wrap === false ? ' site-nowrap' : ''}`}
      >
        {blocks.map((block) => {
          const Block = BLOCKS[block.type]
          if (!Block) return null
          const basis =
            BASES.includes(`${block.basis}`) && block.basis !== 'auto'
              ? ` site-basis-${`${block.basis}`.replace('/', '-')}`
              : ''
          // The canvas's own classes and click, on the item the Reader has; none where nothing is selectable.
          const canvasClasses = onSelect
            ? ` canvas-child${block.id === selectedId ? ' is-selected' : ''}${problemIds.includes(block.id) ? ' has-problem' : ''}`
            : ''
          return (
            <div
              key={block.id}
              data-testid={onSelect ? `canvas-item-${block.id}` : undefined}
              className={`site-flex-item${basis}${canvasClasses}`}
              onClick={
                onSelect
                  ? (e) => {
                      e.stopPropagation()
                      onSelect(block.id)
                    }
                  : undefined
              }
            >
              <Block {...props} section={block} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

// The Reader lists the latest articles when the page is shown; the canvas says where they go.
const Articles = ({ section }: iBlock) => (
  <section className={`site-articles${section.layout === 'featured' ? ' featured' : ''}`}>
    <p>{translate('website-canvas-articles', { count: Number(section.count) || 3 })}</p>
  </section>
)

// The Reader's theme variables (reader:src/components/Website/Site.tsx getThemeStyle): only values the API allows.
const COLOR = /^#[0-9a-fA-F]{6}$/
const COLOR_VARS = {
  primaryColor: '--site-primary',
  backgroundColor: '--site-bg',
  headingColor: '--site-heading',
  secondaryColor: '--site-secondary',
  buttonColor: '--site-button',
} as const
// A button's text colour (reader Site.tsx getTextColor): white when its contrast is 3 or more, else dark.
export const getTextColor = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return 1.05 / (luminance + 0.05) >= 3 ? '#ffffff' : '#212529'
}
export const getThemeStyle = (theme: IWebsiteTheme = {}) => {
  const style: { [name: string]: string } = {}
  ;(Object.keys(COLOR_VARS) as (keyof typeof COLOR_VARS)[]).forEach((key) => {
    if (COLOR.test(`${theme[key]}`)) style[COLOR_VARS[key]] = `${theme[key]}`
  })
  if (style['--site-button']) style['--site-button-text'] = getTextColor(style['--site-button'])
  if (style['--site-secondary']) style['--site-secondary-text'] = getTextColor(style['--site-secondary'])
  if ([960, 1140, 1280].includes(Number(theme.contentWidth))) style['--site-width'] = `${theme.contentWidth}px`
  return Object.keys(style).length > 0 ? (style as React.CSSProperties) : undefined
}

// The Reader's footer icons (reader:src/components/Website/Footer.tsx), copied: tests in both pin the names.
export const FOOTER_ICONS: { [icon: string]: string[] } = {
  address: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z', 'M14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z'],
  phone: ['M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', 'M11 18h2'],
  email: ['M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', 'm3 7 9 6 9-6'],
  wechat: [
    'M9 4C5.1 4 2 6.5 2 9.6c0 1.8 1 3.3 2.6 4.3L4 16l2.6-1.3c.8.2 1.6.3 2.4.3',
    'M15.5 9c3.6 0 6.5 2.3 6.5 5.2 0 1.5-.8 2.9-2.1 3.8l.6 2-2.3-1.1c-.9.3-1.8.4-2.7.4-3.6 0-6.5-2.3-6.5-5.1S11.9 9 15.5 9Z',
  ],
  message: ['M4 5h16v11H9l-5 4V5Z'],
}

const FooterItem = ({ item, images }: { item: IWebsiteFooterItem; images: iImages }) => {
  switch (item.type) {
    case 'text':
      return <p className={'site-footer-text'}>{item.text}</p>
    case 'contact':
      return (
        <p className={'site-footer-contact'}>
          {FOOTER_ICONS[item.icon] ? (
            <svg aria-hidden viewBox={'0 0 24 24'}>
              {FOOTER_ICONS[item.icon].map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
          ) : null}
          <span>{item.text}</span>
        </p>
      )
    case 'button':
      return item.label ? (
        <p>
          <a className={'site-button'} href={'#'}>
            {item.label}
          </a>
        </p>
      ) : null
    case 'image': {
      const url = urlOf(images, item.assetId)
      if (!url) return null
      const image = <img src={url} alt={item.alt || ''} />
      return <p className={'site-footer-image'}>{item.link ? <a href={'#'}>{image}</a> : image}</p>
    }
    default:
      return null
  }
}

// The layout's footer, as the Reader's Footer draws it; none without one.
export const Footer = ({ layout, images }: { layout?: IWebsiteLayout | null; images: iImages }) => {
  const footer = layout?.footer
  if (!footer) return null
  return (
    <footer className={'site-footer'}>
      <div className={'site-footer-columns'}>
        {(footer.columns || []).map((column, index) => (
          <div key={index} className={'site-footer-column'}>
            {column.heading ? <h2>{column.heading}</h2> : null}
            {(column.items || []).map((item, itemIndex) => (
              <FooterItem key={itemIndex} item={item} images={images} />
            ))}
          </div>
        ))}
      </div>
      {footer.copyright ? <p className={'site-copyright'}>{footer.copyright}</p> : null}
    </footer>
  )
}

export const BLOCKS: { [type: string]: (props: iBlock) => React.ReactElement | null } = {
  hero: Hero,
  split: Split,
  cards: Cards,
  pricing: Pricing,
  map: MapBlock,
  form: MessageForm,
  text: Text,
  image: Image,
  gallery: Gallery,
  contact: Contact,
  articles: Articles,
  row: Row,
  buttons: ButtonsBlock,
  tile: Tile,
}
