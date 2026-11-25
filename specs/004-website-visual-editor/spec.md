# Feature Specification: Website Visual Editor, Layout and Page Templates

**Feature Branch**: `004-website-visual-editor`

**Created**: 2026-11-25

**Status**: Draft, for Lin's approval

**Input**: User description (Lin, 2026-11-25, while checking the test company): "Make the page edit like the article edit, with most things moved into Options. Make the main part drag and drop, like the form builder in the third screenshot: what you see is what you get. Give all pages a layout; each page has its own template, and a page's template can override the layout."

Builds on `specs/001-website-builder` (pages, sections, publishing, images) as amended by SMN-80 (members edit pages), SMN-81 (website name and address) and SMN-82 (page views on the dashboard). Section types, their fields and their rules do not change.

## Repository Impact *(required by all three constitutions)*

| Repository | Impact |
|---|---|
| `showmine-admin` | Affected. A new page editor: a title row with actions and an Options menu, a canvas that shows the page as the website shows it, a block palette, a panel for the selected block, drag and drop with a keyboard alternative, and device widths. A new Layout editor for the whole site, and page template settings in each page's Options. |
| `showmine-api` | Affected. Stores the site layout (header, footer, theme, shared blocks) and each page's template (what it overrides), checks them as sections are checked today, and puts them in the published copy. A migration adds them. The new fields are optional, so the current admin and Reader keep working during the deploy. |
| `showmine-reader` | Affected. Shows each page with the layout's header, footer, theme and shared blocks, as its page template overrides them. Pages without layout data look as they do today. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit a page like an article (Priority: P1)

A member opens a page and sees it edited like an article: a title row reading "Editing: <page title>" with the main actions (Save, Preview, and Publish for admins) and an Options menu. Everything that is not the page's content moves into Options: title, address name, search and sharing (SEO), page template, and Delete page (admins). The rest of the screen is for the content.

**Why this priority**: It clears the screen for the visual canvas and matches the article editor people already know.

**Independent Test**: Open a page, change its title and SEO from Options, save, reload and see them kept; as a member, see no Publish and no Delete.

**Acceptance Scenarios**:

1. **Given** a page, **When** a member opens it, **Then** the title row shows "Editing: <title>", Save and Preview, and an Options menu; an admin also sees Publish, and Delete page inside Options.
2. **Given** Options, **When** the title, address name or SEO is changed and saved, **Then** they are kept, with the same checks and messages as today.
3. **Given** unsaved changes, **When** the member leaves the page or closes the tab, **Then** they are warned first.

---

### User Story 2 - See the page as the website shows it, and edit a block in place (Priority: P1)

The main area is a canvas that shows the page with the site's header, footer, theme and blocks as visitors will see them. The member switches between desktop, tablet and phone widths. Clicking a block selects it: it is outlined, with a small toolbar (edit, up, down, delete), and the right-hand panel shows its fields. Every change in the panel shows on the canvas at once. With nothing selected, the right-hand panel shows the block palette.

**Why this priority**: What you see is what you get is the point of the change.

**Independent Test**: Select a hero block, change its heading in the panel and see the canvas change as you type; switch to phone width and see the phone layout; save and preview, and see the same in the preview.

**Acceptance Scenarios**:

1. **Given** a page with blocks, **When** it opens, **Then** the canvas shows them in order, styled with the site's theme, between the header and footer the page uses.
2. **Given** a selected block, **When** a field changes in the panel, **Then** the canvas shows the change without saving.
3. **Given** a device choice of desktop, tablet or phone, **Then** the canvas uses that width and the layout the website uses at that width.
4. **Given** the selected block's toolbar, **When** up, down or delete is used, **Then** the block moves or is removed (delete asks first), and nothing is saved until Save.
5. **Given** a block with a problem (a required field empty, an image that is missing), **Then** it is marked on the canvas and its problems show in the panel, as the API reports them on save.

