# Tasks: Website rows, Buttons, Tile and hidden shared blocks (SMN-95, SMN-96)

**Tests**: required by the constitution. Paths are admin paths.

- [x] T001 Spec Kit: spec.md, plan.md, tasks.md (this folder)
- [x] T002 Types: `ROW_OPTIONS`, `BASES`, `MAX_ROW_BLOCKS` in `src/Types/Website/IWebsite.ts`
- [x] T003 `sectionTree.ts`: nested walks (find, replace, count, problem paths); `getImageIds` reaches rows; tests
- [x] T004 Editors: row, buttons, tile, basis only inside a row, Show on for shared blocks; `checkSection` into rows; en/cn strings; tests
- [x] T005 Canvas: Row, Buttons, Tile markup as the contract's, selectable blocks inside rows, hidden shared blocks left out; tests
- [x] T006 Nested editing in the page editor and the Layout page (Back to the row, counts, problem paths); tests
- [x] T007 Palette: Row, Buttons, Tile; a third level is not offered; tests
- [x] T008 Mutation checks, one independent review, browser check with the Reader build (mutation: API 15/15 after
  fixes, Reader 17/17, admin 17/18 then the wrap test added; review findings fixed; Reader CSS checked at 1440 and 390 px,
  plain and airy, with and without the canvas wrapper; MAOS workspace SPEC-011)
