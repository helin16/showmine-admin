# Data Model: Website Builder

All tables are in `showmine-api`, created by Sequelize migrations. Each migration is additive and has a `down`. "Base columns" means `id`, `isActive`, `createdById`, `updatedById`, `createdAt` and `updatedAt` (`TableCreationHelper.getBaseFields`). JSON columns are TEXT read through `defineJsonField`.

## Company (existing; US1)

| Field | Type | Rules |
|---|---|---|
| `address` | TEXT, null | Plain text, ≤ 500 characters. Saved by a company admin through `PUT /company/:id` |
| `websiteBuilderEnabled` | BOOLEAN, not null, default false | Only a super admin sets it (`SUPER_ADMIN_FIELDS`). Silently dropped for a company admin |

## Plan (existing `PLANS` in `Company.ts`; US2)

- `iPlan.maxPages`: free 5, starter 20, unlimited none.
- A company with no plan has no limit.

## Website (new table `websites`)

| Field | Type | Rules | Story |
|---|---|---|---|
| base columns | | | US1 |
| `companyId` | UUID → companies, not null | Partial unique `WHERE isActive` | US1 |
| `slug` | VARCHAR(40), not null | `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$`, not reserved, partial unique `WHERE isActive` | US1 |
| `theme` | JSON | `{ primaryColor: #rrggbb, fontPair: modern \| classic \| friendly }` | US1 |
| `seo` | JSON | `{ title ≤70, description ≤160, imageAssetId? }`. `imageAssetId` is an active website image of the company, or null (added with US3) | US1, US3, US6 |
| `templateId`, `templateVersion` | VARCHAR, INT, null | Set by initialise | US4 |
| `publishedSnapshot` | JSON, null | Copy shown to the public (below). Null means unpublished | US1 (column), US3 |
| `publishedAt`, `publishedById` | DATE, UUID, null | | US1 (column), US3 |
| `contentChangedAt` | DATE, null | Set on every website write and every page create, update, delete or reorder | US2 |
| `subdomain` | VARCHAR(40), null | Same pattern as `slug`; partial unique `WHERE isActive` | US6 |
| `subdomainStatus` | VARCHAR, default `none` | `none \| pending \| live`. A taken subdomain is refused with 409 and never stored; `pending` until the infrastructure serves it | US6 |
| `customDomain` | VARCHAR(253), null | A lower-case host name; partial unique `WHERE isActive` | US6 |
| `customDomainStatus` | VARCHAR, default `none` | `none \| pending \| verified \| failed`. Only a super admin sets it | US6 |

Reserved slugs (exact list in the API): `admin`, `api`, `app`, `assets`, `auth`, `blog`, `cdn`, `help`, `item`, `login`, `mail`, `official`, `redirect`, `showmine`, `signin`, `signup`, `static`, `support`, `wechat`, `www`.

**Derived**:
- `hasUnpublishedChanges` is true when any of these holds:
  - the site has never been published;
  - `contentChangedAt` is later than `publishedAt`;
  - a company contact field that the published copy shows differs from its current value.
- Lifecycle: no website → **draft** (`publishedSnapshot` null) → **published**. Publishing again replaces the copy. Unpublishing clears it and returns to draft. Removing the website deactivates it, which frees `companyId` and `slug`.

## WebsitePage (new table `websitePages`; US2)

| Field | Type | Rules |
|---|---|---|
| base columns | | Deleting a page deactivates it |
| `websiteId` | UUID → websites | |
| `companyId` | UUID → companies | Must equal the website's company |
| `slug` | VARCHAR(40) | `^[a-z0-9-]{1,40}$`; partial unique on `(websiteId, slug) WHERE isActive` |
| `title` | VARCHAR(80) | Required |
| `position` | INT | The lowest active page is the home page |
| `sections` | JSON array | ≤ 30 sections; serialised page ≤ 200 KB; see Section |
| `seo` | JSON | `{ title ≤70, description ≤160, imageAssetId? }`, as the website's |

## Section (inside `websitePages.sections`; US2)

Every section is `{ id: UUID made by the client, type, ...fields }`. An unknown type or field returns 400.

| `type` | Fields and limits |
|---|---|
| `hero` | `heading` ≤120, `subheading` ≤300, `imageAssetId?`, `buttonText` ≤40, `buttonUrl?`: `https:`, `http:`, `mailto:`, `tel:` or `/<page slug>` |
| `text` | `html`, cleaned by `HtmlSanitizer` on save and at publish, ≤ 50,000 characters |
| `image` | `assetId`, `alt` ≤200, `caption` ≤300 |
| `gallery` | `images`: 1 to 24 of `{ assetId, alt ≤200 }` |
| `contact` | `showPhone`, `showEmail`, `showAddress` (booleans), `mapUrl?` (`https:` only) |
| `articles` | `count` 3 to 12, `tagName?` ≤50 |

Every asset id must be an active asset of type `WEBSITE` in the same company, with a key that passes `isCompanyUploadPath`.

## Published copy (`websites.publishedSnapshot`; US3)

```text
{ version: 1, publishedAt, slug, theme, seo,
  company: { name, logoUrl?, phone?, email?, address? },   // only the fields a contact section shows; null when empty
  pages: [{ slug, title, seo, sections }] }                 // active pages in order
```

Images keep their id, and their address is added beside it: `imageAssetId` gains `imageUrl` (hero, site and page
SEO), `assetId` gains `url` (image section, gallery items). The ids stay so that the delete check and asset clean-up
(US5) still see images that only the published site uses. An image that is no longer usable has no address. Changed
during SMN-63 with Lin's approval; the copy first said ids were replaced by URLs.

`GET /publicWebsite/:slug` also returns `companyId` (not stored in the copy), which the Reader uses to load an articles
section, and `isPreview: true` for a preview.

## Template (code, `src/templates/website/*.ts`; US4)

`{ id, version, name: {en, zh}, description: {en, zh}, thumbnail, theme, pages: [{ slug, title, sections }] }`. Three are shipped. They contain no images.

## Asset (existing; US5)

- New type `WEBSITE`: jpeg, png, webp or gif, ≤ 10 MB, counted in the plan's storage.
- Cannot be created or changed through `POST /asset` or `PUT /asset/:id`.

## WebsitePageView (new table `websitePageViews`; US7)

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | |
| `websiteId` | UUID → websites | |
| `pageSlug` | VARCHAR(40) | Must be in the published copy when counted |
| `date` | DATEONLY (UTC) | |
| `count` | INT | Incremented by upsert |
| `createdAt`, `updatedAt` | DATE | `updatedAt` is the "last updated" time shown |

Unique on `(websiteId, pageSlug, date)`.
