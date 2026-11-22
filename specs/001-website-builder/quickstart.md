# Quickstart: validating the Website Builder

Run these checks for each delivery slice, in the order of `plan.md`.

## Automated checks (MAOS agent container)

```bash
# API
yarn lint && yarn test && yarn build
# Reader
yarn lint && yarn test && yarn build
# Admin
yarn lint && yarn test && yarn build
```

Coverage expectations:
- API tests cover every case in [contracts/api.md](./contracts/api.md): allowed, member (401), other company, switch off (403), validation, limits, stale save, taken names and migrations up and down.
- The route matrix test fails until every new route is listed there.

Admin and Reader E2E suites run against production, so MAOS does not run them.

## Manual check by Lin on the test company (after each deploy; this is the `staging` gate)

1. As super admin, set `websiteBuilderEnabled` on the test company only. Every other company sees no change.
2. **US1**: in the Website area, save the address and create the site name. A taken name or a reserved word is refused.
3. **US2**: add two pages and several sections, reorder them, then preview. The preview opens in a new tab. The public address still shows not-found.
4. **US3**: publish and open `/s/<name>` on a phone and a desktop.
   - Edit the draft and the company phone; the public site does not change.
   - Publish again; it does.
   - Unpublish; the site shows not-found.
5. **US4**: preview a template at `/t/<id>`, apply it to an empty site, then apply another. The second warns before replacing.
6. **US5**: upload a JPEG and use it. Deleting it is refused while in use. An SVG or a 20 MB file is refused.
7. **US6**: set SEO and check the page source. A subdomain that is taken is refused. A custom domain shows "pending".
8. **US7**: open published pages a few times. Analytics shows the counts; a period with no views shows zeros.
9. **SC-002**: open a published page with the browser's network throttled to "Fast 4G" and note the time until the content shows (target: under 3 seconds).
10. Switch the test company off. The public site shows not-found, and the Website area disappears.

Expected outcome: each step behaves as its acceptance scenario in [spec.md](./spec.md).
