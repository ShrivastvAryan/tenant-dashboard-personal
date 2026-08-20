# Development

## Backend Dependency

This app assumes DashX backend is available locally at:

`http://localhost:8989`

Configured via:

- [`.env.local`](E:\dashxw\tenant-dashboard\.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8989
```

If backend is restarted frequently during local development, the tenant app usually only needs a browser refresh unless the change affects static build-time code or docs embedding behavior.

## Install And Run

### npm

```bash
npm install
npm run dev
```

### bun

```bash
bun install
bun dev
```

## Build Verification

Use one of:

```bash
npm run build
```

or

```bash
bun run build
```

This repo has been developed with repeated build verification rather than a deep automated test suite.

## Key Development Conventions

### 1. Prefer server actions for authenticated backend calls

Most authenticated reads and writes should live in [src/actions](E:\dashxw\tenant-dashboard\src\actions), not directly inside random client components.

### 2. Use route handlers only when browser-side proxying is required

Examples:

- multipart form adaptation
- cookie-derived merchant/user context
- markdown download/file output

### 3. Keep tenant behavior separate from gateway assumptions

This app is not just a reskinned gateway. Its data model is tenant-scoped and often uses different backend endpoints and visibility rules.

### 4. Preserve current design language

The repo already has an established shell/card/table style. New work should follow that, not revert to starter boilerplate UI.

## Common Backend Touchpoints

When debugging frontend issues, these backend families matter most:

- auth/login/OTP
- tenant metrics and users
- API key management
- webhook CRUD
- international banks
- business recipient create + KYB upload
- FX quote/rate endpoints

## Known Integration Patterns

### API Key Reuse In Session

Business onboarding reuses:

`tenant-dashboard:latest-api-key`

stored in browser session storage by [ApiKeyCard.tsx](E:\dashxw\tenant-dashboard\src\components\ApiKeyCard.tsx).

If missing, the customers modal can fall back to manual entry.

### Cookie-Derived Merchant ID

Merchant ID comes from the `wallet-id` cookie through:

- [src/app/api/user/route.ts](E:\dashxw\tenant-dashboard\src\app\api\user\route.ts)

### Unified Payments Feed

The payments page expects `/tenant/payments/` to provide a normalized mixed feed. If something looks wrong in the UI:

1. verify backend aggregation
2. verify status normalization
3. verify whether the issue is page-local or homepage-local because both have their own renderers

## Docs Workflow

Tenant docs are now part of the repo.

Update these when the product changes materially:

- [README.md](E:\dashxw\tenant-dashboard\README.md)
- [docs/architecture.md](E:\dashxw\tenant-dashboard\docs\architecture.md)
- [docs/pages-and-flows.md](E:\dashxw\tenant-dashboard\docs\pages-and-flows.md)
- [docs/development.md](E:\dashxw\tenant-dashboard\docs\development.md)

The embedded in-app API doc page is distinct. It mirrors backend markdown, so backend docs may need updating separately when API contracts change.
The tenant app now serves a local snapshot from [docs/offramp-api-key-flow.md](E:\dashxw\tenant-dashboard\docs\offramp-api-key-flow.md), so this repo no longer needs to read the backend repo directly at runtime.

## Known Gaps

- middleware/proxy migration warning from Next.js 16 still exists
- webhook page is implemented but hidden from nav
- unified tenant payments view is still a pragmatic merged activity feed, not a perfect accounting surface
- local automated tests are minimal compared to the amount of UI logic in the repo
