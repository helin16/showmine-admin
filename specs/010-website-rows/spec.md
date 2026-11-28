# Feature Specification: Website Row, Buttons and Tile blocks; shared blocks hidden on chosen pages

**Feature Branch**: `feature/SMN-96-rows` | **Created**: 2026-11-28 | **Status**: Approved (Lin, in chat 2026-11-28)
**Jira**: SMN-95, SMN-96 | **Builds on**: specs/004 (canvas, shared blocks), specs/005 (blocks), specs/009 (pairing, getRows)
**Plans**: `workspace/SPEC-010/plan-smn95.md`, `workspace/SPEC-011/plan-row.md` | **Contract**: `workspace/SPEC-011/contract.md`
(the source of truth for fields and for the Reader markup the canvas copies)

## User Story 1: rows of blocks (P1)

An admin can add a Row, put blocks in it (also a row, one level deep), and set how the row lays them out: boxed or
full width, background, padding, direction, wrap, justify, align and gap. A block inside a row can take a share of the
row's width. The canvas draws the row exactly as the Reader does, and a block inside a row is picked on the canvas by
clicking it, as a page block is.

**Acceptance**: 1. The palette has Row, Buttons and Tile. 2. The Row editor sets the options; a default is left out of
the block. 3. The Row editor lists its blocks with add, edit, up, down and remove (same names as the page's, such as
`Edit 2. Tile`); editing a block inside opens its editor with "Back to the row". 4. New blocks get their own ids. 5. A
row inside a row is offered; a third level is not. 6. A block inside a row has a "Width" choice (basis); a page block
does not. 7. At most 12 blocks in a row; the page's 30 (the layout's 10) count nested blocks. 8. An empty row is
refused before saving. 9. Image ids, problem paths and selection reach blocks inside rows.

## User Story 2: Buttons and Tile blocks (P1)

Buttons: the band's button fields as a block of their own. Tile: an icon from the website images, alt text, title,
text and an optional link. Both draw as the Reader's.

## User Story 3: shared blocks hidden on chosen pages (P1, SMN-95)

On the Layout page a shared block's editor has "Show on" with one checkbox per page, all ticked when `hiddenPageIds`
is absent (as the header's pages). Unticking adds the page id; ticking all removes the field. The page editor's
canvas leaves out a shared block hidden on the page it draws.

## Requirements

- FR-001 Types: `ROW_OPTIONS`, `BASES`, `MAX_ROW_BLOCKS` (contract values and defaults).
- FR-002 Editors in `SectionEditors.tsx` (row, buttons, tile; basis and Show on in the shared wrapper); the
  nested walks in `sectionTree.ts` (find by id, replace, count, problem ids), used by both pages.
- FR-003 Canvas: `canvasBlocks.tsx` Row, Buttons, Tile with the contract's markup; `SiteCanvas.tsx` hides shared blocks
  hidden here and passes the selection into rows.
- FR-004 en and cn strings. No migration; absent fields keep today's behaviour.

## Out of scope

Moving a block into or out of a row (add it in the row, remove the old one), a third level, drag and drop, hiding a
page's own blocks, hiding the header or footer per page.

## Notes on the contract

- On the Layout page the shared blocks are the editable ones; one hidden on the sample page is drawn faded rather than
  left out, so it can still be picked.
- The canvas wraps each top-level block in `.canvas-item`, so the Reader's `.site-page > .site-flex` rule does not
  match there; the canvas adds the same edge-to-edge rule for `.site-page > .canvas-item > .site-flex`.
