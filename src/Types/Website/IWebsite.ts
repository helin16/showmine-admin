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

export default IWebsite
