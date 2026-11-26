# API contract changes: Website Visual Editor, Layout and Page Templates

Additions to `specs/001-website-builder/contracts/api.md`. No new routes; every new field is optional, so the current
admin and Reader keep working while the API is ahead of them.

| Route | Change |
|---|---|
| `GET /website`, `PUT /website` answer | `layout` (Layout or null) |
| `PUT /website` (admin) | Takes `layout` (4a) with the website's `updatedAt` as loaded (R5a, superseded): absent `layout` leaves it as it is, `null` resets it. 409 stale when `updatedAt` differs; `theme` also takes `backgroundColor`, `headingColor`, `secondaryColor` and `contentWidth` (960, 1140, 1280). 400 with `errors[].path` such as `layout.footer.columns[0].items[1].url` or `layout.sharedAbove[1].heading`. Sets `contentChangedAt` |
| `GET /website/pages`, page answers | `template` (Page template or null) |
| `POST /website/pages`, `PUT /website/pages/:id` (members) | Take `template`. 400 with `errors[].path` such as `template.ownFooter.text`. A changed template marks the page as changed |
| `POST /website/publish` | Also checks the layout's shared blocks (as sections) and copies `layout` and each page's `template` into the published copy |
| `GET /publicWebsite/:slug` (and preview) | Answer gains `layout` and each page's `template` |
| `GET /website/images/usage`, `DELETE /asset/:id` | An image in a shared block is "used", with `{ published: false, layout: true }` |

Shapes: see `../data-model.md`.
