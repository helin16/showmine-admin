# Feature Specification: Website pages matching showmine.com.au (Pricing, Blog, Contact)

**Feature Branch**: `feature/SMN-94-pages` | **Created**: 2026-11-28 | **Status**: Approved (Lin, in chat)
**Jira**: SMN-94 | **Builds on**: specs/005 (blocks), specs/007 (map for China), specs/008 (airy style)

## User Story 1: page layouts like the original (P1)

An admin can put two blocks side by side, run a hero or map edge to edge, give a hero dark text, show a picture of the
map in China, and list articles as a large first post beside a list of titles. The canvas shows the same as the Reader.

**Acceptance**: 1. Any block has "Side by side with the next block"; two consecutive such blocks share a `site-row`
(pairs only: of three, the first two pair). 2. Hero and Map have "Full width" (`site-full`); Hero has "Dark text on the
picture" (`dark-text`). 3. Map has a picture from the website images with alt text, for China. 4. Articles have a
layout, Grid or Featured (`featured`). 5. Switched off, the key is removed; blocks without the fields look as before.

## Requirements

- FR-001 API: `sideBySide`, `fullWidth`, `darkText`, `layout`, map `imageAssetId` and `imageAlt` (contract.md).
- FR-002 Reader: `site-row`, `site-full`, `dark-text`, `featured`, the map picture; CSS.
- FR-003 Admin: the controls above in the block editors (side by side once, in the shared editor), the same classes on
  the canvas (`Canvas/getRows.ts` holds the pairing rule), en and cn strings. No migration.

## Out of scope

More than two blocks in a row, other article layouts, a map picture made automatically, showing the map picture in the
canvas (it shows the main map link).
