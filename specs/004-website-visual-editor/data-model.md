# Data Model: Website Visual Editor, Layout and Page Templates

Adds columns to the tables of `specs/001-website-builder/data-model.md`. Slice 4a's migration
`api:migrations/20261126000000-add-website-layout.js` adds `websites.layout`, with a `down`; slice 5 adds
`websitePages.template` with its own migration.

## Website (`websites`): new column

| Field | Type | Rules | Story |
|---|---|---|---|
| `layout` | TEXT (JSON), null | See Layout below. Null: as today (header with logo, name and every page; no footer; no shared blocks) | US4 |

### Layout

```
{
  header: { showLogo: boolean, showName: boolean, hiddenPageIds: uuid[],   // menu = the site's pages in order, minus hidden,
            links: [{ label ≤40, url }] ≤4 },                              // then these outside links (4a)
  footer: null | {                                                         // null: no footer
    columns: [{ heading ≤60, items: item[] ≤8 }] ≤4,                       // (4a)
    copyright: string ≤200
  },
  sharedAbove: section[],                                                  // same types and fields as page sections;
  sharedBelow: section[]                                                   // at most 10 shared blocks in all (R5b) (4b)
}
item = { type: 'text', text ≤500 }                                         // plain text; line breaks kept
     | { type: 'contact', icon: 'address'|'phone'|'email'|'wechat'|'message', text ≤100 }
     | { type: 'button', label ≤40, url }
     | { type: 'image', assetId, alt ≤120, link? }                           // link: where the image leads
```

Every url is checked as section links (https, http, mailto, tel, /page). All layout text is plain text (R5c).

### Theme (`websites.theme`, 001), additions in 4a

```
{ primaryColor, fontPair,                                     // as 001
  backgroundColor?, headingColor?, secondaryColor?: '#rrggbb', // page background, headings, second button
  contentWidth?: 960 | 1140 | 1280 }                           // absent: 960, as today
```

- `hiddenPageIds` keeps only ids of the website's active pages; a deleted page drops out.
- Shared blocks have their own limit (10 in all) and do not count toward a page's 30 (R5b).
- Images in shared blocks count as used by the website (FR-017, FR-019 of 001).
- Only admins change it (`PUT /website`, with the website's `updatedAt` as for the theme, R5a; absent: unchanged; null: reset).

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
