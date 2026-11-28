# Tasks: Website style matching showmine.com.au (SMN-93)

**Tests**: required by all three constitutions (VII). Paths prefixed `admin:`, `api:` or `reader:`.

- [x] T001 api: `theme.style` check (`plain`, `airy`) in `api:src/controllers/Website/WebsiteController.ts`, tests
- [x] T002 reader: `getSiteClass` in `reader:src/components/Website/Site.tsx`, tests; airy rules and font in
  `reader:public/website.css`, `reader:public/fonts`; CORS for `/fonts` in `reader:next.config.js`
- [x] T003 admin: Style choice in `LayoutEditors.tsx`, canvas class and Reader-relative files in `SiteCanvas.tsx`,
  en/cn strings, tests
- [ ] T004 Mutation checks, one independent review, Reader browser check at 390 and 1250 px beside the original
