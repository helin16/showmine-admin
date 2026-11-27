# Feature Specification: Website Message Form

**Feature Branch**: `006-website-message-form`

**Created**: 2026-11-27

**Status**: Approved by Lin as a plan, 2026-11-27 (`plan-smn89.md`, Jira SMN-89)

**Input**: Jira SMN-89 (Lin, 2026-11-26): visitors leave a note (first name, last name, email, message) and the company gets an email and sees it in the admin. Replaces the HubSpot form on showmine.com.au's contact page.

Builds on `specs/001-website-builder` (pages, publishing), `004` (canvas, palette, shared blocks) and `005` (block conventions).

## Repository Impact *(required by all three constitutions)*

| Repository | Impact |
|---|---|
| `showmine-admin` | Affected. A "Message form" block (palette, editor, canvas) and a Website > Messages page for company admins: list, read, delete, unread count. |
| `showmine-api` | Affected. A `form` section type; a new `websiteMessages` table (one migration); a public endpoint that stores a message from a published website's form and queues an email; admin endpoints to list, mark read and delete, for the company's admins. |
| `showmine-reader` | Affected. The form block as a client component that posts to the API from the visitor's browser. Pages without the block are unchanged. |

**Access**: visitors (no account) send; only the company's admins read and delete messages (they hold visitors' personal data). Company scope on every admin query. **Cross-origin**: the Reader posts from the site's address; production CORS must allow it (Lin to confirm `r.showmine66.com`; custom domains are SMN-90's).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor leaves a message (P1)

A visitor fills in first name, last name, email and message on a page with a message form and presses Send. They see the block's thank-you note. The company's email (Company info) gets the message, and replying to it goes to the visitor; with no company email set, the company's admins get it, as join-request emails.

**Acceptance Scenarios**:
1. **Given** a published page with a form, **When** all four fields are filled and Send is pressed, **Then** the thank-you note shows, the message is stored and an email is queued.
2. **Given** an empty field or an email that is not an address, **Then** the form says which, and nothing is sent.
3. **Given** a sixth message from one address within 15 minutes, **Then** the visitor is told to try later, and nothing is stored.
4. **Given** the hidden field filled in (a bot), **Then** the visitor sees the thank-you note, and nothing is stored or sent.
5. **Given** a website that is not published, or whose published copy has no form, **Then** the message is refused.

### User Story 2 - The company reads its messages (P1)

An admin opens Website > Messages: newest first, unread ones marked, with the count of unread on the menu. Opening one shows it in full and marks it read; it can be deleted (after confirming).

**Acceptance Scenarios**:
1. **Given** messages for two companies, **Then** each company's admins see only their own.
2. **Given** a member who is not an admin, **Then** the page and the endpoints are refused.

### User Story 3 - An admin places the form (P1)

The palette offers "Message form". Its editor sets the heading, intro, button text and thank-you note (all optional, with defaults). The canvas shows the form with its fields disabled. It works as a shared block.

### Edge Cases
- Text is kept as typed and escaped in the email; the email subject carries no visitor text.
- A lost email (SES down) still leaves the message in the admin.
- The WeChat browser: a plain form, no captcha or third-party script.

## Requirements *(mandatory)*
- **FR-001**: The API MUST accept a message only for an active, published website whose copy has a form block, with the fields checked (data-model.md).
- **FR-002**: The API MUST limit messages to 5 per address per 15 minutes, and drop messages with the hidden field filled.
- **FR-003**: The API MUST store the message before queueing the email; the email MUST have the visitor as reply-to.
- **FR-004**: Only the company's admins MAY list, read and delete its messages.
- **FR-005**: No visitor IP or browser details are stored.

## Success Criteria
- **SC-001**: A message sent on the test company's site reaches its email and its Messages page.
