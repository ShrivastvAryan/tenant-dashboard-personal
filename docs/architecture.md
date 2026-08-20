# Architecture

## Purpose

Tenant Dashboard is a dedicated frontend for API-key merchants operating in tenant mode. It is separate from the main gateway app and is optimized around tenant-scoped backend views, API-key operations, customer onboarding, and remittance monitoring.

## Runtime Model

- App Router Next.js application
- Hybrid server/client data model
- Server actions for authenticated backend access
- Thin API routes for browser-safe proxying where needed
- Cookie-based auth state shared across server actions

## Major Layers

### 1. Page Layer

Pages live under [src/app](E:\dashxw\tenant-dashboard\src\app).

Examples:

- [src/app/page.tsx](E:\dashxw\tenant-dashboard\src\app\page.tsx)
- [src/app/customers/page.tsx](E:\dashxw\tenant-dashboard\src\app\customers\page.tsx)
- [src/app/payments/page.tsx](E:\dashxw\tenant-dashboard\src\app\payments\page.tsx)
- [src/app/profile/page.tsx](E:\dashxw\tenant-dashboard\src\app\profile\page.tsx)
- [src/app/fx/page.tsx](E:\dashxw\tenant-dashboard\src\app\fx\page.tsx)
- [src/app/documentation/page.tsx](E:\dashxw\tenant-dashboard\src\app\documentation\page.tsx)

Responsibilities:

- fetch top-level page data
- own page-local UI state
- compose shared components
- coordinate pagination, filtering, and modals

### 2. Action Layer

Server-side data helpers live under [src/actions](E:\dashxw\tenant-dashboard\src\actions).

Key actions:

- [auth.ts](E:\dashxw\tenant-dashboard\src\actions\auth.ts)
- [tenant.ts](E:\dashxw\tenant-dashboard\src\actions\tenant.ts)
- [payments.ts](E:\dashxw\tenant-dashboard\src\actions\payments.ts)
- [apiKeys.ts](E:\dashxw\tenant-dashboard\src\actions\apiKeys.ts)
- [user.ts](E:\dashxw\tenant-dashboard\src\actions\user.ts)
- [webhooks.ts](E:\dashxw\tenant-dashboard\src\actions\webhooks.ts)
- [fx.ts](E:\dashxw\tenant-dashboard\src\actions\fx.ts)
- [businessDetails.ts](E:\dashxw\tenant-dashboard\src\actions\businessDetails.ts)

Responsibilities:

- call backend APIs
- normalize server responses into UI-friendly structures
- hide cookie/header auth details from page components

### 3. Proxy Route Layer

Route handlers under [src/app/api](E:\dashxw\tenant-dashboard\src\app\api) are used when the browser needs a controlled server-side proxy or derived file output.

Current routes:

- [api/user](E:\dashxw\tenant-dashboard\src\app\api\user\route.ts)
- [api/banks](E:\dashxw\tenant-dashboard\src\app\api\banks\route.ts)
- [api/customers/business](E:\dashxw\tenant-dashboard\src\app\api\customers\business\route.ts)
- [api/docs/offramp-api-key-flow](E:\dashxw\tenant-dashboard\src\app\api\docs\offramp-api-key-flow\route.ts)

Why these exist:

- hide tenant API-key-only backend calls from direct browser exposure
- adapt multipart submissions
- expose merchant ID and cookie-derived user context
- download the repo-local API markdown as a `.md` artifact

### 4. Shared Component Layer

Shared visual components live under [src/components](E:\dashxw\tenant-dashboard\src\components).

Important ones:

- [DashboardShell.tsx](E:\dashxw\tenant-dashboard\src\components\DashboardShell.tsx)
- [Sidebar.tsx](E:\dashxw\tenant-dashboard\src\components\Sidebar.tsx)
- [TopBar.tsx](E:\dashxw\tenant-dashboard\src\components\TopBar.tsx)
- [PaymentVolumeChart.tsx](E:\dashxw\tenant-dashboard\src\components\PaymentVolumeChart.tsx)
- [PaymentStatusBreakdown.tsx](E:\dashxw\tenant-dashboard\src\components\PaymentStatusBreakdown.tsx)
- [RecentPaymentsTable.tsx](E:\dashxw\tenant-dashboard\src\components\RecentPaymentsTable.tsx)
- [ApiKeyCard.tsx](E:\dashxw\tenant-dashboard\src\components\ApiKeyCard.tsx)
- [WebhookManagerCard.tsx](E:\dashxw\tenant-dashboard\src\components\WebhookManagerCard.tsx)
- [FxConverterCard.tsx](E:\dashxw\tenant-dashboard\src\components\FxConverterCard.tsx)
- [ProfileCard.tsx](E:\dashxw\tenant-dashboard\src\components\ProfileCard.tsx)

## Auth Architecture

### Cookie State

Login writes these cookies:

- `access-token`
- `refresh-token`
- `wallet-id`
- `user-email`
- `username`

These are consumed inside [src/lib/api.ts](E:\dashxw\tenant-dashboard\src\lib\api.ts), which injects `Authorization: Bearer <access-token>` for non-public backend calls.

### Login Flow

1. `initiateLogin(email, password)` checks account type with `/login/`
2. credentials are stored temporarily in `user-cred`
3. OTP is sent and verified
4. login is repeated to obtain access and refresh tokens
5. auth cookies are set

The flow is implemented in [src/actions/auth.ts](E:\dashxw\tenant-dashboard\src\actions\auth.ts).

## Data Domains

### Tenant Stats

Driven by backend `/tenant/stats/`.

Used by:

- homepage summary cards
- homepage volume chart
- customers page stat cards
- payments page stat cards

### Tenant Users

Driven by backend `/tenant/users/`.

Includes:

- customer type
- remitted volume
- kyc/kyb status
- bank account summaries
- KYB documents on record

### Tenant Payments

Driven by backend `/tenant/payments/`.

This is a unified feed over:

- deposits
- local offramps
- international offramps
- withdrawals

The frontend treats it as an activity stream rather than a strict ledger model.

## Charting

Homepage payment volume uses `recharts` in [PaymentVolumeChart.tsx](E:\dashxw\tenant-dashboard\src\components\PaymentVolumeChart.tsx).

Reasons:

- smooth range transition behavior
- gateway-compatible chart interaction model
- simpler long-term maintenance than custom div/SVG charting

## Session API Key Reuse

When a tenant creates or regenerates an API key in [ApiKeyCard.tsx](E:\dashxw\tenant-dashboard\src\components\ApiKeyCard.tsx), the raw key is stored once in session storage under:

`tenant-dashboard:latest-api-key`

This is reused by the business customer onboarding modal so the user does not need to paste the key again. If absent, the UI falls back to manual entry.

## Documentation Embedding

The documentation page is not hand-authored static content. It reads and renders the repo-local offramp doc snapshot through:

- [documentation/page.tsx](E:\dashxw\tenant-dashboard\src\app\documentation\page.tsx)
- [api/docs/offramp-api-key-flow/route.ts](E:\dashxw\tenant-dashboard\src\app\api\docs\offramp-api-key-flow\route.ts)

That keeps tenant docs self-contained inside this repo while still presenting them inside the app UI.
