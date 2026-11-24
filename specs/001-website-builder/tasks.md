---

description: "Task list for the Website Builder (SMN-53, Sprint 3)"
---

# Tasks: Website Builder

**Input**: Design documents from `specs/001-website-builder/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required. All three constitutions (admin VII, api VII, reader VI) make regression tests mandatory for behaviour changes, so every story has test tasks.

**Organization**: Tasks are grouped by user story. Paths are prefixed with their repository: `api:` is `showmine-api`, `reader:` is `showmine-reader`, `admin:` is `showmine-admin`.

**Delivery**: One branch and PR per repository per slice. The order of slices in plan.md "Delivery slices" governs, not the order of the phases below. MAOS agents never merge: Lin reviews and merges every PR, and the API PR of a slice is merged and deployed before its consumers. Each slice also needs its MAOS `plan` approval before work starts and Lin's check on the test company after it is deployed (the `staging` gate).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 to US7)

---

## Phase 1: Setup

- [ ] T001 Create branch `SMN-53-website-builder` in each repository from `master`, and link `showmine-admin/specs/001-website-builder` in each PR description (api I, reader I)
- [ ] T002 [P] Add the Website section to `api:README.md`: switch, routes and where the spec lives

---

## Phase 2: Foundational (blocks every story; slice 1, SMN-56)

- [ ] T003 Migration `api:migrations/20261122000000-add-websites.js`:
  - `companies.address` TEXT null and `companies.websiteBuilderEnabled` BOOLEAN NOT NULL default false;
  - table `websites` with base columns, `companyId`, `slug` VARCHAR(40), `theme`, `seo`, `publishedSnapshot`, `publishedAt` and `publishedById`;
  - partial unique indexes on `companyId` and on `slug` `WHERE isActive`;
  - a `down`.
- [ ] T004 [P] Model `api:src/models/Website/Website.ts`, registered in `api:src/models/LocalModels.ts`
- [ ] T005 [P] Company fields `address` and `websiteBuilderEnabled` in `api:src/models/Settings/Company.ts`. Add `websiteBuilderEnabled` to `SUPER_ADMIN_FIELDS` in `api:src/controllers/Settings/CompanyController.ts`
- [ ] T006 Editing guards (app token, user, `comid`, `validateCompanyRole(ROLE_ADMIN)`, switch returns 403) in `api:src/controllers/Website/WebsiteController.ts`, mounted at `/website` in `api:src/routes.ts`
- [ ] T007 [P] Test helper `createWebsite` in `api:tests/helpers/FakeHelper.ts`
- [ ] T008 [P] Migration test, down then up, keeping company data, plus the partial unique indexes, in `api:tests/models/WebsiteMigration.test.ts`
- [ ] T008a `ASSET_TYPE_WEBSITE` in `api:src/models/Assets/Asset.ts`, so section and SEO image checks (T030, T042) can require it. The upload rules for it are T059 (slice 3, before publishing ships)

**Checkpoint**: the switch exists and is off everywhere; nothing is visible.

---

## Phase 3: User Story 1 - Profile and website (P1) 🎯 MVP part 1

**Goal**: An admin saves the address and creates the website and its name.

**Independent Test**: spec US1.

### Tests

- [ ] T009 [P] [US1] Tests for `GET/POST/PUT /website` in `api:tests/controllers/Website/WebsiteController.test.ts`:
  - switch off returns 403; member 401; a super admin who is not a member;
  - slug pattern, reserved names, taken name 409, one website per company 409;
  - only whitelisted fields saved; theme and SEO merged and validated with `errors[]`;
  - missing or stale `updatedAt`; a removed website frees its name.
- [ ] T010 [P] [US1] Tests that `address` is ≤500 characters or null, and that `websiteBuilderEnabled` is dropped for an admin and saved for a super admin, in `api:tests/controllers/Settings/CompanyWebsiteFields.test.ts`
- [ ] T011 [P] [US1] Add `GET /website`, `POST /website` and `PUT /website` to `api:tests/controllers/RouteMatrix.test.ts`. The matrix proves sign-in, other-company and member refusals
- [x] T012 [P] [US1] Admin tests in `admin:src/__tests__/pages/Website/WebsiteOverviewPage.test.tsx`:
  - menu hidden when the switch is off or for a member;
  - create a site name; field errors shown;
  - 409 shows "taken"; a stale save asks to reload.
- [x] T013 [P] [US1] Admin test for the address field, with the other company editor tests in `admin:src/__tests__/components/Account/companyEditing.test.tsx`

### Implementation

- [ ] T014 [US1] `GET`, `POST` and `PUT /website` in `api:src/controllers/Website/WebsiteController.ts`:
  - slug `^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$`, not reserved;
  - theme `primaryColor #rrggbb`, `fontPair modern|classic|friendly`;
  - SEO title ≤70, description ≤160;
  - `updatedAt` check; unique-index violation answered 409.
