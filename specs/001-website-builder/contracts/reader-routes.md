# Reader Routes: Website Builder (showmine-reader)

Both routes are server-rendered and use the same section components. Server calls send the server key, as article pages do. Every case that is not available shows the existing `Page404`.

| Route | Data | Shows | Headers |
|---|---|---|---|
| `/s/<slug>` | `GET /publicWebsite/<slug>` | Home page (lowest position) | Normal. Counts a page view (server side) |
| `/s/<slug>/<page>` | same | That page; not-found if absent | Normal. Counts a page view |
| `/s/<slug>?preview=<token>` and `/s/<slug>/<page>?preview=<token>` | same, with `preview` | The draft | `Cache-Control: no-store`, `noindex`, `Referrer-Policy: no-referrer`; not counted |
| `/t/<templateId>` and `/t/<templateId>/<page>` | `GET /publicTemplate/<id>` | Template with sample content | `no-store`, `noindex`; not counted |

Each page:
- has navigation listing the pages;
- takes its title, description and image from the page SEO, then the site SEO, then the company;
- has `og:*` tags through the existing `Header`;
- uses a responsive layout from 320 px to desktop.

`articles` sections load server-side through the existing `GET /item` (company header, published, newest first) and link to `/item/<id>`.

Page views: the Reader server posts `POST /publicWebsite/<slug>/pageView` with the server key after loading a published page. It does not post for previews, template pages or the `ShowMine-E2E` user agent. The call has a 1-second timeout, and any failure is ignored, so counting never breaks a page.

Behaviour when the API fails:
- 429: rendered as the existing "Too Many Requests" page.
- Any other error: not-found. The Reader never shows stale content.
