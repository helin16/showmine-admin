# API Contract: Website Builder (showmine-api)

Every route is additive. Consumers: `showmine-admin` (editing) and `showmine-reader` (public).

**Editing routes** need, in this order:
- the app token (`X-SHM-TOKEN`);
- a signed-in user;
- the `comid` header company (an approved member);
- for admin routes only, `validateCompanyRole(ROLE_ADMIN)`, which returns **401** when refused (a super admin passes);
- the switch, which returns **403** `{ message: 'The website builder is not turned on for this company.' }` when off.

**Member routes** (SMN-80, any member): `GET /website`, `GET /website/pageViews`, `POST /website/preview`,
`GET` and `POST /website/pages`, `PUT /website/pages/order`, `PUT /website/pages/:id`, `POST /website/images`,
`GET /website/images/usage`. Every other website route is an admin route.

Data is always the header company's. Another company's ids return 404. Each route reads only the body fields listed; other fields are ignored.

**Errors** use `{ message }`. A validation error also carries `errors: [{ path, message }]` and returns 400.

## Website (US1, US6)

| Route | Body | Success | Errors |
|---|---|---|---|
| `GET /website` | | 200 website + `hasUnpublishedChanges` | 404 no active website |
| `POST /website` | `{ name? }` (default: the company name) | 200 website, with `addresses: { subdomain, reader }` | 400 name, or a `slug`/`subdomain` sent; 409 company has one |
| `PUT /website` | `{ name?, theme?, seo?, customDomain?, updatedAt }` (`slug` and `subdomain` refused: made from the name, SMN-81) (super admin also `customDomainStatus`) | 200 website | 400 fields or missing `updatedAt`; 404; 409 taken or stale `updatedAt` |
| `POST /website/publish` | `{ updatedAt }` | 200 website with `publishedAt` | 400 `errors` (no pages, invalid section, bad image, a link to a missing page); 409 stale |
| `POST /website/unpublish` | | 200 website | 404 |

The `theme` and `seo` keys sent are merged over the saved ones.

## Company (existing route, US1)

- `PUT /company/:id` now also accepts `address`: string ≤500 or null. Anything else is 400.
- `websiteBuilderEnabled` is accepted only from a super admin.

## Pages (US2)

| Route | Body | Success | Errors |
|---|---|---|---|
| `GET /website/pages` | | 200 `[page]` in order, each with `hasUnpublishedChanges` | 404 no website |
| `POST /website/pages` | `{ slug, title, sections?, seo? }` | 200 page, placed last | 400; 403 `maxPages` reached; 409 slug taken |
| `PUT /website/pages/:id` | `{ slug?, title?, sections?, seo?, updatedAt }` | 200 page | 400; 404; 409 slug or stale |
| `DELETE /website/pages/:id` | | 200 | 404 |
| `PUT /website/pages/order` | `{ ids }` (exactly the active pages) | 200 `[page]` | 400 |
| `POST /website/preview` | | 200 `{ url, expiresAt }` (30 min). A new link ends the same admin's earlier one | 404 no website |

## Templates (US4)

| Route | Body | Success | Errors |
|---|---|---|---|
| `GET /website/templates` | | 200 `[{ id, version, name: {en, zh}, description: {en, zh}, thumbnail }]`; `thumbnail` is an absolute URL on the Reader (`APP_READER_BASE_URL`) | |
| `POST /website/initialise` | `{ templateId, templateVersion, replace?, pageCount? }`; `pageCount` is required with `replace: true` and is the count the admin confirmed | 200 `[page]` as `GET /website/pages`. Creates the template's pages, sets the website's `theme` to the template's, and leaves the published copy alone. Repeating the last template and version while its pages exist creates nothing | 400 bad fields; 404 template or no website; 409 old version; 409 `{ message, pageCount }` when pages exist and `replace` is not true, or `pageCount` differs from the current count; 403 over `maxPages` |
| `GET /publicTemplate/:id` | | 200 `{ template: { id, version, name, description, theme }, company, pages }`, app token only. `company` is the template's sample business (`name`, `phone`, `email`, `address`); `pages` are in the published-copy shape with new section ids | 404 |

## Images (US5)

Website images have their own routes, with the member guards (SMN-80). The guards run before the file is read.
Sections and SEO may use any active JPEG, PNG, WebP or GIF asset of the company under its folder, not only `WEBSITE`
uploads; the published copy builds each address from the asset's key. `DELETE /asset/:id` answers 409 `{ message,
usedBy }` for any asset the website uses, and `PUT /asset/:id` answers 409 when it would change such an asset's
`url`, `externalAssetId`, `fileType` or `type`.

- `POST /website/images`, multipart field `file`: 200 with the new asset (`type: WEBSITE`).
  - 400 when the file is not jpeg, png, webp or gif, judged by its first bytes and its extension;
  - 413 when it is over 10 MB;
  - 403 when it is over the plan's storage.
- `GET /website/images/usage?ids=<id,...>` (at most 100 ids of this company): 200
  `{ [assetId]: [{ pageId?, pageTitle?, published: boolean }] }`. It covers the draft pages (sections and SEO), the
  site's SEO and the published copy. An unused image maps to `[]`.
- `POST /asset/upload` with `type=WEBSITE`: 400.
- `POST /asset` and `PUT /asset/:id` with `type=WEBSITE`, or on a `WEBSITE` asset: 400.
- `DELETE /asset/:id` on a `WEBSITE` asset: 401 for a member; 409 `{ message, usedBy }` (shape as in usage) when the
  website uses it.
- `GET /asset/articles` is unchanged; the admin keeps reading it as `{ [assetId]: [articles] }`.

## Public (US3, US7)

| Route | Auth | Success | Errors |
|---|---|---|---|
| `GET /publicWebsite/:slug?preview=<token>` | App token | 200 published copy (data-model "Published copy") plus `companyId`; the draft in the same shape, with `isPreview: true` and `Cache-Control: no-store`, with a valid preview token | 404 for each of: unknown, unpublished, switch off, inactive company, bad or expired token |
| `POST /publicWebsite/:slug/pageView` | **Server key** (`X-SHM-SERVER-KEY`) | 204; ignored when `pageSlug` is not in the published copy | 401 without the server key |
| `GET /website/pageViews?from=YYYY-MM-DD&to=YYYY-MM-DD` | Editing guards | 200 `{ from, to, updatedAt, days: [{ date, pageSlug, count }] }` (empty `days` when none) | 400 when the range is over 366 days or the dates are invalid |
