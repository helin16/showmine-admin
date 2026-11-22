# API Contract: Website Builder (showmine-api)

Every route is additive. Consumers: `showmine-admin` (editing) and `showmine-reader` (public).

**Editing routes** need, in this order:
- the app token (`X-SHM-TOKEN`);
- a signed-in user;
- the `comid` header company;
- `validateCompanyRole(ROLE_ADMIN)`, which returns **401** when refused (a super admin passes);
- the switch, which returns **403** `{ message: 'The website builder is not turned on for this company.' }` when off.

Data is always the header company's. Another company's ids return 404. Each route reads only the body fields listed; other fields are ignored.

**Errors** use `{ message }`. A validation error also carries `errors: [{ path, message }]` and returns 400.

## Website (US1, US6)

| Route | Body | Success | Errors |
|---|---|---|---|
| `GET /website` | | 200 website + `hasUnpublishedChanges` | 404 no active website |
| `POST /website` | `{ slug }` | 200 website | 400 slug; 409 company has one or slug taken |
| `PUT /website` | `{ slug?, theme?, seo?, subdomain?, customDomain?, updatedAt }` (super admin also `customDomainStatus`) | 200 website | 400 fields or missing `updatedAt`; 404; 409 taken or stale `updatedAt` |
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
| `POST /website/preview` | | 200 `{ url, expiresAt }` (30 min) | 404 no website |

## Templates (US4)

| Route | Body | Success | Errors |
|---|---|---|---|
| `GET /website/templates` | | 200 `[{ id, version, name: {en, zh}, description: {en, zh}, thumbnail }]`; `thumbnail` is an absolute URL on the Reader (`APP_READER_BASE_URL`) | |
| `POST /website/initialise` | `{ templateId, templateVersion, replace? }` | 200 `[page]` (an identical repeat creates nothing) | 404 template; 409 old version, or `{ message, pageCount }` when pages exist and `replace` is not true; 403 over `maxPages` |
| `GET /publicTemplate/:id` | | 200 `{ template, pages }`, app token only | 404 |

## Images (US5)

- `POST /asset/upload` with `type=WEBSITE`:
  - 400 when the file is not jpeg, png, webp or gif;
  - 413 when it is over 10 MB;
  - 403 when it is over the plan's storage.
- `POST /asset` and `PUT /asset/:id` with `type=WEBSITE`, or on a `WEBSITE` asset: 400.
- `GET /asset/articles` now also lists `websites: [{ pageId?, pageTitle?, published: boolean }]` per asset.
- `DELETE /asset/:id`: 409 `{ message, usedBy }` when the asset is in use.

## Public (US3, US7)

| Route | Auth | Success | Errors |
|---|---|---|---|
| `GET /publicWebsite/:slug?preview=<token>` | App token | 200 published copy (data-model "Published copy"); the draft in the same shape with a valid preview token | 404 for each of: unknown, unpublished, switch off, inactive company, bad or expired token |
| `POST /publicWebsite/:slug/pageView` | **Server key** (`X-SHM-SERVER-KEY`) | 204; ignored when `pageSlug` is not in the published copy | 401 without the server key |
| `GET /website/pageViews?from=YYYY-MM-DD&to=YYYY-MM-DD` | Editing guards | 200 `{ from, to, updatedAt, days: [{ date, pageSlug, count }] }` (empty `days` when none) | 400 when the range is over 366 days or the dates are invalid |
