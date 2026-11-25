# Feature Specification: Website Builder

**Feature Branch**: `SMN-53-website-builder`

**Created**: 2026-11-22

**Status**: Draft, for Lin's approval

**Input**: User description: "Sprint 3, Jira epic SMN-53 'Free Website Builder for Australian Small Businesses' with stories SMN-55 to SMN-65: a small business registers its profile, picks a template, edits pages and sections, manages images, sets its address, SEO and publish state, and sees basic visit numbers; visitors see the published site in the public reader."

## Repository Impact *(required by all three constitutions)*

This is a product feature, so it starts here in `showmine-admin`, as Principle IV and the Development Workflow require. The Reader and API records link back to this spec.

| Repository | Impact |
|---|---|
| `showmine-admin` | Affected. Adds the Website area: profile and address, templates, pages and sections, media picker, publish and SEO settings, and analytics. Adds the menu entry and the address field on the company page. |
| `showmine-api` | Affected. Adds the data, rules and permissions for websites, pages, sections, templates, website images, publishing and page views. Website images are added to asset clean-up. Plans get a page limit. |
| `showmine-reader` | Affected. Adds public website pages, template preview pages and page-view counting. Existing article pages are unchanged. |

Deployment order for every slice: API first (additive and hidden behind the switch), then Reader, then Admin. No company sees anything until ShowMine turns the builder on for it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set up the business profile and create the website (Priority: P1)

A company admin completes the business profile: name, description, contact details and address. They then create the company's website by choosing its web address name. Jira: SMN-55, SMN-56.

*Amended 2026-11-25 (SMN-81):* the website is created when a super admin turns the switch on, named after the company. Admins can rename it; its address and ShowMine subdomain are made from the name and a fixed code.

**Why this priority**: Every other story needs a website record and the business details it shows.

**Independent Test**: With the builder turned on for a test company, an admin fills in the profile, finds the website created and named after the company, renames it, reloads, and sees everything kept. A member of the same company cannot see or change any of it.

**Acceptance Scenarios**:

1. **Given** a company with no website, **When** a super admin turns the builder on, **Then** the website is created, unpublished, named after the company, at an address made from the name and a code (SMN-81).
2. **Given** another company with the same name, **Then** the two websites get different addresses, by their codes.
3. **Given** an admin enters a name with spaces, symbols or Chinese, **When** they save, **Then** it is kept as entered and the address is made from its letters and digits; an empty or over-long name is named as the problem.
4. **Given** a company member who is not an admin, **When** they open the Website area or call it directly, **Then** they are refused.
5. **Given** the builder is off for a company, **When** anyone in that company looks, **Then** the Website area does not exist for them.
6. **Given** two admins have the settings open, **When** the second saves after the first, **Then** the second is told to reload, and the first admin's change is kept.

---

### User Story 2 - Edit pages and sections without publishing (Priority: P1)

*Amended 2026-11-25 (SMN-80):* any member of the company does this, except deleting pages, which stays with admins. The admin menu shows Website under Components, after Media: Pages and Page views for everyone; Publish and address, Templates and Settings for admins.

An admin adds, renames, reorders and removes pages. On each page they add, edit, reorder and remove sections: hero, text, image, gallery, contact details and latest articles. They preview the draft at any time, and saving never makes it public. Jira: SMN-59, SMN-60.

**Why this priority**: Pages and sections are the website's content.

**Independent Test**: An admin builds a two-page draft with several section types, reorders them, previews it, and confirms the public address still shows nothing.

**Acceptance Scenarios**:

1. **Given** a website, **When** an admin adds a page and three sections and saves, **Then** they come back in the same order after a reload.
2. **Given** a section with a field over its limit, or a link that is not a web, email or phone link, **When** the admin saves, **Then** the field's problem is shown and nothing is saved.
3. **Given** the plan's page limit is reached, **When** the admin adds a page, **Then** they are told the limit and nothing is added.
4. **Given** an admin deletes a page, **When** asked, they confirm, **Then** the page disappears and its address name can be reused.
5. **Given** a draft with changes, **When** the admin opens the preview, **Then** a new tab shows the draft for up to 30 minutes, and the preview link does not appear in search results.
6. **Given** unsaved changes by another admin since this page was loaded, **When** this admin saves, **Then** they are told to reload and nothing is overwritten.

---

