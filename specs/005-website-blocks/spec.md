# Feature Specification: More Website Blocks

**Feature Branch**: `005-website-blocks`

**Created**: 2026-11-27

**Status**: Approved by Lin as a plan, 2026-11-27 (`plan-smn88.md`, Jira SMN-88)

**Input**: Lin, 2026-11-27, after showmine.com.au was rebuilt with the current blocks: "https://r.showmine66.com/s/showmine-pty-ltd-2uh82v 和 https://showmine.com.au 完全不一样啊" (they look completely different). The current blocks cannot put a picture beside text, lay cards out in a grid, show price cards side by side, or give a band two buttons.

Builds on `specs/001-website-builder` (sections, publishing, images) and `specs/004-website-visual-editor` (canvas, palette, panel, layout and shared blocks). New blocks are sections: they work on pages and as shared blocks, with the same checks, limits and publishing.

## Repository Impact *(required by all three constitutions)*

| Repository | Impact |
|---|---|
| `showmine-admin` | Affected. The palette offers the new blocks; each has an editor in the panel (lists of cards, plans and features with add, remove and move); the canvas draws them as the Reader does. The Hero editor gains a second button and a note. |
| `showmine-api` | Affected. The section rules gain the new types and fields, including lists of items checked field by field; links inside lists are checked on publish as other links are. No migration: sections are stored as JSON. The new fields are optional, so the current admin and Reader keep working during the deploy. |
| `showmine-reader` | Affected. New section components and stylesheet rules; the Hero shows a second button and a note. Pages without the new blocks look as they do today. |

Access is unchanged: members and admins of the company edit pages; admins edit the layout and publish (SMN-80). Company scope is unchanged: images must be the company's website images.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A band with two buttons (Priority: P1, slice 88a)

A member gives a Hero block a second button (for example "Start Free" and "Login") and a short note under the buttons ("No credit card required."). The first button uses the theme's main colour, the second the theme's second colour.

**Independent Test**: Add both buttons and a note to a Hero, save, preview: both buttons link where set, the note shows under them.

**Acceptance Scenarios**:

1. **Given** a Hero with a second button text and link, **Then** the website shows two buttons side by side (wrapping on a narrow phone), the second in the theme's second colour (set in Layout > Theme), with dark or white text, whichever reads better on it.
2. **Given** a second button with text but no link, or a link but no text, **Then** saving is refused for that field, as for the first button.
3. **Given** a Hero saved before this feature, **Then** it looks exactly as before.

### User Story 2 - Picture beside text (Priority: P1, slice 88a)

A member adds an "Image beside text" block: a heading, text, one image on the left or right, up to two buttons and a note. On a phone the image shows above the text.

**Independent Test**: Add the block with the image on the right, preview at desktop and phone widths.

**Acceptance Scenarios**:

1. **Given** the block with the image on the left, **Then** at 768px and wider the image is left of the text, each half the width; narrower, the image is above.
2. **Given** no image, **Then** saving is refused: the image is required.
3. **Given** text with line breaks, **Then** the breaks show; the text is plain, not HTML.

### User Story 3 - Cards in a grid (Priority: P1, slice 88b)

A member adds a "Card grid" block: a heading, an intro, 2, 3 or 4 columns, with or without boxes, and 1 to 12 cards, each with an optional image or icon, a title, text and an optional link.

**Acceptance Scenarios**:

1. **Given** 8 cards in 3 columns, **Then** the website shows rows of 3 on a desktop, 2 on a tablet and 1 on a phone.
2. **Given** a card with a link to `/pricing` and no Pricing page, **Then** publishing is refused naming that card's link.
3. **Given** cards, **When** a member adds, removes or moves one in the panel, **Then** the canvas shows it at once.

### User Story 4 - Price plans (Priority: P2, slice 88c)

A member adds a "Pricing plans" block: a heading, an intro and 1 to 4 plans, each with a name, a price (text, such as "$49" or "POA"), a period ("monthly"), up to 10 feature lines, an optional button and an optional highlight.

**Acceptance Scenarios**:

1. **Given** three plans, **Then** they show side by side on a desktop and one under another on a phone; the highlighted one stands out.

### User Story 5 - A map (Priority: P3, slice 88c)

A member adds a "Map" block with a map embed address (https) and a height (small, medium, large); the map fills the content width.

### Edge Cases

- Lists out of range (no cards, 13 cards, 5 plans, 11 features) are refused with a path naming the list.
- A list item that is not an object, or a field of the wrong kind, is refused with the item's path, e.g. `sections[2].items[3].title`.
- Images in cards are counted as used, kept from clean-up, and get their address when published, as other block images.
- New blocks as shared blocks (spec 004 slice 4b) follow the same rules, with paths under `layout.sharedAbove` / `layout.sharedBelow`.

## Requirements *(mandatory)*

- **FR-001**: The API MUST accept and check the new section types and fields (data-model.md); unknown fields are refused as today.
- **FR-002**: The API MUST check list fields item by item, with minimum and maximum counts, and report paths down to the item's field.
- **FR-003**: Publishing MUST refuse `/address` links to pages that do not exist, including links inside lists and the Hero's second button.
- **FR-004**: The Reader and the admin canvas MUST draw each new block from the same markup and stylesheet, at desktop, tablet and phone widths.
- **FR-005**: The admin MUST let members add, edit, remove and move list items with a keyboard, with English and Chinese labels.
- **FR-006**: Existing sections and published copies MUST look as before.

## Success Criteria *(mandatory)*

- **SC-001**: The showmine.com.au home and pricing pages can be rebuilt with picture-beside-text bands, two buttons, card grids and price cards.
- **SC-002**: No existing website changes how it looks after the deploy.

## Delivery

Three slices, each its own API, Reader and admin PRs, merged in that order with Lin's OK: 88a (US1, US2), 88b (US3), 88c (US4, US5).
