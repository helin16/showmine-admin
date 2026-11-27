# Feature Specification: Message Form to HubSpot; Map for China

**Feature Branch**: `007-website-hubspot-map`

**Created**: 2026-11-28

**Status**: Approved by Lin as a plan, 2026-11-28 (`plan.md`, Jira SMN-92)

**Input**: Lin, 2026-11-28: keep HubSpot, but behind our own message form (a middleware: our form, our API forwards to HubSpot), rather than embedding HubSpot's form page, which loads slowly or not at all in China. The map switches by itself: Amap in WeChat and for visitors in China, Google Maps elsewhere.

Builds on `specs/006-website-message-form` (form, messages) and `specs/005-website-blocks` slice 88c (map block).

## Repository Impact *(required by all three constitutions)*

| Repository | Impact |
|---|---|
| `showmine-admin` | Affected. The form editor gains HubSpot portal id, form id, message field and "no email"; the map editor gains a China map link; Website > Messages shows each message's HubSpot status. |
| `showmine-api` | Affected. New optional fields on the `form` and `map` types (the `text` kind gains a pattern); a forward job in the notification queue with retries; one migration (`websiteMessages.forwardStatus`, `forwardError`). Old forms and maps keep working. |
| `showmine-reader` | Affected. The map block picks between two links in the visitor's browser. The form is unchanged: forwarding happens on the server. |

**Access** unchanged: members and admins edit blocks, admins read messages. **Privacy**: HubSpot gets the four fields the visitor typed, the page address and name; no IP address, no cookie. HubSpot's portal and form ids are public (they are in any HubSpot embed), so storing them in the published copy is fine.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Messages reach HubSpot (P1)

An admin sets the Contact page's form to HubSpot portal 14545640, form 4fd8c4ec-…, message field `comments`. A visitor sends a message. It is stored and shows in Website > Messages; a moment later it is in HubSpot as a form submission, and the message shows "HubSpot: sent".

**Acceptance Scenarios**:
1. **Given** a form with both ids, **When** a visitor sends a message, **Then** the API answers as today (no wait for HubSpot), and a forward job sends firstname, lastname, email and the message under the chosen field.
2. **Given** HubSpot is down or slow (network error, timeout, 429, 5xx), **Then** the job tries again after 1, 5, 30 and 120 minutes, then marks the message failed.
3. **Given** HubSpot refuses the fields (other 4xx), **Then** the message is marked failed at once with HubSpot's reason, and it stays in Messages.
4. **Given** only one of the two ids, **Then** saving is refused for that field.
5. **Given** "no email" is ticked, **Then** no notification email is sent; the message is still stored (and forwarded if set).
6. **Given** a form saved before this feature, **Then** it works as before: email, no forwarding.

### User Story 2 - A map that loads in China (P1)

An admin gives a map block a China map link (an Amap marker link) besides the Google link.

**Acceptance Scenarios**:
1. **Given** both links, **When** the page is opened in WeChat, or in a browser whose time zone is mainland China, **Then** the China map shows; elsewhere the main map shows. Only one map loads.
2. **Given** both links, **Then** a small "Switch map 切换地图" link under the map shows the other one.
3. **Given** only the main link, **Then** the block is as today.

### Edge Cases
- Several forms on one page: the first form (page, then shared blocks above, then below) gives the settings. HubSpot settings are copied into the job when the message arrives, so later edits do not change it.
- The message is deleted before the job runs: the job stops.
- The website is unpublished between message and forward: the job still sends (settings are in the job).

## Requirements *(mandatory)*

- **FR-001**: The API MUST check the new fields: portal id `^[0-9]{1,12}$`, form id a GUID, message field `^[a-z0-9_]{1,100}$`, China map link https.
- **FR-002**: Storing the visitor's message MUST NOT wait for HubSpot; a lost forward leaves the message in Messages.
- **FR-003**: The forward MUST NOT send the visitor's IP address or cookies.
- **FR-004**: The Reader MUST NOT load both maps for one visitor.
- **FR-005**: Existing forms, maps and published copies MUST behave as before.

## Success Criteria *(mandatory)*

- **SC-001**: A message sent on the ShowMine Pty Ltd Contact page appears in HubSpot portal 14545640.
- **SC-002**: The Contact page's map loads in WeChat in China.
