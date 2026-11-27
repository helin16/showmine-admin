# Data Model: Message Form to HubSpot; Map for China

## Field kind change
`text` gains an optional `pattern` (a regular expression the trimmed text must match).

## `form` (changed)
| Field | Kind | Notes |
|---|---|---|
| heading, intro, buttonText, thanks | as spec 006 | |
| hubspotPortalId | text 12, `^[0-9]{1,12}$` | with hubspotFormId: both or neither |
| hubspotFormId | text 36, GUID | |
| hubspotMessageField | text 100, `^[a-z0-9_]{1,100}$` | default `message` |
| noEmail | bool | no notification email |

## `map` (changed)
| Field | Kind | Notes |
|---|---|---|
| mapUrl, height | as spec 005 | |
| chinaMapUrl | httpsUrl | used in WeChat or a mainland China time zone |

## `websiteMessages` (migration)
| Column | Type | Notes |
|---|---|---|
| forwardStatus | VARCHAR(10) null | null: not forwarded; `pending`, `sent`, `failed` |
| forwardError | VARCHAR(200) null | HubSpot's short reason, or the network error's name |

## Notification queue
New type `FORWARD_WEBSITE_MESSAGE`; request `{ websiteMessageId, portalId, formId, messageField, pageUri, pageName, attempt }`. A retry is a new queue message with `attempt + 1` and a later run time.
