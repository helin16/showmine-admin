# Data Model: More Website Blocks

Sections stay JSON objects `{ id, type, ...fields }` in `websitePages.sections` and in `websites.layout.sharedAbove` /
`sharedBelow` (spec 004). No migration. Text limits are characters; "link" is a link as the Hero's button link today
(`https://`, `http://`, `mailto:`, `tel:` or `/address`). Empty optional fields are left out by the admin; fields a type does not have are refused.

## Field kinds (API `SECTION_TYPES`)

Existing: `text` (max, required), `html`, `asset`, `images`, `link`, `httpsUrl`, `bool`, `int`, `oneOf`.
New: `list` — an array of objects, `{ kind: 'list', min, max, fields }`; each item is checked with `fields` and the
items' unknown fields are refused. Paths: `sections[2].items[3].title`. A `list` of plain lines uses
`{ kind: 'lines', max, lineMax }` (an array of strings).

## Hero (changed, slice 88a)

| Field | Kind | Notes |
|---|---|---|
| heading, subheading, imageAssetId, buttonText, buttonUrl | as today | first button |
| button2Text | text 40 | second button; with button2Url, both or neither |
| button2Url | link | |
| note | text 200 | small text under the buttons |

The "both or neither" rule applies to the first button too, as the admin already checks it; the API keeps accepting a
first button with text only, so old drafts still save (the Reader draws a button only with both).

## Image beside text `split` (new, slice 88a)

| Field | Kind | Notes |
|---|---|---|
| heading | text 120 | |
| text | text 1000 | plain; line breaks kept |
| imageAssetId | asset, required | a website image of the company |
| imageAlt | text 200 | for screen readers |
| imageSide | oneOf `left`, `right` | default `left` |
| buttonText, buttonUrl, button2Text, button2Url, note | as Hero | |

## Card grid `cards` (new, slice 88b)

| Field | Kind | Notes |
|---|---|---|
| heading | text 120 | |
| intro | text 500 | |
| columns | oneOf `2`, `3`, `4` | default `3` |
| boxed | bool | cards drawn in boxes |
| items | list 1–12 | `{ imageAssetId? asset, title text 80, text text 300, link? link }` |

## Pricing plans `pricing` (new, slice 88c)

| Field | Kind | Notes |
|---|---|---|
| heading | text 120 | |
| intro | text 500 | |
| plans | list 1–4 | `{ name text 40 required, price text 20 required, period text 20, features lines ≤10 × 100, buttonText text 40, buttonUrl link, highlight bool }` |

## Map `map` (new, slice 88c)

| Field | Kind | Notes |
|---|---|---|
| mapUrl | httpsUrl, required | an embed address, as the Contact block's map |
| height | oneOf `small`, `medium`, `large` | 240, 360, 480 px; default `medium` |

## Theme

`theme.secondaryColor` (stored since spec 004 slice 4a) gets its picker in Layout > Theme (88a). The Reader and the
canvas set `--site-secondary` and `--site-secondary-text` (`#212529` or `#ffffff`, whichever has the higher WCAG
contrast on the colour).

## Published copy

Unchanged in shape: sections are copied as checked, with image ids given their address (`imageAssetId` →
`imageUrl`) at any depth, so card images get `imageUrl` too.
