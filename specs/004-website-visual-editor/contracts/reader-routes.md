# Reader changes: Website Visual Editor, Layout and Page Templates

Additions to `specs/001-website-builder/contracts/reader-routes.md`.

- `/website.css`: the site styles, served as a static file (moved from `src/styles/website.scss`), bundled into the
  website pages and read by the admin canvas, with `Cache-Control: public, max-age=300` and
  `Access-Control-Allow-Origin: *`. All rules stay under `.site`; no media queries.
- `/s/<slug>` and `/s/<slug>/<page>`: each page shows its effective header (or none), its shared blocks above, its
  blocks, the shared blocks below, and its effective footer (or none), in its effective theme. Without `layout` in the
  published copy, the page shows as today.
- `/t/<id>` (template preview): a starter template that sets a layout shows it the same way.