### User Story 3 - Publish, and visitors see the website (Priority: P1)

An admin publishes. Visitors on a phone or a computer see the published pages, with navigation between them and the right page titles. Draft changes and profile edits made after publishing stay hidden until the next publish. Unpublishing takes the site down. Jira: SMN-63 and the publish part of SMN-64.

**Why this priority**: Visitors seeing the site is the point of the whole feature. With stories 1 and 2 it forms the minimum viable product.

**Independent Test**: Publish the test company's draft. Open the public address on a phone-sized and a desktop-sized screen. Edit the draft and the company phone number, and confirm the public site has not changed. Publish again and confirm it has. Unpublish and confirm the address shows not-found.

**Acceptance Scenarios**:

1. **Given** a published site, **When** a visitor opens its address, **Then** they see the home page, can move to every published page, and see each page's title and description in search and sharing previews.
2. **Given** a visitor opens a page name that does not exist, an unpublished site, or a company with the builder off, **Then** they see the same not-found page in every case.
3. **Given** a published site, **When** an admin edits the draft or the company's contact details, **Then** visitors still see the published version until the next publish.
4. **Given** a draft with no pages, a broken section or a missing image, **When** an admin publishes, **Then** every problem is listed and the public site is unchanged.
5. **Given** an "articles" section, **When** a visitor opens the page, **Then** the company's latest published articles appear and link to the existing article pages.

---

### User Story 4 - Start from a template (Priority: P2)

*Amended 2026-11-25 (SMN-80):* templates replace the whole site (theme and pages), so only admins apply them.

An admin browses templates, each shown with its name, a thumbnail and a description, and opens a full preview before choosing one. Choosing a template creates its starting pages. If pages already exist, the admin is warned before anything is replaced. Jira: SMN-57, SMN-58.

**Why this priority**: Templates make the first site quick to build, but a site can be built without one.

**Independent Test**: An admin with no pages previews two templates, picks one, and gets its pages. Picking it again creates nothing new. Picking another one warns before replacing.

**Acceptance Scenarios**:

1. **Given** the template list, **When** an admin opens a template's preview, **Then** a new tab shows the template's pages with sample content.
2. **Given** a website with no pages, **When** an admin picks a template, **Then** its pages and sections are created once, even if the request is repeated.
3. **Given** a website with pages, **When** an admin picks a template, **Then** they are told how many pages would be replaced and must confirm.
4. **Given** a template with more pages than the plan allows, **When** an admin picks it, **Then** they are told the limit and nothing is created.
5. **Given** the gallery on a phone-sized screen, **Then** it is usable.

---

### User Story 5 - Manage website images (Priority: P2)

An admin uploads images, watching upload progress, then picks them for sections. They see each image's preview, size and where it is used, and remove images that are not used. Jira: SMN-61, SMN-62.

*Amended 2026-11-25 (SMN-80):* there is one image library. The picker lists every JPEG, PNG, WebP or GIF image in Media, members may upload, and Media shows where the website uses an image and refuses to delete it. The separate "Website images" page is gone.

**Why this priority**: Sites need the business's own pictures. Text-only sites work without this.

**Independent Test**: Upload a JPEG, use it in a hero section, try to delete it (refused, with the reason), remove it from the section, then delete it.

**Acceptance Scenarios**:

1. **Given** an image file that is not JPEG, PNG, WebP or GIF, or is over 10 MB, or would exceed the plan's storage, **When** uploaded, **Then** the admin sees why, and nothing is stored.
2. **Given** an image used in a draft or the published site, **When** an admin deletes it, **Then** they are refused and told where it is used.
3. **Given** an upload that fails part-way, **Then** no broken image is left in the library.
4. **Given** another company's image, **When** someone tries to use it in a section, **Then** the save is refused.
5. **Given** website images, **When** the monthly clean-up runs, **Then** images used by any website are kept.

---

### User Story 6 - SEO and web address settings (Priority: P2)

An admin sets the site's and each page's title, description and sharing image. *(Amended 2026-11-25, SMN-81: the ShowMine subdomain is set from the website name, not entered.)* They record a ShowMine subdomain, which is checked for availability, and a custom domain, whose verification state they can see. Jira: SMN-64.

**Why this priority**: Being found and having a proper address matter, but the path address works without them.

