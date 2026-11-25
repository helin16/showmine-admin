import React from 'react'
import DOMPurify from 'dompurify'
import IAsset from '../../../Types/Asset/IAsset'
import ICompany from '../../../Types/Company/ICompany'
import { IWebsiteSection } from '../../../Types/Website/IWebsite'
import translate from '../../../i18n/translate'

// The blocks as the Reader draws them (specs/004-website-visual-editor, research R2): markup and class names copied
// from showmine-reader src/components/Website (sections/index.tsx, Nav.tsx, Site.tsx), styled by its /website.css.
// ponytail: two copies of the markup; tests in both repositories pin the class names. A shared package if they drift.

export type iImages = { [assetId: string]: IAsset | null }
type iBlock = { section: IWebsiteSection; images: iImages; company?: ICompany }

// The hosts the API keeps frames from (showmine-api HtmlSanitizer).
const FRAME_HOSTS = ['player.bilibili.com', 'v.qq.com', 'www.youtube.com']
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
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
// No ids (as the API), links only to web, email, phone or a page of the site; the canvas also stops link clicks.
export const cleanHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder'],
    FORBID_ATTR: ['id'],
    FORBID_TAGS: ['form', 'input', 'button', 'textarea', 'select', 'style'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/(?!\/)|#)/i,
  })

const urlOf = (images: iImages, assetId: unknown) =>
  typeof assetId === 'string' ? images[assetId]?.url || undefined : undefined

const Hero = ({ section, images }: iBlock) => {
  const imageUrl = urlOf(images, section.imageAssetId)
  return (
    <section
      className={`site-hero${imageUrl ? ' with-image' : ''}`}
      style={imageUrl ? { backgroundImage: `url("${encodeURI(imageUrl)}")` } : undefined}
    >
      {section.heading ? <h1>{`${section.heading}`}</h1> : null}
      {section.subheading ? <p>{`${section.subheading}`}</p> : null}
      {/* No address: canvas links go nowhere. */}
      {section.buttonUrl && section.buttonText ? <a className={'site-button'}>{`${section.buttonText}`}</a> : null}
    </section>
  )
}

const Text = ({ section }: iBlock) => (
  <section className={'site-text'} dangerouslySetInnerHTML={{ __html: cleanHtml(`${section.html || ''}`) }} />
)

const Image = ({ section, images }: iBlock) => {
  const url = urlOf(images, section.assetId)
  return url ? (
    <figure className={'site-image'}>
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
            <a>{phone}</a>
          </li>
        ) : null}
        {section.showEmail && email ? (
          <li>
            <a>{email}</a>
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

// The Reader lists the latest articles when the page is shown; the canvas says where they go.
const Articles = ({ section }: iBlock) => (
  <section className={'site-articles'}>
    <p>{translate('website-canvas-articles', { count: Number(section.count) || 3 })}</p>
  </section>
)

export const BLOCKS: { [type: string]: (props: iBlock) => React.ReactElement | null } = {
  hero: Hero,
  text: Text,
  image: Image,
  gallery: Gallery,
  contact: Contact,
  articles: Articles,
}
