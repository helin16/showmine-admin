<!--
Sync Impact Report
- Version: 1.1.0 draft -> 1.2.0 proposed (all-change impact assessment across all repositories)
- Principles added: mandatory three-repository impact assessment
- Principles expanded: feature initiation and cross-repository coordination
- Sections expanded: Development Workflow
- Follow-up: obtain project-owner approval and replace the ratification-date TODO
-->

# ShowMine Admin Constitution

This constitution governs the ShowMine admin repository and its integration with the
ShowMine reader and API repositories. It is a proposed baseline and remains a draft
until approved by the project owner.

## Core Principles

### I. Preserve the Typed React Architecture
Features MUST use the existing React and TypeScript architecture and follow established
boundaries between pages, components, Redux state, and services. New dependencies or
architectural changes MUST solve a stated need; broad refactors MUST be kept separate
from feature work unless they are required for correctness.

### II. Enforce Authorization and Tenant Boundaries
Protected pages MUST retain the authentication, company-admin, and super-admin access
checks appropriate to the feature. Company-scoped operations MUST use the active company
context, and the backend MUST remain the authority for authentication and authorization;
client-side route guards are not a security boundary. Changes to access or company
selection MUST include regression tests for allowed and denied cases.

### III. Preserve Cross-Repository API Contracts
The admin app and public reader both consume the ShowMine API; neither frontend owns
server-side business rules, persistence, or authorization. Changes to API request or
response shapes, authentication, company scoping, or error behavior MUST account for
both consumers. Breaking contract changes MUST be coordinated across the affected
repositories and deployed in a backward-compatible sequence, or use an explicitly
versioned migration. Consumer and API tests MUST cover the changed contract.

### IV. Assess Every Change Across All Three Repositories
Every feature and change, including bug fixes, maintenance, security updates,
dependencies, configuration, and documentation, MUST assess `showmine-admin`,
`showmine-reader`, and `showmine-api`. The originating change record MUST state the
impact on each repository and give a reason when one is unaffected. Implementation MUST
NOT begin until this scope is recorded. Cross-repository work MUST identify required
coordination, validation, and deployment sequencing; a repository-local change may
remain local when the other repositories are explicitly assessed as unaffected.

### V. Keep Browser Configuration and Data Safe
HTTP calls MUST use the shared service layer and preserve its established handling of
authentication and company context. Values embedded in the browser bundle, including
Create React App `REACT_APP_*` variables, MUST be treated as public; secrets MUST NOT be
placed in them or committed to the repository. Authentication tokens and private user
data MUST NOT be written to logs or error messages.

### VI. Keep the Interface Accessible and Localized
User-facing features MUST support the existing English and Chinese localization model
and preserve responsive layouts. Interactive controls MUST be usable with a keyboard
and provide meaningful labels and visible loading, empty, success, and error states
where applicable. Existing Ant Design and shared form components SHOULD be reused.

### VII. Verify Observable Behavior
Behavioral changes MUST have regression tests at the narrowest useful level. Tests for
authentication, role access, company context, and API behavior MUST cover relevant
success and failure cases. Before merging application changes, run `yarn lint`,
`CI=true yarn test --watchAll=false`, and `yarn build`; document any command that cannot
run and its reason.

### VIII. Preserve Vercel Deployment Behavior
Changes to routes, build configuration, or runtime configuration MUST be checked against
the admin app's Vercel deployment model. Client-side routes MUST continue to load on
direct navigation and page refresh, not only after navigating from the home page. Preview
deployments SHOULD be used to verify material routing or configuration changes before
production. Vercel environment values exposed to the client MUST follow Principle V.

## Technical Constraints

- The current application stack is React 18, TypeScript, Create React App 5, Redux
  Toolkit, React Router, and Ant Design. Changes MUST preserve compatibility with the
  installed stack unless an approved migration explicitly changes it.
- Localization uses `react-intl` with English and Chinese message catalogs.
- The ShowMine product is split across three repositories: `showmine-admin` is the
  company administration app; `showmine-reader` is the public reader for a company or
  article; and `showmine-api` provides the API consumed by both frontends.
- This admin app is hosted on Vercel and communicates with the separately deployed API.
  Do not assume the reader shares the admin app's hosting or deployment configuration.
- The API is the authority for shared data and server-side authorization. A frontend
  deployment or route guard MUST NOT be treated as a substitute for API authorization.

## Development Workflow

- Specifications and plans MUST identify affected access roles, company scope,
  localization, deployment behavior, and API consumers when relevant.
- Every feature/change record MUST include an explicit impact entry for each of
  `showmine-admin`, `showmine-reader`, and `showmine-api`, including an explanation for
  any repository marked unaffected. This assessment is required for all change types,
  not only shared API changes.
- Implementation MUST follow existing project patterns and include tests for changed
  behavior; test-only or configuration changes MUST state the behavior they protect.
- Product feature changes MUST be initiated, specified, and prioritized in the
  `showmine-admin` repository. A maintenance or urgent fix may originate in another
  repository, but its three-repository impact assessment MUST be recorded before
  implementation and linked to the admin feature/change record as soon as practical.
- Coordinate and validate changes in every repository identified as affected; do not
  make unrelated changes to repositories explicitly assessed as unaffected.
- Before merge, verify lint, tests, and production build. For changes affecting routing
  or deployment configuration, additionally verify direct route loading in a Vercel
  preview deployment.

## Governance

This constitution governs feature specifications, plans, implementation, and review.
Amendments require project-owner approval, an updated amendment date, and a semantic
version increment: MAJOR for incompatible principle changes, MINOR for new or
materially expanded principles, and PATCH for non-semantic clarification. Reviews
MUST identify any deviation and its justification. When this constitution conflicts
with a higher-priority security or platform requirement, the higher-priority
requirement takes precedence and the conflict MUST be documented.

**Version**: 1.2.0 | **Ratified**: TODO (pending project-owner approval) | **Last Amended**: 2026-10-31