**Independent Test**: Set the site and page SEO, publish, and check the page source of the public site. Enter a subdomain another company holds and see it refused. Enter a custom domain and see "pending".

**Acceptance Scenarios**:

1. **Given** SEO text over its limit, **When** saved, **Then** the limit is shown.
2. **Given** a custom domain another website holds, **When** saved, **Then** it is refused as taken. (The ShowMine subdomain is made from the website name, SMN-81.)
3. **Given** a recorded custom domain, **Then** its state (pending, verified or failed) is shown, and only ShowMine staff can change it.
4. **Given** published SEO settings, **When** a page is shared or crawled, **Then** the page's own title and description are used, falling back to the site's, then the company's.

---

### User Story 7 - See page views (Priority: P3)

A member picks a period of up to a year and sees page views per day and per page, with when the numbers were last updated. Jira: SMN-65.

**Why this priority**: Useful feedback once a site is live, but not needed to have one.

**Independent Test**: Visit two pages of the test site several times, then open analytics and see the counts. Pick a period with no views and see zeros, not an error.

**Acceptance Scenarios**:

1. **Given** views on two pages, **When** an admin opens analytics for the last 7 days, **Then** daily counts per page are shown, labelled with the period and the last update time.
2. **Given** a period with no views, **Then** an empty state or zeros are shown.
3. **Given** a member who is not an admin, or another company, **Then** analytics are refused.
4. **Given** previews and ShowMine's automated checks, **Then** they are not counted.

### Edge Cases

- A company is deactivated while its site is published: the public site shows not-found.
- An image used by a draft or the published site cannot be deleted (FR-017), and clean-up keeps it (FR-019), so a published page never points to a removed image. If a draft image is missing at publish time, publish lists it (FR-010).
- A visitor opens an old page name after the page was renamed and republished: not-found.
- An admin's preview link expires: the preview shows not-found.
- The builder is turned off while a site is published: the public site shows not-found, and the data is kept.
- Two companies ask for the same name at the same moment: one gets it, and the other is told it is taken.
- A removed website or page frees its name for reuse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: ShowMine staff MUST be able to turn the builder on or off per company. When off, the company sees no Website area, editing is refused, and its public site shows not-found.
- **FR-002**: Only the company's approved members (and ShowMine staff) MUST be able to view or change its website. Any member MAY view the website, add, edit and reorder pages and sections, preview the draft, upload images and see page views. Only its admins MAY delete pages, publish or unpublish, change the address name, apply a template and change the settings (SEO and addresses). *(Amended 2026-11-25, SMN-80; was admins only.)*
- **FR-003**: The business profile MUST be the company's existing profile plus an address of at most 500 characters.
- **FR-004**: Each company MUST have at most one active website. It has a name (1 to 80 characters, any text). Its address MUST be made from the name and a 6-character code made once: letters and digits kept, anything else a hyphen, accents dropped, `site` when nothing is left, cut so the whole is at most 40 characters (`test company` → `test-company-a1b2c3`). Renaming keeps the code; the old address stops working. Turning the switch on creates the website, named after the company. *(Amended 2026-11-25, SMN-81; was an address name chosen by the admin.)*
- **FR-005**: Admins MUST be able to create, rename, reorder and delete pages. Each page MUST have a name unique within its website, and the first page MUST be the home page.
- **FR-006**: Pages MUST be made of sections of six types: hero, text, image, gallery (1 to 24 images), contact details, and latest articles (3 to 12). Each field MUST have a stated limit. A page MUST have at most 30 sections.
- **FR-007**: Links in sections MUST be web, email or phone links, or a page of the same site. Map links MUST be secure web links.
- **FR-008**: Text sections MUST be cleaned of unsafe content when saved and again when published.
- **FR-009**: Saving MUST never change the public site. Publishing MUST make the current draft, its settings and the contact details it shows public together. Unpublishing MUST take the site down.
- **FR-010**: Publishing MUST refuse a draft with no pages, an invalid section, an image that is missing, inactive or another company's, or a link to a page that does not exist, and MUST list every problem.
- **FR-011**: The website and each page MUST show whether they have unpublished changes.
- **FR-012**: A save based on an out-of-date copy MUST be refused with a request to reload.
- **FR-013**: Admins MUST be able to preview the draft in a new tab through a link that expires after 30 minutes and is hidden from search engines.
- **FR-014**: The system MUST offer three templates with name, thumbnail, description and a full preview. Choosing one MUST create its pages once and warn before replacing existing pages.
- **FR-015**: The number of pages MUST be limited by plan: Free 5, Starter 20, Unlimited no limit. Companies with no plan have no limit.
- **FR-016**: Website images MUST be JPEG, PNG, WebP or GIF, MUST belong to the company that uses them, and MAY be any such image in the company's Media library, not only website uploads (one image library, SMN-80). Uploads from the website MUST be at most 10 MB each and count toward the plan's storage. The published copy MUST take each image's address from its stored file, never from an address saved with it.
- **FR-017**: An image used by a draft or the published site MUST NOT be deletable, nor have its file changed, through Media. Media MUST show where the website uses each image.
- **FR-018**: A failed upload MUST NOT leave a stored file without a library entry, or the reverse.
- **FR-019**: Asset clean-up MUST treat images used by any website as in use, whatever their type.
- **FR-020**: Visitors MUST see published pages with navigation, the not-found page for anything else, and a layout that works from phone to desktop.
- **FR-021**: Each public page MUST provide a title, description and sharing image, falling back from the page to the site to the company.
- **FR-022**: Admins MUST be able to set site and page SEO (title up to 70 characters, description up to 160), and to record a custom domain, unique, whose state (pending, verified, failed) only ShowMine staff change. The ShowMine subdomain MUST equal the address and be set automatically, `pending` until it is served (SMN-79). *(Amended 2026-11-25, SMN-81; the subdomain was entered by the admin.)*
- **FR-023**: Page views MUST be counted per page per day (UTC), excluding previews and ShowMine's automated checks, without storing anything that identifies a visitor.
- **FR-024**: The company's members MUST be able to see page views per day and per page for a period of up to 366 days, with the period and last update time shown, and zeros when there are none. They are shown on the dashboard, titled "Website page views", only for a company with its website switched on. *(Amended 2026-11-25, SMN-82; was a page under Website.)*
- **FR-025**: All admin screens MUST be in English and Chinese, usable by keyboard, and show loading, empty, success and error states. Destructive actions MUST ask for confirmation.

