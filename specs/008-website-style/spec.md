# Feature Specification: Website style matching showmine.com.au

**Feature Branch**: `feature/SMN-93-site-style` | **Created**: 2026-11-28 | **Status**: Approved (Lin, in chat)
**Jira**: SMN-93 | **Builds on**: specs/004 (layout theme), specs/005 (blocks)

## User Story 1: an airy look (P1)

An admin picks Layout > Theme > Style: Airy. The website, and the admin canvas, then look like showmine.com.au:
Inter type, light large headings, grey text, wide spacing between blocks, pill uppercase buttons, a light header
band with uppercase menu links (the current page orange with a dot), white boxed cards with a soft shadow, and a
pale copyright band. Plain (the default, or no choice) leaves every site as it was.

**Acceptance**: 1. Style absent or Plain: no change to any site. 2. Airy: the site root carries `site-style-airy`
and the Reader's `/website.css` styles it; the canvas shows the same. 3. Any other value is refused by the API
(`theme.style`). 4. The font loads in the canvas as on the site.

## Requirements

- FR-001 API: `theme.style` is `plain` or `airy`, optional.
- FR-002 Reader: `site-style-airy` class; styles only under it; Inter (SIL OFL 1.1) served at `/fonts` with CORS.
- FR-003 Admin: the Style choice in Layout > Theme (en, cn); the canvas adds the class and loads root-relative files
  in the Reader's styles from the Reader.

## Out of scope

More styles, per-block style overrides, a website logo separate from the company logo (Lin chose to replace the
company logo).
