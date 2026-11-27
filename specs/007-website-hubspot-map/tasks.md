---

description: "Task list for the message form to HubSpot and the map for China"
---

# Tasks: Message Form to HubSpot; Map for China

**Tests**: required by all three constitutions (VII). Paths prefixed `admin:`, `api:`, `reader:`.

- [x] T001 api: `text` pattern; new `form` and `map` fields; both-or-neither for the HubSpot ids; tests
- [x] T002 api: migration (`forwardStatus`, `forwardError`), model fields; migration test
- [x] T003 api: message route queues the email (unless `noEmail`) and the forward; tests
- [x] T004 api: `HubSpotConnector.submitForm` and the forward processor with retries; tests (sent, retry, failed, deleted)
- [x] T005 api: Messages list returns `forwardStatus`, `forwardError`; test
- [x] T006 reader: `MapBlock` picks the link (WeChat, time zone), placeholder until loaded, switch link; tests; CSS
- [x] T007 admin: form editor fields and checks; map editor field; Messages page status; en/cn strings; tests
- [ ] T008 After merge: Lin's check on ShowMine Pty Ltd Contact page (HubSpot, Messages, map in WeChat)