- [ ] T015 [US1] Address validation (string ≤500 or null, else 400) in `api:src/controllers/Settings/CompanyController.ts`
- [x] T016 [P] [US1] Types in `admin:src/Types/Website/IWebsite.ts`; `address` and `websiteBuilderEnabled` in `admin:src/Types/Company/ICompany.ts`
- [x] T017 [P] [US1] `admin:src/Services/WebsiteService.ts` (get, create, update), modelled on `CompanyService`
- [x] T018 [US1] URL constants in `admin:src/UrlMap.ts`, routes in `CompanyAdminRoute` in `admin:src/Router.tsx`, and the "Website" item in "my company" in `admin:src/Components/Menu/MenuItems.tsx`, shown only when `company.websiteBuilderEnabled`
- [x] T019 [US1] Overview page `admin:src/Pages/Website/WebsiteOverviewPage.tsx`: create or edit the name, show the address and publish state, link to the other pages
- [x] T020 [US1] Address field, multi-line, ≤500, in `admin:src/Components/Company/CompanyEditor.tsx`
- [x] T021 [P] [US1] Strings in `admin:src/i18n/messages/en.ts` and `admin:src/i18n/messages/cn.ts`
- [x] T021a [US1] The super admin's "Website builder" switch per company in `admin:src/Components/Company/CompanyList.tsx`, saved with `PUT /company/:id`; the signed-in company's session is updated. Tested in `admin:src/__tests__/components/Account/companyList.test.tsx` (added by Lin, 2026-11-24: no screen could turn the builder on)

**Checkpoint**: US1 works for the test company (quickstart step 2).

---

## Phase 4: User Story 2 - Pages and sections (P1) 🎯 MVP part 2

**Goal**: Draft pages and sections with preview; saving never publishes.

**Independent Test**: spec US2.

### Tests

- [ ] T022 [P] [US2] Migration test for `websitePages` (down then up; partial unique `(websiteId, slug)`) in `api:tests/models/WebsitePageMigration.test.ts`
- [ ] T023 [P] [US2] Tests for every section type and limit, unknown type or field, link schemes (`javascript:` refused), `mapUrl` https only, HTML cleaned, 30 sections and 200 KB limits, and asset ids that are not `WEBSITE`, inactive or another company's, in `api:tests/helpers/WebsiteHelper.test.ts`
- [ ] T024 [P] [US2] Page route tests in `api:tests/controllers/Website/WebsitePageController.test.ts`:
  - CRUD, order with exactly the active ids, `maxPages` 403 per plan and no limit without a plan;
  - stale 409; delete frees the slug; preview token 30 minutes, tied to company and website;
  - another company 404.
- [ ] T025 [P] [US2] Add every page route to `api:tests/controllers/RouteMatrix.test.ts`, and a switch-off 403 case per route in T024
- [ ] T026 [P] [US2] Admin tests for the page list, section editor, up and down reorder, delete confirmation, 409 reload and preview link in `admin:src/__tests__/pages/Website/WebsitePagesPage.test.tsx` and `admin:src/__tests__/components/Website/SectionEditor.test.tsx`

### Implementation

