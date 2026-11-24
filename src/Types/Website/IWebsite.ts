import IBaseModel from '../IBaseModel'

// A company's website as GET /website returns it (specs/001-website-builder, data-model "Website").
type IWebsite = IBaseModel & {
  companyId: string
  slug: string
  theme?: { primaryColor?: string; fontPair?: string } | null
  seo?: { title?: string; description?: string; imageAssetId?: string | null } | null
  publishedAt?: string | null
  hasUnpublishedChanges: boolean
}

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
  hasUnpublishedChanges: boolean
}

// A page's address name, as the API checks it.
export const PAGE_SLUG_PATTERN = /^[a-z0-9-]{1,40}$/

// One problem that stops a publish or a save: `path` names the field, e.g. pages[about].sections[2].heading.
export type IFieldError = { path: string; message: string }

export default IWebsite
