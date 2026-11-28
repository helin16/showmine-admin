import IBaseModel from '../IBaseModel'

// Search and sharing details of the site or a page; an empty one falls back to the site's, then the company's.
export type IWebsiteSeo = { title?: string; description?: string; imageAssetId?: string | null }

// Colours, fonts and width (specs/001; slice 4a of specs/004 adds all but the main colour and fonts).
export type IWebsiteTheme = {
  primaryColor?: string
  fontPair?: string
  backgroundColor?: string
  headingColor?: string
  secondaryColor?: string
  // The first button's colour (specs/005, slice 88b); absent, the main colour.
  buttonColor?: string
  contentWidth?: number
  // plain (absent) or airy, the look of showmine.com.au (SMN-93).
  style?: string
}
export const CONTENT_WIDTHS = [960, 1140, 1280]
export const FONT_PAIRS = ['modern', 'classic', 'friendly']
export const THEME_STYLES = ['plain', 'airy']

// The site layout as the API checks it (specs/004 data-model). Plain text only.
export type IWebsiteFooterItem =
  | { type: 'text'; text: string }
  | { type: 'contact'; icon: string; text: string }
  | { type: 'button'; label: string; url: string }
  // link: where the image leads.
  | { type: 'image'; assetId: string; alt?: string; link?: string }
export type IWebsiteFooterColumn = { heading?: string; items: IWebsiteFooterItem[] }
export type IWebsiteLayout = {
  header?: {
    showLogo?: boolean
    showName?: boolean
    hiddenPageIds?: string[]
    links?: { label: string; url: string }[]
  }
  footer?: { columns: IWebsiteFooterColumn[]; copyright?: string } | null
  // Shared blocks above and below every page's own (slice 4b): page sections, at most LAYOUT_LIMITS.shared in all.
  sharedAbove?: IWebsiteSection[]
  sharedBelow?: IWebsiteSection[]
}
// The API's limits on the layout.
export const LAYOUT_LIMITS = {
  shared: 10,
  links: 4,
  columns: 4,
  items: 8,
  linkLabel: 40,
  heading: 60,
  text: 500,
  contact: 100,
  buttonLabel: 40,
  alt: 120,
  copyright: 200,
}
export const FOOTER_ITEM_TYPES = ['text', 'contact', 'button', 'image'] as const
export const CONTACT_ICONS = ['address', 'phone', 'email', 'wechat', 'message']

// A company's website as GET /website returns it (specs/001-website-builder, data-model "Website").
type IWebsite = IBaseModel & {
  companyId: string
  // Made from the name and a code made once (SMN-81).
  slug: string
  name?: string | null
  addressCode?: string | null
  // Where it is, to show: its ShowMine subdomain and its Reader address; null when not configured.
  addresses?: { subdomain: string | null; reader: string | null }
  theme?: IWebsiteTheme | null
  // Header and footer (specs/004-website-visual-editor, slice 4a); null: the site shows as before.
  layout?: IWebsiteLayout | null
  seo?: IWebsiteSeo | null
  publishedAt?: string | null
  hasUnpublishedChanges: boolean
  // Recorded and checked only; nothing serves them yet (US6).
  subdomain?: string | null
  subdomainStatus?: 'none' | 'pending' | 'live'
  customDomain?: string | null
  customDomainStatus?: 'none' | 'pending' | 'verified' | 'failed'
}

// The same SEO always looks the same, so an emptied field or another key order is not taken for a change. All three
// keys are sent, as the API keeps a key that is left out.
export const toSeo = (seo?: IWebsiteSeo | null): IWebsiteSeo => ({
  title: seo?.title || '',
  description: seo?.description || '',
  imageAssetId: seo?.imageAssetId || null,
})

// The API's limits on SEO text.
export const SEO_TITLE_MAX = 70
export const SEO_DESCRIPTION_MAX = 160

// The API's rule for a custom domain: a lower-case host name such as www.example.com; an international one in
// punycode (xn--...). The API also refuses ShowMine's own domain.
export const CUSTOM_DOMAIN_PATTERN =
  /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59}[a-z0-9])$/
export const CUSTOM_DOMAIN_STATUSES = ['pending', 'verified', 'failed'] as const

// The website's name, from which its address is made (SMN-81).
export const WEBSITE_NAME_MAX = 80

// A template from GET /website/templates (specs/001-website-builder, US4).
export type IWebsiteTemplate = {
  id: string
  version: number
  name: { en: string; zh: string }
  description: { en: string; zh: string }
  thumbnail: string
}

// A section of a page (data-model "Section"): an id made by the client, its type and that type's fields.
export type IWebsiteSection = { id: string; type: string; [field: string]: unknown }

// Row blocks (spec 010, contract SMN-96): the choices the API accepts; the first of each is not always the default.
export const ROW_OPTIONS = {
  width: { values: ['boxed', 'full'], fallback: 'boxed' },
  padding: { values: ['none', 'small', 'medium', 'large'], fallback: 'medium' },
  direction: { values: ['row', 'column'], fallback: 'row' },
  justify: { values: ['start', 'center', 'end', 'space-between', 'space-around'], fallback: 'start' },
  align: { values: ['start', 'center', 'end', 'stretch'], fallback: 'stretch' },
  gap: { values: ['none', 'small', 'medium', 'large'], fallback: 'medium' },
} as const
// A block inside a row may take a share of the row's width; auto (or absent) takes none.
export const BASES = ['auto', '1/4', '1/3', '2/5', '1/2', '3/5', '2/3', '3/4', 'full']
// The API's limit on the blocks of one row; the page's limit counts nested blocks too.
export const MAX_ROW_BLOCKS = 12

// A page of the draft, as GET /website/pages and POST /website/initialise give it.
export type IWebsitePage = IBaseModel & {
  slug: string
  title: string
  position: number
  sections?: IWebsiteSection[] | null
  seo?: IWebsiteSeo | null
  hasUnpublishedChanges: boolean
}

// A page's address name, as the API checks it.
export const PAGE_SLUG_PATTERN = /^[a-z0-9-]{1,40}$/

// One problem that stops a publish or a save: `path` names the field, e.g. pages[about].sections[2].heading.
export type IFieldError = { path: string; message: string }

// Where a website image is used (GET /website/images/usage, and a refused delete's usedBy).
export type IImageUse = { pageId?: string; pageTitle?: string; published: boolean }

export default IWebsite

// GET /website/pageViews (US7): days with no views are left out.
export type IWebsitePageViews = {
  from: string
  to: string
  updatedAt: string | null
  days: { date: string; pageSlug: string; count: number }[]
}

// A visitor's message from a website's message form (specs/006-website-message-form).
export type IWebsiteMessage = {
  id: string
  pageSlug: string
  firstName: string
  lastName: string
  email: string
  message: string
  isRead: boolean
  // Forwarding to HubSpot (specs/007-website-hubspot-map): null when the form has none.
  forwardStatus?: 'pending' | 'sent' | 'failed' | null
  forwardError?: string | null
  createdAt: string
}
export type IWebsiteMessageList = {
  data: IWebsiteMessage[]
  pagination: { currentPage: number; pageSize: number; total: number; totalPages: number }
  unread: number
}
