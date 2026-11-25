# Quickstart: validating the visual editor

Automated checks per slice, in the MAOS agent container, as in `specs/001-website-builder/quickstart.md`.

Manual check by Lin on the test company in production (there is no staging server), after each slice is deployed,
as an admin and as a member:

1. **US1**: open a page. The title row reads "Editing: <title>" with Save, Preview, Options (and Publish as an admin).
   Change the title and SEO in Options, save, reload: kept. As a member: no Publish, no Delete page.
2. **US2**: the canvas shows the page as the public site does. Select a block, change its heading, see it change as
   you type. Switch desktop, tablet, phone. Save, Preview: the preview matches the canvas.
3. **US3**: drag an image block between two blocks, then back; add one by clicking; do both with the keyboard only.
4. **US4** (admin): in Layout, add a footer text and a shared contact block below; open two pages: both show them.
   Publish: the public site shows them. As a member: Layout can be seen, not changed.
5. **US5**: give one page no header and its own colour: its canvas and public page show that; other pages do not.
6. **SC-005**: before publishing anything, the public site looks as it did before the deploy.
