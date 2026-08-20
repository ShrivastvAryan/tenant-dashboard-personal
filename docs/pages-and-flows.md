# Pages And Flows

## Homepage

File:

- [src/app/page.tsx](E:\dashxw\tenant-dashboard\src\app\page.tsx)

Components:

- [PaymentVolumeChart.tsx](E:\dashxw\tenant-dashboard\src\components\PaymentVolumeChart.tsx)
- [PaymentStatusBreakdown.tsx](E:\dashxw\tenant-dashboard\src\components\PaymentStatusBreakdown.tsx)
- [RecentPaymentsTable.tsx](E:\dashxw\tenant-dashboard\src\components\RecentPaymentsTable.tsx)
- [ApiKeyCard.tsx](E:\dashxw\tenant-dashboard\src\components\ApiKeyCard.tsx)

Data sources:

- `GetTenantStats()`
- `GetTenantPayments(1, "all")`
- `GetCurrentUser()`

Behavior:

- greets the tenant user using fetched username
- shows tenant-scoped payment/remittance metrics
- shows charted remitted volume across time filters
- shows recent activity and API key state

## Customers Page

File:

- [src/app/customers/page.tsx](E:\dashxw\tenant-dashboard\src\app\customers\page.tsx)

Main responsibilities:

- fetch tenant customers
- show customer count, active customer count, total remitted volume
- support search over loaded customer rows
- export customers to CSV
- open a business customer creation modal
- open a customer details modal from the overflow menu

### Business Customer Creation

Current flow is business-first.

Step 1:

- create recipient
- uses bank master lookup
- uses locked country/currency fields
- auto-fills payment code from selected bank

Step 2:

- upload KYB document set
- supports representative/director/UBO count-based inputs
- supports upload reuse for duplicate people

Backed by:

- [src/app/api/customers/business/route.ts](E:\dashxw\tenant-dashboard\src\app\api\customers\business\route.ts)

### Customer Details Dialog

Shows:

- customer type
- KYC or KYB status
- last login
- local and international bank details
- KYB documents on record

Display rules:

- business users show KYB status only
- individual users show KYC status only
- provider names are transformed into user-facing channels like `Local` and `International`

## Payments Page

File:

- [src/app/payments/page.tsx](E:\dashxw\tenant-dashboard\src\app\payments\page.tsx)

Responsibilities:

- fetch unified tenant payment/activity feed
- filter by `all`, `deposit`, `offramp`, `withdraw`
- search within the current loaded page
- export current view to CSV
- show summary cards based on the filtered dataset

Important detail:

This page is an activity view. It is not a strict financial ledger presentation, so amount and currency interpretation depends on the underlying item type.

## Profile Page

File:

- [src/app/profile/page.tsx](E:\dashxw\tenant-dashboard\src\app\profile\page.tsx)

Shows only:

- business details
- username
- email
- member since

The page intentionally avoids showing reward/swap/referral clutter.

## FX Page

File:

- [src/app/fx/page.tsx](E:\dashxw\tenant-dashboard\src\app\fx\page.tsx)

Component:

- [FxConverterCard.tsx](E:\dashxw\tenant-dashboard\src\components\FxConverterCard.tsx)

Responsibilities:

- convert USDC to INR
- switch between local and international tabs
- use backend FX endpoints
- hide provider/source name from the end-user UI

## Documentation Page

File:

- [src/app/documentation/page.tsx](E:\dashxw\tenant-dashboard\src\app\documentation\page.tsx)

Responsibilities:

- render backend API-key offramp docs in-app
- preserve important backend examples and responses
- offer markdown download for external agents and automation tooling

## API Key And Merchant ID Flow

Component:

- [ApiKeyCard.tsx](E:\dashxw\tenant-dashboard\src\components\ApiKeyCard.tsx)

Behavior:

- fetches current API key metadata
- creates/regenerates/revokes API keys
- reveals raw key only on create/regenerate response
- shows merchant ID from cookie-derived `/api/user`
- stores latest raw key in session storage for business onboarding reuse

## Top Bar Search

Component:

- [TopBar.tsx](E:\dashxw\tenant-dashboard\src\components\TopBar.tsx)

Behavior:

- global app search is separate from page-local search
- pulls live matches from tenant customers and tenant payments
- shows cross-app result suggestions

## Webhooks Page

File:

- [src/app/webhooks/page.tsx](E:\dashxw\tenant-dashboard\src\app\webhooks\page.tsx)

Current state:

- page exists
- nav item is hidden/commented out for now

When re-enabled, it provides:

- API key section
- webhook CRUD management via backend merchant webhook endpoints
