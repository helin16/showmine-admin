# Data Model: Website Message Form

## Section `form` (in `SECTION_TYPES`; a page section or a shared block)

| Field | Kind | Notes |
|---|---|---|
| heading | text 120 | |
| intro | text 500 | |
| buttonText | text 40 | default "Send" |
| thanks | text 300 | default "Thank you, we will get back to you soon." |

## Table `websiteMessages` (migration `20261127000000-add-website-messages`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | |
| companyId | UUID, FK companies, CASCADE | the website's company |
| websiteId | UUID, FK websites, CASCADE | |
| pageSlug | string 40 | the page it was sent from |
| firstName, lastName | string 80 | required, trimmed |
| email | string 254 | required, an address |
| message | text, 5000 | required |
| isRead | boolean, default false | set when an admin opens it |
| createdAt, updatedAt | date | |

Index (companyId, createdAt). No createdById: a visitor is not a user. Deleting is a hard delete (personal data).

## Endpoints

- `POST /publicWebsite/:slug/message` (app token; per-address limit 5 / 15 min):
  `{ pageSlug, firstName, lastName, email, message, website }` (`website` is the hidden trap field).
  201 on success or trap; 400 with field errors; 404 when the site is not published or has no form; 429 over the limit.
- `GET /website/messages?page=&pageSize=` (company admins): newest first, `{ data, pagination, unread }`.
- `PUT /website/messages/:id/read` (company admins): marks it read.
- `DELETE /website/messages/:id` (company admins).

## Email (notification queue, type `NOTIFY_WEBSITE_MESSAGE`, request `{ websiteMessageId }`)

To the company email, else to the company's admins (as join requests). Subject "New message from your website /
网站新留言" (no visitor text); body: name, email, page, the message; a link to Website > Messages; reply-to the visitor.
