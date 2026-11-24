import IBaseModel from '../IBaseModel'

// Search and sharing details of the site or a page; an empty one falls back to the site's, then the company's.
export type IWebsiteSeo = { title?: string; description?: string; imageAssetId?: string | null }

// A company's website as GET /website returns it (specs/001-website-builder, data-model "Website").
type IWebsite = IBaseModel & {
  companyId: string
  slug: string
  theme?: { primaryColor?: string; fontPair?: string } | null
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

// The API's rule for a website's address name: 3 to 40 lower-case letters, digits or hyphens, not starting or ending
// with a hyphen. Reserved names are left to the API.
export const WEBSITE_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/

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
