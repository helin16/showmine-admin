# Implementation Plan: Website Visual Editor, Layout and Page Templates

**Branch**: `004-website-visual-editor` | **Date**: 2026-11-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-website-visual-editor/spec.md` (approved by Lin, 2026-11-25)

## Summary

Replace the website page editor with an article-style editor: a title row with actions and an Options menu, and a
canvas that draws the page with the Reader's own stylesheet at three device widths, a block palette and a side panel
for the selected block, with drag and drop (dnd-kit, keyboard included). Add a site-wide Layout (header, footer, theme,
shared blocks) and per-page templates that override it, stored as JSON on the website and the page, published with the
site and shown by the Reader. Delivered in five slices (research R7).

## Technical Context

**Language/Version**: TypeScript; admin React 19 with Vite; Reader Next.js 16; API Node with Express and Sequelize

**Primary Dependencies**: admin: Ant Design 6, react-intl, Redux Toolkit; new `@dnd-kit/core` 6.3.1 and
`@dnd-kit/sortable` 10.0.0 (research R1) and `dompurify` (R2a). API and Reader: none new.

**Storage**: Postgres (SQLite in API tests): `websites.layout` and `websitePages.template`, JSON text (data-model.md)

**Testing**: admin Vitest and Testing Library; Reader Vitest; API Jest with supertest; mutation checks per slice

**Target Platform**: admin and Reader on Vercel; API on the ShowMine server (deployed by Lin's pipeline)

**Project Type**: web application across three repositories

**Performance Goals**: a panel change shows on the canvas within 100 ms on a page of 30 blocks (SC-003)

**Constraints**: published sites unchanged until republished (SC-005); every new API field optional; behind the
per-company website switch; no E2E (admin and Reader suites target production)

**Scale/Scope**: one layout per website; pages limited by plan (free 5, starter 20); six block types

## Constitution Check

*GATE: checked before research and again after design.*

| Principle | Admin | API | Reader | Status |
|---|---|---|---|---|
| Typed architecture; new dependency justified | dnd-kit for keyboard and touch drag (R1) | no new dependency | none | Pass |
| Authorization and tenant boundaries | canvas shows Layout read-only to members; API decides | Layout admin guards, template member guards (R6); tests for both | public copy only | Pass |
| Cross-repository contracts | consumes new optional fields | additive fields, old clients unaffected | reads `layout`, falls back when absent | Pass |
| Every repository assessed | spec Repository Impact | same | same | Pass |
| Browser configuration safe | `REACT_APP_FRONT_END_URL` is public already; unsaved HTML cleaned on the canvas with DOMPurify, links inert (R2a) | n/a | n/a | Pass |
| Accessible and localized | keyboard drag, announcements, en/cn strings | messages as today | landmark roles for header/footer | Pass |
| Verify observable behaviour | tests per slice, functions coverage 90% | tests per route and rule | tests for the effective layout | Pass |
| Vercel deployment | new admin routes load on direct navigation; `vercel.json` unchanged: the canvas fetches the styles (R2) | n/a | static `/website.css` with a short cache, readable by any site (R2) | Pass |

## Project Structure

### Documentation (this feature)

```text
specs/004-website-visual-editor/
├── spec.md
├── plan.md              # this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api.md
│   └── reader-routes.md
└── tasks.md
```

### Source Code

```text
showmine-admin/src/
├── Pages/Website/WebsitePageEditPage.tsx        # slice 1: title row + Options; slice 2: canvas layout
├── Pages/Website/WebsiteLayoutPage.tsx          # slice 4: the Layout editor (admins)
├── Components/Website/PageOptions.tsx           # slice 5: Options moved here with the template (slice 1 keeps it in the page)
├── Components/Website/Canvas/
│   ├── SiteCanvas.tsx                           # slice 2: effective layout + blocks, device widths, selection
│   ├── canvasBlocks.tsx                         # slice 2: block markup copied from the Reader (class names pinned)
│   └── BlockPalette.tsx                         # SMN-85: block tiles (click); slice 3 adds drag sources
└── Components/Menu/MenuItems.tsx                # slice 4: Website > Layout (admins)

showmine-api/
├── migrations/2026112200000N-add-website-layout.js   # slices 4 and 5
├── src/helpers/WebsiteHelper.ts                 # layout and template checks, published copy, image use
├── src/controllers/Website/{Website,WebsitePage,PublicWebsite}Controller.ts
└── src/queue/processor/AssetCleanUp.ts          # layout images in use

showmine-reader/
├── public/website.css                           # slice 2: moved from src/styles/website.scss
└── src/components/Website/{Site,Nav,Footer}.tsx # slices 4 and 5: effective layout
```

**Structure Decision**: existing folders of each repository; the canvas gets its own folder under
`Components/Website` because it has four parts that only it uses.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New dependency (dnd-kit) | FR-004 and SC-004: keyboard and touch drag with announcements | Browser drag and drop has neither; writing both by hand is larger and riskier |
| New dependency (DOMPurify) | The canvas shows unsaved HTML inside the signed-in admin (R2a) | A hand-written cleaner is riskier; plain text is not what you see is what you get |
| Block markup in two repositories | Spec: draw in the admin, not embed the Reader | Embedding was rejected by Lin; a shared package is more than two small copies need now |
