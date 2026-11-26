---

description: "Task list for the website visual editor, layout and page templates"
---

# Tasks: Website Visual Editor, Layout and Page Templates

**Input**: Design documents from `/specs/004-website-visual-editor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by all three constitutions (VII): every behaviour change has tests at the narrowest useful level.

**Organization**: by user story; each story is one delivery slice (research R7), started and merged only with Lin's
approval.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependencies)
- Paths are prefixed `admin:`, `api:` or `reader:`.

---

## Phase 1: Setup

- [x] T001 Branch per repository and slice from `master`, linking this spec in each PR

---

## Phase 2: User Story 1 - Edit a page like an article (P1) 🎯 slice 1, admin only

**Goal**: title row with actions and an Options menu; content fills the rest.

**Independent Test**: spec US1.

- [x] T002 [P] [US1] Tests in `admin:src/__tests__/pages/Website/WebsitePageEditPage.test.tsx`: title row reads "Editing: <title>"; Save, Preview, Options for a member; Publish and Delete page for an admin; title, address name and SEO edited in Options are saved with the same checks; unsaved changes warn before leaving
- [x] T003 [US1] Options drawer in `admin:src/Pages/Website/WebsitePageEditPage.tsx` (kept in the page for now; moved to `admin:src/Components/Website/PageOptions.tsx` in T022 when the template joins it): title, address name, SEO (existing `SeoFields`) and, for admins, Delete page with confirmation
- [x] T004 [US1] `admin:src/Pages/Website/WebsitePageEditPage.tsx`: title row via `BackendPageContentTitle` controls, as `ArticleDetailsPage`; publish moves into the title row for admins; strings in en/cn

- [x] T004a [US1] SMN-85 (Lin, 2026-11-26): title row as the article editor: Save, Publish (admins, cloud icon) and an Options dropdown (Preview, Page settings, Back to pages, Delete page for admins, confirmed in a dialog); the Options drawer goes, its fields move to the panel's Settings tab

**Checkpoint**: the page editor works as today, rearranged.

---

## Phase 3: User Story 2 - Canvas and side panel (P1) 🎯 slice 2, Reader then admin

**Goal**: the page drawn as the website shows it; select a block, edit it in the side panel.

**Independent Test**: spec US2.

- [x] T005 [US2] `reader:public/website.css`: the site styles moved from `reader:src/styles/website.scss` as plain CSS (nested rules written out), linked by the website pages, served with `Cache-Control: public, max-age=300` and `Access-Control-Allow-Origin: *` (`reader:next.config.js`); tests that each block's class names are styled and that the file has no `@media` rule (research R2)
- [x] T006 [P] [US2] Tests in `admin:src/__tests__/components/Website/Canvas/SiteCanvas.test.tsx`: blocks in order with the Reader's class names, theme variables, device widths, selection, toolbar up/down/delete, problems marked; 30 blocks redraw within budget (SC-003)
- [x] T007 [US2] `admin:src/Components/Website/Canvas/{SiteCanvas,canvasBlocks}.tsx`: canvas reading `${REACT_APP_FRONT_END_URL}/website.css` into a `<style>`, a note when it is not set or fails; unsaved HTML through `DOMPurify` (3.4.17) with the API's allow-list and inert links (research R2a; new dependency); `admin:vercel.json` unchanged (research R2)
- [x] T008a [US2] SMN-85 (Lin, 2026-11-26): canvas, toolbar and panel as the MConnect form designer (mgg-ui `DesignTab`, `designCanvas`, `BlockPalette`): device icon bar with Preview, grey canvas, hover and selected outlines, corner tools (edit, up, down, remove), clicking the canvas around the page unselects; the panel with a tab rail (Blocks, Settings), block tiles in `admin:src/Components/Website/Canvas/BlockPalette.tsx`, a selected block with Back; nothing selected on load; a new block goes at the end
- [x] T008 [US2] `admin:src/Pages/Website/WebsitePageEditPage.tsx`: canvas in the main area, panel (reusing `SectionEditors`) and palette (adds by click, after the selected block) on the right, folding below on narrow screens
- [x] T008b [US2] SMN-86 (Lin, 2026-11-26): website menu as showmine.com.au: below 1024 px of site width (`@container` in `reader:public/website.css`) the links fold behind a Menu button and open stacked below, current page marked with a dot; Close, Escape or a link closes it; `reader:src/components/Website/Nav.tsx` and the canvas menu in `admin:src/Components/Website/Canvas/SiteCanvas.tsx` share the markup

---

## Phase 4: User Story 3 - Drag and drop (P1) 🎯 slice 3, admin only

**Goal**: add and move blocks by dragging, and by keyboard.

**Independent Test**: spec US3.

- [ ] T009 [US3] Add `@dnd-kit/core` 6.3.1 and `@dnd-kit/sortable` 10.0.0 to `admin:package.json` (research R1)
- [ ] T010 [P] [US3] Tests: keyboard add/move/remove with announcements (SC-004) and the 30-block limit refused with the reason; drag with a pointer cannot run in jsdom, so it is checked by hand (quickstart step 3)
- [ ] T011 [US3] Drag sources in `BlockPalette`, sortable blocks and drop placeholders in `SiteCanvas`, announcements in en/cn

---

## Phase 5: User Story 4 - Site layout (P2) 🎯 slice 4, API then Reader then admin

**Goal**: one layout for the whole site.

**Independent Test**: spec US4.

Slice 4a (SMN-87a, Lin 2026-11-26): header, footer, theme.

- [ ] T012 [P] [US4] API tests: `PUT /website` `layout` for admins (members 401), stale with `updatedAt` (R5a superseded), absent vs null `layout`, field checks and paths (header links, footer columns and items, urls, unknown fields), footer images checked and counted as used (usage, delete 409, clean-up), published copy carries `layout` with image addresses, `contentChangedAt` set; theme colours and `contentWidth`; migration up and down
- [ ] T013 [US4] `api:migrations/20261126000000-add-website-layout.js` (`websites.layout`), model field, layout checks in `api:src/helpers/WebsiteHelper.ts`, theme keys and `PUT /website` in `api:src/controllers/Website/WebsiteController.ts`, publish copy, image use and clean-up
- [ ] T014 [P] [US4] Reader tests: header (logo and name switches, hidden pages, outside links also in the folded menu), footer columns and items, copyright, theme variables; a copy without `layout` shows as today (SC-005)
- [ ] T015 [US4] `reader:src/components/Website/{Site,Nav,Footer}.tsx`, `reader:public/website.css`
- [ ] T016 [P] [US4] Admin tests: Layout page for admins (header, footer, theme tabs, save, stale), read-only for members, menu entry; the page editor's canvas shows the layout's header, footer and theme
- [ ] T017 [US4] `admin:src/Pages/Website/WebsiteLayoutPage.tsx` (header, footer and theme on the canvas; the only place the theme is edited), `admin:src/UrlMap.ts`, route in `admin:src/Router.tsx`, menu Website > Layout

Slice 4b (SMN-87b): shared blocks.

- [ ] T017b [US4] Shared blocks above and below: API checks (as sections, at most 10 in all), image use, copy; Reader draws them; the Layout page's Blocks tab with the palette

- [ ] T017a [US4] Starter templates set a layout (`api:src/templates/website/`), shown by the Reader template preview (`/t/<id>`); applying one replaces the layout (spec edge case)

---

## Phase 6: User Story 5 - Page templates (P2) 🎯 slice 5, API then Reader then admin

**Goal**: a page can override the layout.

**Independent Test**: spec US5.

- [ ] T018 [P] [US5] API tests: `template` on page create and update (members allowed), checks, published copy, page marked changed
- [ ] T019 [US5] Page `template` in `api:src/controllers/Website/WebsitePageController.ts` and the publish copy
- [ ] T020 [P] [US5] Reader tests: hidden header/footer, own header/footer/theme, shared blocks left out, other pages unchanged
- [ ] T021 [US5] Effective layout per page in `reader:src/components/Website/Site.tsx`
- [ ] T022 [US5] Page template in `admin:src/Components/Website/PageOptions.tsx`; the canvas shows the effective layout

---

## Phase 7: Polish

- [ ] T023 Update `api:README.md` (layout and template fields) and `specs/001-website-builder` cross-references
- [ ] T024 Lin runs `quickstart.md` on the test company after each slice is deployed

---

## Dependencies & Execution Order

- Slices in order: US1 → US2 → US3 → US4 → US5 → Polish. US2 needs US1's layout of the screen; US3 needs US2's canvas; US5 needs US4's layout.
- Within a slice: API first, then Reader, then admin; tests with the code, before the PR.
- Every new API field is optional, so each repository can deploy alone without breaking the others.

## Implementation Strategy

Each slice: plan approved by Lin → code and tests → checks in the MAOS agent container (lint, tests, coverage, build) → mutation checks → one independent review → PRs → Lin approves the merge → Lin checks on the test company.
