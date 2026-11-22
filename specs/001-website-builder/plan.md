# Implementation Plan: Website Builder

**Branch**: `SMN-53-website-builder` (the same name in each affected repository) | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-website-builder/spec.md`

## Summary

A company admin builds a small public website from a ShowMine template. The website is pages made of six section types, plus the company's own images, address, SEO and page-view counts. Visitors see a published copy at `<reader>/s/<name>`.

The API owns all data and rules:
- a website per company, pages with their sections stored as validated JSON, and one published copy;
- templates as versioned TypeScript modules;
- website images on the existing asset store;
- daily page-view counters.

The Reader renders the published copy, draft previews and template previews with one set of section components. The Admin adds a Website area.

Everything ships behind a per-company switch that only a super admin sets, because every merge to `master` deploys production. Decisions and alternatives are in [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript in all three repositories; Node.js 26.13.0; Yarn 1.22.22.

**Primary Dependencies**:
- API: Express 5, Sequelize 6.37, multer, AWS S3 (existing `S3Helper`), the existing `HtmlSanitizer`.
- Reader: Next.js 16 pages router, React 19, axios.
- Admin: Vite 8, React 19, Ant Design 6, Redux Toolkit, React Router 7, react-intl, TinyMCE.

No new dependencies.

**Storage**: PostgreSQL through Sequelize migrations. JSON is stored as TEXT through `defineJsonField`, as elsewhere. Images go to S3 behind the CDN.

**Testing**:
- API: Jest and Supertest on in-memory SQLite, migrations included; the route matrix covers every route.
- Reader and Admin: Vitest, jsdom and Testing Library, with a 90% functions coverage threshold.
- Admin and Reader E2E suites target production and are not run by MAOS (spec Assumptions).

**Target Platform**:
- API: Linux, PM2 behind nginx, deployed by CircleCI on merge to `master`.
- Reader and Admin: separate Vercel projects, deployed on merge to `master`.

**Project Type**: Web application across three repositories: `showmine-api`, `showmine-reader` and `showmine-admin`.

**Performance Goals**: A published page renders server-side in under 3 seconds on mobile (SC-002). It takes one API call, plus one for an articles section.

**Constraints**:
- Hidden behind `companies.websiteBuilderEnabled` until switched on.
- Additive API contract only.
- Reader CSP unchanged: previews open in a new tab, not an iframe.
- Reader server calls send the server key, as article pages do.
- Page JSON is at most 200 KB.

**Scale/Scope**:
- 7 user stories (SMN-55 to SMN-65).
- About 12 new API routes.
- 2 new Reader routes.
- About 7 new Admin pages.
- 3 templates and 6 section types.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### showmine-admin (v1.3.0)

| Principle | Check | Result |
|---|---|---|
| I Typed React architecture | Pages under `src/Pages/Website/`, components under `src/Components/Website/`, `WebsiteService` beside `CompanyService`, no new dependencies | Pass |
| II Authorization and tenant boundaries | Routes wrapped in `CompanyAdminRoute`; menu shown to company admins when the switch is on; the API stays the authority; tests for allowed and denied cases | Pass |
| III Cross-repository contracts | All new API routes are additive and documented in [contracts/](./contracts/). Reader and Admin are built against them, and their tests mock the documented shapes | Pass |
| IV Three-repository assessment | Spec "Repository Impact" names all three before implementation | Pass |
| V Browser configuration safe | No new `REACT_APP_*` values; uses the existing service layer and company header | Pass |
| VI Accessible and localized | Every string in `en.ts` and `cn.ts`; up and down buttons instead of drag-and-drop; loading, empty, success and error states (FR-025) | Pass |
| VII Verify behavior | Vitest per page and component; `yarn lint`, `yarn test`, `yarn build` before merge | Pass |
| VIII Vercel behavior | New client routes under `/b/company/website/`, checked by direct load in a Vercel preview | Pass |
| Development Workflow: feature starts in admin | This spec lives in `showmine-admin/specs/` | Pass |

### showmine-api (v1.2.0)

| Principle | Check | Result |
|---|---|---|
| I Feature starts in admin; API work links to it | API branch and PRs link to `showmine-admin/specs/001-website-builder` | Pass |
| II Three-repository assessment | As above | Pass |
| III Authorization and tenant isolation | App token, signed-in user, `comid` company and `validateCompanyRole(ROLE_ADMIN)` on every editing route; company-boundary tests in the route matrix and per route | Pass |
| IV Stable contracts | Additive only; consumers deploy after the API | Pass |
| V Data integrity | Sequelize migrations only, all additive, each with `down`; partial unique indexes; one published copy written in a transaction | Pass |
| VI Secrets and failures | The server key stays server-side; errors use the existing `{ message }` shape plus field `errors`; no stack traces to clients | Pass |
| VII Verify behavior | Jest per route, including migration up and down tests; `lint`, `test`, `build` | Pass |

### showmine-reader (v1.2.0)

| Principle | Check | Result |
|---|---|---|
| I Links to admin spec | Reader PRs link to this spec | Pass |
| II Three-repository assessment | Spec "Repository Impact" | Pass |
| III Public content reliably | Shows only the API's published copy or a valid preview; one not-found for every other case | Pass |
| IV API consumer contracts | Uses `AppService`, the existing service boundary | Pass |
| V Accessibility and performance | Semantic headings, `alt` on images, responsive layout; one server call per page | Pass |
| VI Verify behavior | Vitest for pages and section components; manual check of published, unpublished, missing and API-failure cases on the test company; `lint` and `build` | Pass |

### Recorded drift (not violations; reported, not changed)

- The admin constitution's Technical Constraints still say "React 18". The repository uses React 19.3.
- The reader's constitution says "Next.js 15, React 18". The repository uses Next.js 16.4 and React 19.3.
- Amending a constitution needs the project owner's approval, so this plan does not change either.
- API spec records 009 to 011 live in `showmine-api/docs/specs/`, against the "starts in admin" rule. This feature follows the rule. Moving the old records is not part of this work.

**Post-design re-check (after Phase 1)**: still passes. The design adds no dependencies, no browser secrets and no breaking contract changes. Every editing route keeps the role and company guards.

## Project Structure

### Documentation (this feature)

```text
showmine-admin/specs/001-website-builder/
├── spec.md
├── plan.md              # this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md           # API routes (consumed by Admin and Reader)
│   └── reader-routes.md # public Reader routes and their states
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (three repositories)