- [ ] T027 [US2] Migration `api:migrations/20261122000001-add-website-pages.js`: `websitePages` per data-model, `(websiteId, slug)` partial unique, a `down`
- [ ] T028 [P] [US2] Model `api:src/models/Website/WebsitePage.ts` in `LocalModels`
- [ ] T029 [P] [US2] `maxPages` (free 5, starter 20) in `PLANS` and `iPlan` in `api:src/models/Settings/Company.ts`, plus `PlanHelper.validateCanAddPages` in `api:src/helpers/PlanHelper.ts`
- [ ] T030 [US2] Section schemas and validation, link and URL allow-lists, HTML cleaning and asset checks in `api:src/helpers/WebsiteHelper.ts`
- [ ] T031 [US2] Page routes in `api:src/controllers/Website/WebsitePageController.ts`, mounted under `/website/pages` (`/order` registered before `/:id`). Every page write, and every website write, sets `websites.contentChangedAt` and the row's `updatedAt` (research R13). The home page is the lowest `position`; tested in T024
- [ ] T033 [P] [US2] Page and section types plus service methods in `admin:src/Types/Website/` and `admin:src/Services/WebsiteService.ts`
- [ ] T034 [US2] Pages list page `admin:src/Pages/Website/WebsitePagesPage.tsx`: add, rename, up and down, delete with confirmation
- [ ] T035 [US2] Page editor `admin:src/Pages/Website/WebsitePageEditPage.tsx`, with one editor per section type in `admin:src/Components/Website/Sections/`. `text` uses the existing `RichTextEditor`. Includes the preview button (new tab)
- [ ] T036 [P] [US2] Strings in `admin:src/i18n/messages/en.ts` and `cn.ts`

**Checkpoint**: quickstart step 3.

---

## Phase 5: User Story 3 - Publish and public view (P1) 🎯 MVP part 3

**Goal**: Publish copies the draft. Visitors see the published pages; everything else is not-found.

**Independent Test**: spec US3.

### Tests

- [ ] T037 [P] [US3] Publish and unpublish tests in `api:tests/controllers/Website/WebsitePublish.test.ts`:
  - publish refused with `errors` for no pages, an invalid section, or an inactive or foreign image;
  - the copy contains only the contact fields used;
  - publish is refused when a link points to a page that does not exist;
  - `hasUnpublishedChanges` turns true after a page edit, delete or reorder, a website edit, or a change to a published contact field, and false after publishing;
  - later draft and company edits do not change `GET /publicWebsite`.
- [ ] T038 [P] [US3] `GET /publicWebsite/:slug` tests in `api:tests/controllers/Website/PublicWebsiteController.test.ts`:
  - 404 for unknown, unpublished, switch off, inactive company and bad or expired preview token, all with the same body;
  - a preview shows the draft;
  - image ids are replaced by URLs.
- [ ] T039 [P] [US3] Add publish, unpublish, preview and the public route (public, with a reason) to `api:tests/controllers/RouteMatrix.test.ts`
- [ ] T040 [P] [US3] Reader page tests in `reader:src/__tests__/pages/s/website.test.tsx`:
  - home page, named page, unknown page;
  - API 404, 429, 500 and a network failure (every failure except 429 shows not-found);
  - preview sends `no-store`, `noindex` and `Referrer-Policy: no-referrer`;
  - meta falls back from page to site to company.
- [ ] T041 [P] [US3] Reader section component tests in `reader:src/__tests__/components/Website/sections.test.tsx`: each type, `alt` text, link schemes, articles section

### Implementation

- [ ] T041a [US3] New `TmpToken` type `website_preview` in `api:src/models/Settings/TmpToken.ts`, and `POST /website/preview` in `api:src/controllers/Website/WebsiteController.ts`. The token is tied to the company and the website and lasts 30 minutes; tested in T038. US2's preview acceptance scenario is met here
- [ ] T042 [US3] `POST /website/publish` and `/unpublish` in `api:src/controllers/Website/WebsiteController.ts`. The snapshot is built in `api:src/helpers/WebsiteHelper.ts` in one transaction, cleaning HTML again and checking images
- [ ] T043 [US3] `GET /publicWebsite/:slug` in `api:src/controllers/Website/PublicWebsiteController.ts`, mounted in `api:src/routes.ts`
- [ ] T044 [P] [US3] `reader:src/serivices/WebsiteService.ts` (`getPublicWebsite`) using `AppService`
- [ ] T045 [P] [US3] Section components in `reader:src/components/Website/sections/` (Hero, Text, Image, Gallery, Contact, Articles), plus `Site.tsx` and `Nav.tsx`, and `reader:src/styles/website.scss` imported in `_app.tsx`
- [ ] T046 [US3] Page `reader:src/pages/s/[slug]/[[...page]].tsx`, server-rendered, with the articles section fetched server-side through `ItemService` and the `Header` meta fallback
- [ ] T047 [US3] Publish bar (publish, unpublish with confirmation, unpublished-changes badge, list of publish `errors`) in `admin:src/Components/Website/PublishBar.tsx`, used on the overview and editor pages