### Key Entities

- **Company (business profile)**: the existing company, plus an address and the builder switch.
- **Website**: one per company. Holds its name and address code (SMN-81), the address made from them, theme, SEO, the recorded subdomain and custom domain with their states, the published copy, and when and by whom it was published.
- **Page**: belongs to a website. Holds a name, title, order, SEO and its ordered sections.
- **Section**: part of a page. Has one of six types, with typed fields.
- **Template**: provided by ShowMine and versioned. Holds a name, description, thumbnail, theme and starting pages.
- **Website image**: an image in the company's media library, marked for website use.
- **Page-view count**: a website, a page name, a day and a count.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A company admin new to the builder can go from no website to a published three-page site from a template in under 20 minutes.
- **SC-002**: A published page opens with its content in under 3 seconds on a typical mobile connection.
- **SC-003**: No draft change, preview, unpublished site or switched-off company is ever visible at a public address. Checked by test for every case in User Story 3.
- **SC-004**: A member or another company cannot read or change any website data. Checked by test for every editing action.
- **SC-005**: Every admin screen of the feature works in English and Chinese, from phone to desktop.
- **SC-006**: No company without the switch sees any change during the whole sprint.

## Assumptions

- Lin accepted these defaults on 2026-11-22:
  - the business is the existing company;
  - addresses are paths first, and subdomains are served only after ShowMine configures DNS, hosting and the API's allowed origins;
  - templates are written by ShowMine and not editable in the admin;
  - there are six section types;
  - there is a per-company switch;
  - pages are limited by plan;
  - page views are counted without cookies.
- One published copy is kept. Release history and restore are out of scope, because no acceptance criterion asks for them.
- The analytics metric is page views. Unique visitors are out of scope.
- The public site is not cached in v1, as with article pages.
- Reordering uses up and down controls, not drag-and-drop.
- Out of scope:
  - forms that store visitor data, and e-commerce;
  - automated domain verification and certificates;
  - more than one website per company;
  - scheduled publishing;
  - WeChat sharing of website pages (SMN-78, Sprint 4).
- Lin checks each admin and reader slice on the test company after it is deployed, because the existing end-to-end suites run against production and are not run by MAOS.
