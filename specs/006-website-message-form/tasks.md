---

description: "Task list for the website message form"
---

# Tasks: Website Message Form

**Tests**: required by all three constitutions (VII). Paths prefixed `admin:`, `api:`, `reader:`.

- [x] T001 api: migration and `WebsiteMessage` model (no user associations), registered in LocalModels
- [x] T002 api: `form` section type
- [x] T003 api: `POST /publicWebsite/:slug/message` with field checks, trap field and address limiter; tests
- [x] T004 api: notification type and processor (company email with reply-to, else admins); SES reply-to; tests
- [x] T005 api: admin endpoints list / read / delete, admins only, company scoped; tests for allowed and denied
- [x] T006 reader: `MessageForm` client component (labels, required, busy, thanks, errors) and CSS; tests
- [x] T007 admin: palette tile, editor and canvas for `form`; tests
- [x] T008 admin: Website > Messages page, menu item with unread count, service; tests for admin and member
- [ ] T009 After merge: Lin checks on the test company (send, email, Messages); add the form to the ShowMine Pty Ltd Contact page (draft)