**Checkpoint**: MVP complete (quickstart step 4).

---

## Phase 6: User Story 4 - Templates (P2)

**Goal**: Browse, preview and apply templates.

**Independent Test**: spec US4.

### Tests

- [x] T048 [P] [US4] Tests in `api:tests/controllers/Website/WebsiteTemplates.test.ts`:
  - list; unknown id 404; old version 409;
  - an identical repeat creates nothing;
  - existing pages without `replace` give 409 with `pageCount`; `replace` deactivates the old pages;
  - over `maxPages` 403;
  - every shipped template passes the section schemas;
  - member 401, other company, switch off 403; and the three template routes added to `api:tests/controllers/RouteMatrix.test.ts`.
- [x] T049 [P] [US4] Reader test for the template preview page, including 404, 500 and network failure, in `reader:src/__tests__/pages/t/template.test.tsx`
- [ ] T050 [P] [US4] Admin test for the template gallery (cards, preview in a new tab, replace confirmation with the count, mobile layout) in `admin:src/__tests__/pages/Website/WebsiteTemplatesPage.test.tsx`

### Implementation

- [x] T051 [US4] Migration `api:migrations/20261122000002-add-website-template.js`: `websites.templateId` and `templateVersion`
- [x] T052 [P] [US4] Three templates in `api:src/templates/website/{shop,services,simple}.ts` and the map in `index.ts`
- [x] T053 [US4] `GET /website/templates`, `POST /website/initialise` and `GET /publicTemplate/:id` in `api:src/controllers/Website/`
- [x] T054 [P] [US4] Thumbnails `reader:public/templates/{shop,services,simple}.png`, and the page `reader:src/pages/t/[id]/[[...page]].tsx`
- [ ] T055 [US4] Gallery page `admin:src/Pages/Website/WebsiteTemplatesPage.tsx`, with strings in `en.ts` and `cn.ts`

---

## Phase 7: User Story 5 - Website images (P2)

**Goal**: Safe uploads, an image picker, and usage-aware deletion.

**Independent Test**: spec US5.

### Tests

- [ ] T056 [P] [US5] Tests in `api:tests/controllers/Assets/WebsiteAssets.test.ts`:
  - type and size limits; plan storage;
  - `POST /asset` and `PUT /asset/:id` cannot create or alter `WEBSITE` assets;
  - usage listing; delete 409 when in use, including `purgeDeletedAssets`;
  - the S3 object is deleted when `Asset.create` fails;
  - member and other-company refusals for upload, usage and delete of `WEBSITE` assets.
- [ ] T057 [P] [US5] Clean-up test that website images in pages, SEO and the published copy survive, in the existing clean-up tests under `api:tests/queue/processor/`
- [ ] T058 [P] [US5] Admin tests for the media picker (upload progress, errors, select) and for deletion refused with the usage, in `admin:src/__tests__/components/Website/MediaPicker.test.tsx`

### Implementation

- [ ] T059 [US5] Type and size limits for `WEBSITE` uploads, plus S3 delete on failure, in `api:src/helpers/S3Helper.ts`
- [ ] T060 [US5] Upload and usage routes in `api:src/controllers/Website/WebsiteImageController.ts`; `WEBSITE` refusals and delete check in `api:src/controllers/Assets/AssetController.ts`
- [ ] T061 [US5] Id matching and `TEXT_REFERENCES` entries in `api:src/queue/processor/AssetCleanUp.ts`
- [ ] T062 [US5] `admin:src/Components/Website/MediaPicker.tsx` (built on `AssetService`), used by the image, gallery and hero editors and on the media page `admin:src/Pages/Website/WebsiteMediaPage.tsx`

---

## Phase 8: User Story 6 - SEO and web address (P2)

**Goal**: SEO fields, plus subdomain and custom domain records.

**Independent Test**: spec US6.

### Tests

- [ ] T063 [P] [US6] Tests for subdomain and custom domain validation, uniqueness 409, `customDomainStatus` set only by a super admin, and page and site SEO limits, in `api:tests/controllers/Website/WebsiteDomains.test.ts`
- [ ] T064 [P] [US6] Admin settings page test in `admin:src/__tests__/pages/Website/WebsiteSettingsPage.test.tsx`

