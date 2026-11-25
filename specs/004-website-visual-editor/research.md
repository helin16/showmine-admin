# Research: Website Visual Editor, Layout and Page Templates

## R1. Drag and drop

- **Decision**: `@dnd-kit/core` 6.3.1 and `@dnd-kit/sortable` 10.0.0 (released December 2024, React peer `>=16.8`).
- **Rationale**: FR-004 and SC-004 need every drag to work by keyboard with screen-reader announcements. dnd-kit has a keyboard sensor and live-region announcements built in, and sortable lists with drop placeholders. The browser's own drag and drop has no keyboard support, does not work on touch screens, and would need all of that written by hand. This is the stated need the admin constitution (I) asks a new dependency to meet.
- **Alternatives**: native HTML5 drag and drop (no keyboard or touch); `react-beautiful-dnd` (archived); `@hello-pangea/dnd` (lists only, no drag from a palette into a list).

## R2. The canvas looks like the website

- **Decision**: the Reader's site styles become one plain CSS file the Reader serves at `/website.css` (all rules under `.site`, colours from CSS variables, as today). The Reader links it on website pages; the admin canvas links the same file from the Reader's address (`REACT_APP_FRONT_END_URL`). The block markup (class names and structure) is copied into the admin canvas from the Reader's `components/Website`.
- **Rationale**: one stylesheet for both, so a style change shows on the canvas without an admin release (SC-002). Spec assumption: draw in the admin, not embed the Reader. Markup is small (about 160 lines) and changes rarely.
- **Ceiling**: two copies of the markup. A test in each repository pins the class names each block uses; a shared package if the copies drift.
- **Alternatives**: embedding the Reader preview in a frame (rejected by Lin: slow, needs cross-window messages); copying the styles into the admin (two stylesheets to keep in step).
- **Dependency**: `REACT_APP_FRONT_END_URL` must be set on the admin (it already must, for preview links). Without it the canvas shows unstyled blocks and says so.
- **Content Security Policy**: the admin's `vercel.json` allows styles only from itself and TinyMCE; the Reader's origin is added to `style-src` (and nothing else), in the same slice, with a test that reads `vercel.json`.
- **Caching**: the Reader serves `/website.css` with a short cache (`Cache-Control: public, max-age=300`) set in its `next.config.js`, so the canvas and the site never differ for long after a style change. The file is plain CSS: the four nested rules (`&.site-font-*`) are written out.
- **Device widths**: the canvas narrows a container, it does not change the window, so the site styles must keep using container-independent layout (today: grid `auto-fill`, no `@media` rules). New header and footer styles follow the same rule; a test in the Reader fails on `@media` in `website.css`.

## R2a. Unsaved content on the canvas

- **Decision**: the canvas shows unsaved text through `DOMPurify` (new admin dependency, a version at least two weeks old), with the same allow-list the API applies on save (001 FR-008), and canvas links do nothing when clicked (no navigation, `javascript:` and other schemes dropped).
- **Rationale**: the canvas renders HTML typed in the admin before the API has cleaned it, inside the signed-in admin. Admin constitution V.
- **Alternatives**: a hand-written cleaner (riskier); rendering text blocks as plain text (not what you see is what you get).

## R3. Storing the layout and page templates

- **Decision**: `websites.layout` and `websitePages.template`, JSON text columns (as `sections` and `seo` are), both nullable. Null means "as today": header with logo, name and every page; no footer; no shared blocks; page follows the layout. The theme stays in `websites.theme`.
- **Rationale**: the layout and templates are read and written whole with their website or page, checked by the same helpers as sections, and versioned by the same `updatedAt`. No joins, no new tables. Null defaults keep every published site unchanged (SC-005, FR-010).
- **Alternatives**: separate tables for header, footer and shared blocks (more queries, nothing gained at one layout per site).

## R4. Publishing

- **Decision**: the published copy gains `layout` (header, footer, shared blocks with image addresses resolved, built like sections) and each page's `template`. The Reader works out each page's effective layout. Saving a layout or a page template sets `contentChangedAt`, so the site shows changes to publish.
- **Rationale**: FR-009; the Reader already reads everything it shows from the published copy.

## R5. Images in the layout

- **Decision**: shared blocks' images count as used by the website: `getImageUsage`, the publish checks and the clean-up (`TEXT_REFERENCES`) read `websites.layout` too. Page templates hold no images.
- **Rationale**: 001 FR-017 and FR-019, and SMN-80's one image library.

## R5a. Saving the layout without false stale errors

- **Decision**: `websites.layoutUpdatedAt` versions the layout alone. `PUT /website` with `layout` needs `layoutUpdatedAt` as loaded; an absent `layout` leaves it unchanged; `layout: null` resets it to the default. Other website saves (settings, SEO, address, publishing) neither need nor move it, so they cannot make a layout save stale, and the reverse.
- **Rationale**: `websites.updatedAt` moves on every website save; using it would refuse layout saves after unrelated edits.

## R5b. Limits

- **Decision**: a page keeps 001's limit of 30 own blocks; the layout has at most 10 shared blocks in all (above and below). Both are checked when saved, so a page never fails at publish because of shared blocks. The canvas shows "n of 30" for the page's own blocks.

## R6. Who may change what

- **Decision**: `PUT /website` (admin guards) takes `layout`; `PUT /website/pages/:id` (member guards) takes `template`. No new routes.
- **Rationale**: FR-007, FR-008 and the clarifications; reuses SMN-80's guards and stale-save checks.

## R7. Slices

1. Editor shell with Options (admin only; no API change).
2. Canvas and side panel (Reader: serve `/website.css`; admin: canvas). Reader first.
3. Drag and drop (admin only; the new dependency).
4. Layout (API, then Reader, then admin).
5. Page templates (API, then Reader, then admin).

Slice 4 also makes the starter templates set a layout (spec edge case), since applying one replaces the layout.
The theme is edited in the Layout editor only; today no admin screen edits it (starter templates set it).

Note: the Reader constitution names Next.js 15 and React 18; the Reader runs Next.js 16.4 and React 19.3. Amending it is Lin's decision; this plan follows the code.

Each slice is behind the website switch, has its own PRs, checks, mutation checks and one independent review, and needs Lin's approval to start and to merge.