```text
showmine-api/
├── migrations/
│   ├── 20261122000000-add-websites.js           # US1
│   ├── 20261122000001-add-website-pages.js      # US2
│   ├── 20261122000002-add-website-template.js   # US4
│   ├── 20261122000003-add-website-domains.js    # US6
│   └── 20261122000004-add-website-page-views.js # US7
├── src/models/Website/        Website.ts, WebsitePage.ts, WebsitePageView.ts
├── src/helpers/               WebsiteHelper.ts (section schemas, publish, snapshot), PlanHelper.ts (maxPages)
├── src/templates/website/     index.ts, shop.ts, services.ts, simple.ts
├── src/controllers/Website/   WebsiteController.ts, WebsitePageController.ts, PublicWebsiteController.ts
├── src/controllers/Assets/    AssetController.ts (WEBSITE rules, usage, delete check)
├── src/helpers/S3Helper.ts    (WEBSITE type limits, delete S3 object when create fails)
├── src/queue/processor/AssetCleanUp.ts (WEBSITE check, references)
└── tests/                     controllers/Website/*, models/Website*Migration.test.ts, RouteMatrix.test.ts

showmine-reader/
├── src/pages/s/[slug]/[[...page]].tsx
├── src/pages/t/[id]/[[...page]].tsx
├── src/components/Website/    Site.tsx, Nav.tsx, sections/{Hero,Text,Image,Gallery,Contact,Articles}.tsx
├── src/serivices/WebsiteService.ts
├── src/styles/website.scss
├── public/templates/<id>.png
└── src/__tests__/{pages,components,services}/Website*

showmine-admin/
├── src/UrlMap.ts, src/Router.tsx, src/Components/Menu/MenuItems.tsx
├── src/Services/WebsiteService.ts
├── src/Types/Website/*.ts
├── src/Pages/Website/         Overview, Templates, Pages, PageEditor, Media, Settings, Analytics
├── src/Components/Website/    sections editors, MediaPicker, PublishBar
├── src/Components/Company/CompanyEditor.tsx (address)
├── src/i18n/messages/en.ts, cn.ts
└── src/__tests__/{pages,components,services}/Website*
```

**Structure Decision**: These are the existing three repositories and their existing folder conventions. No new packages or projects.

### Delivery slices (one branch and PR per repository per slice; Lin merges, API first)

This table sets the order of work; the phases in tasks.md group tasks by story, not by time.

| Slice | Stories | Jira | Repositories |
|---|---|---|---|
| 1 | US1 data and API | SMN-56 | api |
| 2 | US2 data and API | SMN-60 | api |
| 3 | US5 API | SMN-62 | api |
| 4 | US3 publish and public view | SMN-63, part of SMN-64 | api, then reader |
| 5 | US4 templates | SMN-58, SMN-57 (preview) | api, then reader |
| 6 | US1 admin | SMN-55 | admin |
| 7 | US4 admin | SMN-57 | admin |
| 8 | US5 admin | SMN-61 | admin |
| 9 | US2 admin (editor and preview) | SMN-59 | api (preview token), admin |
| 10 | US6 | SMN-64 | api, admin |
| 11 | US7 | SMN-65 | api, reader, admin |

## Complexity Tracking

No constitution violations to justify.