### Implementation

- [ ] T065 [US6] Migration `api:migrations/20261122000003-add-website-domains.js`: `subdomain`, `subdomainStatus`, `customDomain` and `customDomainStatus`, each with a partial unique index, and a `down`
- [ ] T066 [US6] Domain and SEO image handling in `api:src/controllers/Website/WebsiteController.ts`
- [ ] T067 [US6] Settings page `admin:src/Pages/Website/WebsiteSettingsPage.tsx` (SEO, subdomain status, domain status), with strings

---

## Phase 9: User Story 7 - Page views (P3)

**Goal**: Count page views server-side and show them.

**Independent Test**: spec US7.

### Tests

- [ ] T068 [P] [US7] Tests in `api:tests/controllers/Website/WebsitePageViews.test.ts`:
  - the server key is required;
  - unknown `pageSlug`, previews and the E2E user agent are ignored;
  - daily upsert; range at most 366 days; empty period;
  - `GET /website/pageViews` member 401, other company, switch off 403; both routes added to `api:tests/controllers/RouteMatrix.test.ts` (the public one with its reason).
- [ ] T069 [US7] Reader test that a published page posts one view, while a preview, a template page and the `ShowMine-E2E` user agent do not, and that a failed view call still renders the page,, in `reader:src/__tests__/pages/s/website.test.tsx`
- [ ] T070 [P] [US7] Admin analytics page test (period, update time, empty state) in `admin:src/__tests__/pages/Website/WebsiteAnalyticsPage.test.tsx`

### Implementation

- [ ] T071 [US7] Migration `api:migrations/20261122000004-add-website-page-views.js` and model `api:src/models/Website/WebsitePageView.ts`
- [ ] T072 [US7] `POST /publicWebsite/:slug/pageView` (server key) and `GET /website/pageViews` in `api:src/controllers/Website/`
- [ ] T073 [US7] Server-side view call in `reader:src/pages/s/[slug]/[[...page]].tsx`. Skipped for previews and the `ShowMine-E2E` user agent (the Reader sees the visitor's agent). Timeout 1 s; any failure ignored
- [ ] T074 [US7] `admin:src/Pages/Website/WebsiteAnalyticsPage.tsx`, using the existing `@ant-design/charts`, with strings

---

## Phase 10: Polish & Cross-Cutting

- [ ] T075 [P] Run `yarn lint`, `yarn test` and `yarn build` in each repository for each slice, in the MAOS agent container. The API and Reader constitutions say `npm run`; these are the same package scripts run through Yarn, which the repositories pin
- [ ] T076 [P] Check direct load and refresh of every new admin route and Reader route on the Vercel preview (admin VIII, reader Development Workflow)
- [ ] T077 Lin runs quickstart.md on the test company after each deploy (`staging` gate), including the SC-002 load-time check
- [ ] T077a [P] Test that every key in `admin:src/i18n/messages/en.ts` exists in `cn.ts` and the reverse, and keyboard-only tests (tab to every control, Enter to activate) for each new admin page, in `admin:src/__tests__/i18n/websiteMessages.test.ts` and the page tests
- [ ] T078 Update `api:README.md` with the final routes and switch

---

## Dependencies & Execution Order

- Setup → Foundational → US1 → US2 → US3, which together are the MVP.
- US4, US5, US6 and US7 depend on US2.
- Image sections need `ASSET_TYPE_WEBSITE` (T008a, foundational) and the US5 API tasks (T056, T057, T059 to T061), which are slice 3, before publishing (slice 4). US5's admin tasks come later (slice 8).
- US2's preview scenario is met in US3 (T041a, the Reader route).
- Within each story: tests first and failing, then API, then Reader, then Admin. The API is deployed before its consumers.
- Slices follow plan.md "Delivery slices".

## Parallel Opportunities

- Tasks marked [P] in a story touch different files and can run together, for example T009, T010, T011 and T012 in US1.
- Reader and Admin work for a story can run in parallel once its API is deployed.

## Implementation Strategy

1. **MVP** = Foundational + US1 + US2 + US3, deployed slice by slice behind the switch, with Lin checking each slice on the test company.
2. Then US4, then US5 (moved earlier if images are wanted at MVP), then US6, then US7.
3. Turn the switch on for real companies only after the MVP passes quickstart steps 1 to 4 and 9.