---

### User Story 3 - Build a page by drag and drop (Priority: P1)

The palette lists the block types (hero, text, image, gallery, contact details, latest articles). A member drags one onto the canvas to the place it should go, or clicks it to add it after the selected block (or at the end). Blocks already on the canvas are dragged to a new place. Everything that can be done by dragging can also be done with the keyboard.

**Why this priority**: Arranging blocks by hand is the main work of building a page.

**Independent Test**: Drag an image block between two blocks, drag it back to the top, then do the same with the keyboard only; save and see the order kept.

**Acceptance Scenarios**:

1. **Given** the palette, **When** a block type is dropped between two blocks, **Then** a new block of that type is inserted there and selected.
2. **Given** the palette, **When** a block type is clicked, **Then** it is added after the selected block, or at the end when none is selected.
3. **Given** a block on the canvas, **When** it is dragged to another place, **Then** it moves there.
4. **Given** keyboard use only, **Then** blocks can be added from the palette, selected, moved and removed, with each change announced.
5. **Given** a page at its plan's limits (sections per page, page size), **When** another block is added, **Then** the member is told why it cannot be.

---

### User Story 4 - Set the site layout (Priority: P2)

An admin edits the Layout once for the whole site: a header (logo, website name, menu of pages), a footer (contact details, a short text, links), the theme (main colour and fonts, as today) and shared blocks that appear on every page, above or below its own blocks. Shared blocks are built on the same canvas, with the same palette. Layout changes, like page changes, go live when the site is published.

**Why this priority**: Header, footer and shared blocks repeat on every page; editing them once saves work and keeps the site consistent.

**Independent Test**: Add a shared "contact details" block below every page and a footer text; open two pages on the canvas and see both; publish and see them on both pages of the public site.

**Acceptance Scenarios**:

1. **Given** the Layout editor, **When** an admin changes the header, footer, theme or shared blocks and saves, **Then** every page's canvas shows the change and the site shows it has changes to publish.
2. **Given** the header menu, **Then** it lists the site's pages in their order; an admin can hide a page from the menu.
3. **Given** a member, **Then** they can see the layout on the canvas but not change it.
4. **Given** a published site, **When** the layout changes, **Then** visitors see the old layout until the next publish.

---

### User Story 5 - Override the layout on one page (Priority: P2)

In a page's Options, its page template can, for that page only: hide the header or the footer, use its own header or footer instead, use its own theme, or leave out the shared blocks. The canvas shows the page with its overrides. A page with no overrides follows the layout.

**Why this priority**: Landing pages and special pages need to look different without changing the whole site.

**Independent Test**: Give one page no header and its own main colour; see both on its canvas and on the public site, and see other pages unchanged.

**Acceptance Scenarios**:

1. **Given** a page template that hides the header, **Then** that page shows no header on the canvas and on the public site; other pages keep it.
2. **Given** a page template with its own footer or theme, **Then** that page uses them; the layout's are unchanged.
3. **Given** a page template that leaves out the shared blocks, **Then** that page shows only its own blocks.
4. **Given** a page template is cleared, **Then** the page follows the layout again.

---

### Edge Cases

