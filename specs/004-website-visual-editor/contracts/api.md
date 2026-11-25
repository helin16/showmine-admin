# API contract changes: Website Visual Editor, Layout and Page Templates

Additions to `specs/001-website-builder/contracts/api.md`. No new routes; every new field is optional, so the current
admin and Reader keep working while the API is ahead of them.

| Route | Change |
|---|---|
| `GET /website`, `PUT /website` answer | `layout` (Layout or null) |
| `PUT /website` (admin) | Takes `layout` with `layoutUpdatedAt` as loaded (R5a): absent `layout` leaves it as it is, `null` resets it. 409 stale when `layoutUpdatedAt` differs; other fields keep using `updatedAt`. 400 with `errors[].path` such as `layout.footer.links[0].url` or `layout.sharedAbove[1].heading`. Sets `contentChangedAt` and `layoutUpdatedAt` |
| `GET /website/pages`, page answers | `template` (Page template or null) |
| `POST /website/pages`, `PUT /website/pages/:id` (members) | Take `template`. 400 with `errors[].path` such as `template.ownFooter.text`. A changed template marks the page as changed |
| `POST /website/publish` | Also checks the layout's shared blocks (as sections) and copies `layout` and each page's `template` into the published copy |
| `GET /publicWebsite/:slug` (and preview) | Answer gains `layout` and each page's `template` |
| `GET /website/images/usage`, `DELETE /asset/:id` | An image in a shared block is "used", with `{ published: false, layout: true }` |

Shapes: see `../data-model.md`.
