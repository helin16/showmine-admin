# Plan: Website rows, Buttons, Tile and hidden shared blocks (SMN-95, SMN-96, admin)

Plans: `workspace/SPEC-010/plan-smn95.md`, `workspace/SPEC-011/plan-row.md`. Contract: `workspace/SPEC-011/contract.md`.
Constitution: tests for every piece, Prettier only on changed files, no E2E.

## Approach

- **Types**: option lists and defaults in `Types/Website/IWebsite.ts`.
- **Tree walks**: one file, `Components/Website/sectionTree.ts`, for what walks sections: `flattenBlocks`, `countBlocks`,
  `findPath`, `getAtPath`, `replaceBlock`, `getPathName` (API path of a nested block), `getProblemIds`,
  `getFirstProblemId`. `getImageIds` uses it, so media pickers reach tiles inside rows.
- **Editors**: row, buttons and tile cases in `SectionEditors.tsx`; the shared wrapper adds the basis choice (when
  `parents > 0`) and Show on (when `pages` is given). The Row editor lists its blocks with the page's controls and
  reuses `BlockPalette` (with `types`, leaving Row out at the third level). `checkSection` recurses into rows.
- **Nested editing**: the page and Layout page find the selected id with `findPath`; the editor gets `parents`,
  `onSelect`, `canAdd`; Back goes to the parent row (`Back to the row`), else to the blocks. Problems are looked up by
  the nested API path.
- **Canvas**: `canvasBlocks.tsx` Row (recursive through `BLOCKS`, canvas-only classes and click on `.site-flex-item`),
  Buttons, Tile. `SiteCanvas.tsx` leaves out shared blocks hidden on `pages[currentIndex]`.

## Checks

Prettier on changed files, ESLint, `tsc`, the whole vitest suite; one independent review; Reader check beside the
Reader build. Merges with Lin's OK, API first.
