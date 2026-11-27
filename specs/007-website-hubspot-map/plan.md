# SMN-92 plan: message form forwards to HubSpot; map switches to Amap in China (spec 007)

Status: approved by Lin in chat 2026-11-28 ("可以可以，开始，批准。"), after the outline in chat. Builds on spec 006
(form, SMN-89) and spec 005 slice 88c (map). Lin chose this over embedding HubSpot's own form page.

## 1. HubSpot forwarding (API, admin)
- Form block gains optional fields: `hubspotPortalId` (digits, up to 12), `hubspotFormId` (a GUID),
  `hubspotMessageField` (a HubSpot property name, default `message`; Show Mine's form uses `comments`) and
  `noEmail` (bool: no notification email; the message is still kept in Website > Messages).
- The `text` field kind gains an optional pattern; portal id and form id: both or neither (API and admin).
- On a visitor's message (unchanged checks), the API stores it, then reads the form block of that page (the first
  form in the page, then the shared blocks) from the published copy and queues:
  - the email, unless `noEmail`;
  - a forward job, when the portal and form ids are set, with those settings copied into the job.
- The forward job (notification queue, new type `FORWARD_WEBSITE_MESSAGE`) POSTs to
  `https://api.hsforms.com/submissions/v3/integration/submit/{portal}/{form}` with firstname, lastname, email and the
  message under the chosen field, plus the page address and name. No IP, no cookie. 10 s timeout.
  - HubSpot 2xx: the message is marked `sent`.
  - Network error, timeout, 429 or 5xx: queued again, 1, 5, 30 and 120 minutes later; after that `failed`.
  - Other 4xx (HubSpot refused the fields): `failed` at once, with HubSpot's short reason.
- Migration: `websiteMessages.forwardStatus` (null, `pending`, `sent`, `failed`) and `forwardError` (200 chars).
- Admin Website > Messages shows "HubSpot: sent / waiting / failed (reason)" on each forwarded message.

## 2. Map switch (API, Reader, admin)
- Map block gains an optional `chinaMapUrl` (https), e.g. an Amap marker link.
- Reader: with both links, the visitor's browser picks: the China link in WeChat (`MicroMessenger` in the user
  agent) or when its time zone is mainland China (Asia/Shanghai, Asia/Urumqi and their old names); the main link
  otherwise. Until the page has loaded it shows an empty box of the map's height, so no visitor loads both maps.
  A small link under the map switches to the other map ("Switch map 切换地图").
- With one link, the map works as today. Visitor IP is not used (no IP database; the time zone covers it).
- Admin: map editor gets the field; the canvas shows the main link.

## Spec Kit
`specs/007-website-hubspot-map` in showmine-admin (spec, data-model, tasks), on the admin branch first.

## Order, PRs and checks
API (with migration), Reader, admin; each merged only with Lin's OK. Tests, lint, types, mutation checks, one
independent review; Reader map checked in a browser at phone and desktop widths, with a WeChat user agent.
Lin's check on ShowMine Pty Ltd: set HubSpot ids 14545640 / 4fd8c4ec-… / `comments` on the Contact form, send a
message, see it in HubSpot and in Messages as sent; map shows Google here, Amap in WeChat.

## Out of scope
Other CRMs, mapping more fields, a retry button, IP-based country, the HubSpot `hutk` cookie, consent options.