- Two people edit the same page or the layout: the second save is refused as stale, as today, with Reload and Keep mine for pages.
- A page that the layout's menu links to is deleted or renamed: the menu follows; a menu entry never points to a missing page.
- A shared block uses an image that is then deleted: refused as today, since the layout counts as using it (001 FR-017).
- The canvas on a narrow admin screen: the palette and panel fold below the canvas; the editor stays usable on a tablet. Building on a phone is not a goal.
- A very long page or a large gallery: the canvas stays responsive (SC-003).
- Starter templates (the existing "Choose a template") also set a layout; applying one asks first, as today, and replaces the layout too.
- Previews and the public site show the same layout and overrides as the canvas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page editor MUST have a title row ("Editing: <title>") with Save, Preview and, for admins, Publish, and an Options menu holding the page title, address name, SEO, page template and, for admins, Delete page.
- **FR-002**: The canvas MUST show the page with its effective layout (header, footer, theme, shared blocks, after the page's overrides) and its blocks, styled as the public website shows them, at desktop, tablet and phone widths.
- **FR-003**: Selecting a block MUST show its fields in a side panel; changes MUST show on the canvas at once and be saved only by Save.
- **FR-004**: Blocks MUST be addable from a palette by drag and drop and by click, and movable by drag and drop and by the selected block's up and down controls. Every action MUST also work with the keyboard and be announced to screen readers.
- **FR-005**: Section types, their fields, limits and checks MUST stay those of 001 (FR-006 to FR-008 and plan limits); the API remains their authority.
- **FR-006**: The site MUST have one Layout: header (logo, website name, menu of its pages with each page shown or hidden), footer (contact details shown or hidden, a short text, a few links), theme (as 001), and shared blocks above and below each page's own blocks.
- **FR-007**: Only admins MAY change the Layout; members MAY see it on the canvas.
- **FR-008**: Each page MAY have a page template, which members MAY change, that, for that page only, hides the header and/or footer, replaces them with its own, sets its own theme, or leaves out the shared blocks. With none, the page follows the layout.
- **FR-009**: The layout and page templates MUST be part of the published copy: changing them MUST mark the site as having changes to publish, and visitors MUST see them only after publishing.
- **FR-010**: The Reader MUST show each published page with its effective layout. A page published before this feature MUST look as it does today.
- **FR-011**: The editor MUST keep 001's guarantees: stale saves refused, unsaved changes warned before leaving, company switches never mixing data, and every screen in English and Chinese.

### Key Entities

- **Layout**: one per website. Header (logo shown or not, menu entries by page with a shown flag), footer (show contact details, text, links), theme, shared blocks above and below.
- **Page template**: on each page. Header: layout, hidden or own; footer: layout, hidden or own; theme: layout or own; shared blocks: included or left out. An own header, footer or theme has the same shape as the layout's.
- **Published copy**: as 001, plus the layout and each page's effective layout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member who has not used the editor builds a three-block page (hero, text, image) and saves it in under five minutes, without help.
- **SC-002**: The canvas and the public site show the same blocks, order, text, images and colours for the same draft at each of the three widths (checked on the test company for every block type).
- **SC-003**: A change in the panel shows on the canvas within 100 ms on a page of 30 blocks.
- **SC-004**: Every editor action can be done with the keyboard only (checked by test for add, select, move, remove and save).
- **SC-005**: Sites published before this feature look the same after it is deployed.

## Assumptions

- Names: "Layout" (布局) is the site-wide header, footer, theme and shared blocks; "page template" (页面模板) is a page's overrides; the existing "Choose a template" (选择模板) stays the starter for a whole site and now also sets a layout.
- The canvas draws blocks in the admin with the Reader's styles, not by embedding the Reader (Lin, 2026-11-25); SC-002 checks they stay in step.
- A block is edited in the side panel, not by typing on the canvas (Lin, 2026-11-25).
- Members edit pages and their page templates (SMN-80, Clarifications); only admins change the Layout, publish and delete pages.
- How drag and drop is built (a library or the browser's own) is decided in the plan; a new dependency must be justified (admin constitution I).
- No new block types, and no code view (the form builder's `</>`): out of scope.
- Delivered in slices, API first each time: (1) editor shell with Options; (2) canvas and side panel; (3) drag and drop; (4) layout; (5) page templates.

## Clarifications

### Session 2026-11-25

- Q: May members change a page's template (its overrides), or only admins? → A: Members may, as for the page's content; only admins publish (Lin).
- Q: Does the header menu list only the site's pages, or also outside links? → A: Only the site's pages, in their order, each shown or hidden (Lin).
