# Research: Website Builder

All Technical Context unknowns are resolved below. An independent reviewer checked an earlier draft of this design against the code of all three repositories (5 blockers, 9 should-fix, 4 security issues, 5 nits). Every finding is reflected here.

## R1. Business profile

- **Decision**: Use the existing `Company` and add `address` (TEXT, ≤500). The profile is saved at once, as today. It reaches the public site only when the site is published, because publishing copies the contact fields the site shows.
- **Rationale**: Company already holds the name, description, phone, email and logo, and all roles and tenancy depend on it. Copying at publish gives the spec's "draft" behaviour without a second profile.
- **Alternatives**: A separate business table duplicates Company and its permissions. A profile draft table adds a second edit flow for no requirement.

## R2. Switch

- **Decision**: Add `companies.websiteBuilderEnabled` (BOOLEAN, default false), listed in `SUPER_ADMIN_FIELDS` of `CompanyController`.
- **Rationale**: Merges deploy production, so unfinished slices must stay hidden. A column, rather than an `adminConfig` key, cannot be dropped when a super admin saves a stale `adminConfig` (that save replaces the whole value).
- **Alternatives**: An `adminConfig.websiteBuilder` key carries that overwrite risk. Long-lived feature branches cannot work, because each slice must be deployed for Lin to check it.

## R3. Public address

- **Decision**: Use the path `<reader>/s/<slug>`. Subdomain and custom domain are recorded and checked in SMN-64 and served later.
- **Rationale**: A path works on the existing Vercel project and needs no DNS or CORS changes.
- **Alternatives**: Wildcard subdomains need DNS, Vercel and certificate setup outside the code, and the API's `CORS_ORIGINS` list.

## R4. Sections storage

- **Decision**: Keep a JSON array on the page row. The API checks it against per-type schemas. It is edited only through the page's `PUT`, which carries `updatedAt` for optimistic concurrency.
- **Rationale**: The order is the array order, there are no joins, and pages are small (≤30 sections, ≤200 KB).
- **Alternatives**: A sections table needs ordering columns and many writes for one reorder.

## R5. Publishing model

- **Decision**: Publishing copies the site settings, the active pages and the contact fields used into `websites.publishedSnapshot` in one transaction, after cleaning `text` HTML again and checking every image. Unpublishing clears the copy.
- **Rationale**: Drafts and profile edits can never leak. One copy is bounded in size.
- **Alternatives**: A release history table grows without limit, and no acceptance criterion needs it. Publish flags on rows leak profile edits and cannot publish a set of changes at once.

## R6. Templates

- **Decision**: Write templates as TypeScript modules in `src/templates/website/`, collected in a map in `index.ts`. Each is `{ id, version, name{en,zh}, description{en,zh}, thumbnail, theme, pages }`. Unknown ids return 404. A version mismatch returns 409. Initialising again with the same template and version is a no-op that returns 200.
- **Rationale**: The `tsc` build only emits imported TypeScript, because `rootDir` is `src` and `resolveJsonModule` is off. A map means no file path is ever built from the request.
- **Alternatives**: JSON files need a copy step or a `tsconfig` change. A database template editor has no requirement.

## R7. Previews

- **Decision**: Previews open in a new tab. A draft preview uses a 30-minute `TmpToken` of a new type, tied to the company and the website: `/s/<slug>?preview=<token>`. Template preview uses `/t/<id>`, rendered from `GET /publicTemplate/:id`. Both send `noindex` and `no-store`.
- **Rationale**: The Reader CSP sets `frame-ancestors 'self'`, so admin iframes would be blocked. A new tab needs no CSP change. One renderer serves preview, template and live views.
- **Alternatives**: An iframe needs a CSP change for the admin origins. Rendering in the admin would duplicate the Reader components.

## R8. Images

- **Decision**: Add a new asset type `WEBSITE`. Uploads of this type accept only jpeg, png, webp and gif up to 10 MB, within the plan's storage. `POST /asset` and `PUT /asset/:id` cannot create or change `WEBSITE` assets. Section image ids must be active `WEBSITE` assets of the same company with an `isCompanyUploadPath` key. The existing `/asset/articles` usage route is extended to cover websites. `DELETE` returns 409 for an image in use, including on the `purgeDeletedAssets` path. A failed `Asset.create` deletes the uploaded S3 object.
- **Rationale**: It closes the reviewer's forgery and orphan findings, and reuses the existing upload, storage limit and media list.
- **Alternatives**: SVG is excluded because it can carry script when opened directly.

## R9. Asset clean-up

- **Decision**: `AssetCleanUp` gets a `WEBSITE` unused-asset check. `TEXT_REFERENCES` gets `websitePages.sections`, `websites.seo` and `websites.publishedSnapshot`. The website JSON stores asset ids, and the check matches by id.
- **Rationale**: Without this, the monthly job would remove website images.

## R10. Page views

- **Decision**: Count with a daily upsert into `websitePageViews (websiteId, pageSlug, date UTC, count)`. The Reader calls `POST /publicWebsite/:slug/pageView` from the server with the server key. The API counts only page names that are in the published copy. Previews and the `ShowMine-E2E` user agent are skipped.
- **Rationale**: Nothing personal is stored, so no consent banner is needed. A server-side call avoids CORS on future domains and the per-IP write limit. Checking page names prevents unbounded rows.
- **Alternatives**: A browser beacon is blocked by CORS once domains are used, and is limited per visitor IP. Unique visitors would need an identifier.

## R11. Plan limits

- **Decision**: Add `iPlan.maxPages`: free 5, starter 20, unlimited none. Companies with no plan have no limit, as for users and storage. The limit is checked on page create and on template initialise.

## R13. Timestamps

- **Finding**: The API turns off Sequelize's automatic timestamps for every model (`LocalDB.ts`, `timestamps: false`), so `updatedAt` changes only when code sets it.
- **Decision**: Every website and page write sets `updatedAt: new Date()` explicitly. Stale-save checks (R12) and `hasUnpublishedChanges` depend on it. Each is tested by two saves through the API.

## R12. Errors and concurrency

- **Decision**: Use `{ message }` as `HttpError` does, plus `errors: [{ path, message }]` for validation. Return 409 for a taken name, a stale `updatedAt` or a template conflict. Role refusals stay 401, as `validateCompanyRole` gives today. The switch being off gives 403. Every public "not available" case gives 404.
