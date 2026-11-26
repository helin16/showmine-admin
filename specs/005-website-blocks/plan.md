# Implementation Plan: More Website Blocks

**Branch**: `005-website-blocks` | **Date**: 2026-11-27 | **Spec**: [spec.md](./spec.md)

**Input**: `plan-smn88.md`, approved by Lin on 2026-11-27 (Jira SMN-88)

## Summary

Add four section types (Image beside text, Card grid, Pricing plans, Map) and a second button and note on the Hero.
The API checks them with the existing field rules plus a `list` kind; the Reader draws them with new components and
stylesheet rules; the admin adds them to the palette, the panel and the canvas. Three slices: 88a, 88b, 88c.

## Technical Context

Same as spec 004: admin React 19, Vite, Ant Design 6; Reader Next.js 16; API Express, Sequelize, Jest. No new
dependencies, no migration, no new endpoints.

## Constitution Check

- Repository impact recorded for all three (spec.md). API contract change is additive: new optional fields and types;
  old consumers ignore them (admin and Reader deploy after the API).
- Access and company scope unchanged; images checked to be the company's.
- English and Chinese labels; list editing usable with a keyboard (buttons, not drag only).
- Tests at the narrowest level per repository; mutation checks on the new logic.

## Design

- **API** `src/helpers/WebsiteHelper.ts`: `SECTION_TYPES` gains the types; `checkObject` handles `list` and `lines`
  by recursing with a path; the publish link check walks section fields and list items. `getImageIds` and the copy's
  image addresses already recurse.
- **Reader** `src/components/Website/sections/index.tsx` and `public/website.css`: `Split`, `Cards`, `Pricing`, `Map`;
  a shared `Buttons` part (first, second, note) used by Hero and Split. Grids use `auto-fit` / `minmax`; Split
  switches to two columns at 768px.
- **Admin** `SectionEditors.tsx` (editors and checks), `canvasBlocks.tsx` (markup as the Reader), `BlockPalette.tsx`
  (tiles), i18n en/cn. A small `ListEditor` for list items (add, remove, up, down), as the footer columns.

## Order per slice

docs PR (this spec, first slice only) → API → Reader → admin; each merged with Lin's OK.
