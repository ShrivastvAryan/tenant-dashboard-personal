# Tenant Dashboard

Tenant Dashboard is the tenant-facing Next.js app for API-key merchants in DashX. It gives API owners a dedicated UI for tenant-scoped customers, remittance activity, FX conversion, API key management, embedded offramp docs, and operational views that are intentionally separate from the main gateway merchant app.

This repo is not a generic Next.js starter anymore. It is tightly coupled to the DashX backend running at `http://localhost:8989` and assumes tenant-enabled merchant accounts.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Axios for backend calls
- Recharts for homepage volume chart

## What The App Does

- Authenticates tenant merchants with password + OTP flow
- Reads tenant-scoped data from backend `/tenant/*` endpoints
- Shows tenant homepage metrics, recent activity, and payment status breakdown
- Lists tenant customers with onboarding status, bank details, and recipient metadata
- Supports business customer creation through API-key-backed backend proxy routes
- Exposes API key and merchant ID management
- Provides FX conversion for local and international rate flows
- Embeds tenant-facing API docs directly in-app with markdown export from a local repo copy

## Main Pages

- `/`
  Tenant overview, payment volume chart, status breakdown, recent activity, API key card
- `/customers`
  Tenant customer list, business customer creation flow, onboarding status, customer detail dialog
- `/payments`
  Unified tenant activity feed across deposits, offramps, and withdrawals
- `/profile`
  Tenant account and business details
- `/fx`
  USDC to INR converter using backend FX endpoints
- `/documentation`
  Embedded API-key offramp docs rendered from a local markdown copy in this repo
- `/login`
  Password + OTP login flow

The `webhooks` page still exists in code, but the sidebar item is currently hidden.

## Local Development

### Requirements

- Node.js or Bun
- DashX backend running locally on `http://localhost:8989`
- A tenant-enabled merchant account in the backend

### Environment

Current local env:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8989
```

If you change backend host/port, update `.env.local`.

### Install

Using npm:

```bash
npm install
```

Using bun:

```bash
bun install
```

### Run

Using npm:

```bash
npm run dev
```

Using bun:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
```

or

```bash
bun run build
```

## Authentication Model

The app uses backend-issued cookies and server actions.

Cookies set during login:

- `access-token`
- `refresh-token`
- `wallet-id`
- `user-email`
- `username`

Important details:

- Most server actions use `axiosInstance` from [src/lib/api.ts](E:\dashxw\tenant-dashboard\src\lib\api.ts)
- `axiosInstance` reads auth cookies server-side and forwards the bearer token
- Public auth routes are exempted from bearer injection
- Some user UI falls back to cookie values if a profile call fails

## Project Layout

```text
src/
  actions/         Server-side data fetch and mutation helpers
  app/             App Router pages and route handlers
  components/      Shared UI building blocks
  hooks/           Client hooks, including dashboard search sync
  lib/             Axios setup and documentation helpers
```

Important folders:

- [src/actions](E:\dashxw\tenant-dashboard\src\actions)
- [src/app](E:\dashxw\tenant-dashboard\src\app)
- [src/components](E:\dashxw\tenant-dashboard\src\components)

## Key Backend Contracts

The tenant UI relies on these backend areas:

- `/tenant/stats/`
- `/tenant/users/`
- `/tenant/payments/`
- `/api-keys/`
- `/api-keys/create_key/`
- `/api-keys/regenerate_key/`
- `/api-keys/revoke_key/`
- `/merchant-webhook/`
- `/getUserInfo/from-email/`
- `/offramp/international/banks/`
- `/offramp/international/recipients/create/`
- `/offramp/international/kyb/upload/`

Proxy routes inside this repo:

- [src/app/api/user/route.ts](E:\dashxw\tenant-dashboard\src\app\api\user\route.ts)
- [src/app/api/banks/route.ts](E:\dashxw\tenant-dashboard\src\app\api\banks\route.ts)
- [src/app/api/customers/business/route.ts](E:\dashxw\tenant-dashboard\src\app\api\customers\business\route.ts)
- [src/app/api/docs/offramp-api-key-flow/route.ts](E:\dashxw\tenant-dashboard\src\app\api\docs\offramp-api-key-flow\route.ts)

## Search Behavior

- Global top-bar search is app-wide and fetches live customer/payment matches
- Page-level search on customers and payments is local to the current page data
- Search wiring lives in:
  - [src/components/TopBar.tsx](E:\dashxw\tenant-dashboard\src\components\TopBar.tsx)
  - [src/hooks/useDashboardSearch.ts](E:\dashxw\tenant-dashboard\src\hooks\useDashboardSearch.ts)

## Business Customer Flow

The customers page contains a tenant business onboarding flow:

1. Create recipient
2. Upload KYB documents

The UI uses the stored session API key when available and falls back to manual entry when absent.

Relevant files:

- [src/app/customers/page.tsx](E:\dashxw\tenant-dashboard\src\app\customers\page.tsx)
- [src/app/api/customers/business/route.ts](E:\dashxw\tenant-dashboard\src\app\api\customers\business\route.ts)

## Documentation

Additional docs live under [docs](E:\dashxw\tenant-dashboard\docs):

- [docs/architecture.md](E:\dashxw\tenant-dashboard\docs\architecture.md)
- [docs/pages-and-flows.md](E:\dashxw\tenant-dashboard\docs\pages-and-flows.md)
- [docs/development.md](E:\dashxw\tenant-dashboard\docs\development.md)
- [docs/offramp-api-key-flow.md](E:\dashxw\tenant-dashboard\docs\offramp-api-key-flow.md)

## Notes

- The tenant app intentionally preserves the established visual language used during this implementation cycle rather than falling back to the default Next.js starter style.
- The middleware file warning comes from Next.js 16 deprecating `middleware` in favor of `proxy`. That is not a tenant-feature bug, but the repo should eventually be migrated.
