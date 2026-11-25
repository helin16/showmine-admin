# Reader changes: Website Visual Editor, Layout and Page Templates

Additions to `specs/001-website-builder/contracts/reader-routes.md`.

- `/website.css`: the site styles, served as a static file (moved from `src/styles/website.scss`), linked by the
  website pages and by the admin canvas. All rules stay under `.site`.
- `/s/<slug>` and `/s/<slug>/<page>`: each page shows its effective header (or none), its shared blocks above, its
  blocks, the shared blocks below, and its effective footer (or none), in its effective theme. Without `layout` in the
  published copy, the page shows as today.
- `/t/<id>` (template preview): a starter template that sets a layout shows it the same way.
