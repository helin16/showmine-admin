# Data Model: Website Visual Editor, Layout and Page Templates

Adds two columns to the tables of `specs/001-website-builder/data-model.md`. Migration
`api:migrations/2026112200000N-add-website-layout.js` (numbered when written), with a `down`.

## Website (`websites`): new column

| Field | Type | Rules | Story |
|---|---|---|---|
| `layout` | TEXT (JSON), null | See Layout below. Null: as today (header with logo, name and every page; no footer; no shared blocks) | US4 |
| `layoutUpdatedAt` | DATE, null | Versions the layout alone (research R5a) | US4 |

### Layout

```
{
  header: { showLogo: boolean, showName: boolean, hiddenPageIds: uuid[] },  // menu = the site's pages in order, minus hidden
  footer: null | { showContact: boolean,                                  // null: no footer
                   text: string ≤300, links: [{ label ≤40, url }] ≤5 },   // url: as section links (https, http, mailto, tel, /page)
  sharedAbove: section[],                                                 // same types and fields as page sections;
  sharedBelow: section[]                                                  // at most 10 shared blocks in all (R5b)
}
```

- `hiddenPageIds` keeps only ids of the website's active pages; a deleted page drops out.
- Shared blocks have their own limit (10 in all) and do not count toward a page's 30 (R5b).
- Images in shared blocks count as used by the website (FR-017, FR-019 of 001).
- Only admins change it (`PUT /website`, with `layoutUpdatedAt`; absent: unchanged; null: reset).

## Website page (`websitePages`): new column

| Field | Type | Rules | Story |
|---|---|---|---|
| `template` | TEXT (JSON), null | See Page template below. Null: follows the layout | US5 |

### Page template

```
{
  header: 'layout' | 'hidden' | 'own',  ownHeader?: Layout.header,   // ownHeader required when 'own'
  footer: 'layout' | 'hidden' | 'own',  ownFooter?: Layout.footer,
  theme: null | { primaryColor, fontPair },                           // as websites.theme
  sharedBlocks: boolean                                               // false: leave the layout's shared blocks out
}
```

- Members change it (`PUT /website/pages/:id`), with the page's `updatedAt`.

## Published copy (001 data-model "Published copy"): additions

```
{ ...,
  layout: { header, footer, sharedAbove: section[], sharedBelow: section[] } | null,   // images resolved as in sections
  pages: [{ ..., template: PageTemplate | null }] }
```

The Reader works out each page's effective header, footer, theme and shared blocks. A copy without `layout`
(published before this feature) shows as today.
