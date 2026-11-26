---

description: "Task list for more website blocks"
---

# Tasks: More Website Blocks

**Input**: Design documents from `/specs/005-website-blocks/`

**Tests**: Required by all three constitutions (VII).

**Organization**: by slice; each slice is started and merged only with Lin's approval. Paths are prefixed `admin:`,
`api:` or `reader:`.

## Slice 88a: Hero second button and note; Image beside text (US1, US2)

- [ ] T001 [P] api: tests in `api:src/__tests__/` for the Hero's `button2Text`, `button2Url`, `note`, and the `split` type (required image, side, plain text, paths), as page sections and as shared blocks; publish refuses a missing-page `button2Url`
- [ ] T002 api: `SECTION_TYPES` in `api:src/helpers/WebsiteHelper.ts`; the publish link check covers the new link fields
- [ ] T003 [P] reader: tests for Hero with two buttons and a note, and `Split` left and right; `reader:public/website.css` rules
- [ ] T004 reader: `Buttons` part and `Split` component in `reader:src/components/Website/sections/index.tsx`
- [ ] T005 [P] admin: tests for the Hero editor's second button and note, the `split` editor and its checks, palette tile and canvas markup
- [ ] T006 admin: `SectionEditors.tsx`, `canvasBlocks.tsx`, `BlockPalette.tsx`, en/cn strings

## Slice 88b: Card grid (US3)

- [ ] T007 api: the `list` field kind (min, max, item fields, paths) with tests that old types still pass; `cards` type; link check walks list items
- [ ] T008 reader: `Cards` component and grid rules, with tests
- [ ] T009 admin: `ListEditor`, the `cards` editor, canvas and palette, with tests

## Slice 88c: Pricing plans; Map (US4, US5)

- [ ] T010 api: `lines` kind; `pricing` and `map` types, with tests
- [ ] T011 reader: `Pricing` and `Map` components and rules, with tests
- [ ] T012 admin: editors, canvas and palette, with tests

## After each slice

- [ ] Mutation checks, one independent review, Reader browser check at 390 and 1250 px, Lin's check on the test company
- [ ] After 88c: rebuild the ShowMine Pty Ltd home and pricing pages with the new blocks, as drafts
