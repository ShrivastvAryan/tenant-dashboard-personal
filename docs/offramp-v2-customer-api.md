# DashX Offramp v2 Customer API

Base path: `/offramp/v2/`

All examples use a tenant API key:

```http
X-API-KEY: <tenant-api-key>
```

Use JSON except for document uploads, which are `multipart/form-data`.

## Lifecycle

```text
customer -> profile -> documents -> verification -> accounts -> quote -> order
```

Create the customer once per legal entity. All customer-scoped endpoints derive
the profile type and ownership from the customer ID. Quotes and orders remain
global endpoints because they connect two existing accounts, but quote creation
and order listing still require `customerId`.

## Public IDs And Context

Public identifiers are prefixed ULIDs. They are opaque and case-sensitive.

| Resource | Format |
| --- | --- |
| Customer | `customer_<ULID>` |
| Document | `doc_<ULID>` |
| Account | `acct_<ULID>` |
| Quote | `quote_<ULID>` |
| Order | `txn_<ULID>` |
| Deposit | `deposit_<ULID>` |

For tenant API-key requests, send the end user's `email` on every request that
does not already have it in a stored resource. It must resolve to the same
tenant-owned customer as the path or resource ID.

## 1. Customers

Create a customer:

```http
POST /offramp/v2/customers/
```

```json
{
  "email": "customer@example.com",
  "profileType": "individual",
  "country": "AE",
  "corridor": "global"
}
```

`profileType` is accepted only here and is either `individual` or `business`.
`corridor` is currently `global`. Save `data.id` as `customerId`.

## Profile Schema And Requirements

Retrieve the complete public profile contract before rendering a form:

```http
GET /offramp/v2/customer-schema/?profileType=individual
GET /offramp/v2/customer-schema/?profileType=business
```

The response contains `jsonSchema` with every accepted field, nested object,
type, enum, and format; `requiredFields` for unconditional submission fields;
and `conditionalFields` for data-dependent fields. After each profile `PUT`,
`verification.profile.missingFields` is authoritative for that customer,
including document and country-specific requirements.

Read one customer:

```http
GET /offramp/v2/customers/{customerId}/?email=customer@example.com
```

List a tenant end user's customers:

```http
GET /offramp/v2/customers/?email=customer@example.com
```

## 2. KYC/KYB Profile

Save a draft or update it:

```http
PUT /offramp/v2/customers/{customerId}/kyc/profile/
```

The body contains `email` and one `profile` object. It must not contain
`profileType` or `canonicalFields`.

Individual example:

```json
{
  "email": "customer@example.com",
  "profile": {
    "identity": {
      "firstName": "Aisha",
      "lastName": "Rahman",
      "dateOfBirth": "1990-01-01",
      "nationality": "AE",
      "citizenship": "AE",
      "countryOfResidence": "AE",
      "taxIdentificationNumber": "784-1990-1234567-1"
    },
    "addresses": {
      "residential": {
        "line1": "1 Market Street",
        "city": "Dubai",
        "state": "Dubai",
        "postalCode": "00000",
        "country": "AE"
      }
    },
    "contact": {
      "email": "customer@example.com",
      "phone": "+971501234567",
      "phoneCountryCode": "AE"
    },
    "employment": {
      "employmentStatus": "employee",
      "occupation": "software_engineer"
    },
    "risk": {
      "primarySourceOfFunds": "employment",
      "accountPurpose": "personal_use",
      "actingAsIntermediary": false,
      "pepStatus": false
    },
    "volumes": {
      "usdValueOfFiat": 10000,
      "usdValueOfCrypto": 0,
      "monthlyDeposits": 2,
      "monthlyWithdrawals": 2,
      "monthlyCryptoDeposits": 0,
      "monthlyCryptoWithdrawals": 0,
      "monthlyInvestmentDepositUsd": 0,
      "monthlyInvestmentWithdrawalUsd": 0,
      "monthlyCryptoInvestmentDepositUsd": 0,
      "monthlyCryptoInvestmentWithdrawalUsd": 0
    },
    "jurisdictions": {
      "fundsSendReceiveJurisdictions": ["AE"],
      "highRiskActivities": [],
      "vendorsAndCounterparties": ["self_transactions"]
    },
    "attestations": {
      "termsAndConditionsAccepted": true,
      "informationAttested": true
    },
    "documents": {
      "governmentIssuedIdentification": {
        "kind": "national_id",
        "number": "784-1990-1234567-1",
        "country": "AE"
      }
    }
  }
}
```

Business profiles use `business`, `addresses`, `contact`, `operations`,
`volumes`, `counterparties`, `attestations`, and `associatedPersons`.

```json
{
  "email": "owner@acme.example",
  "profile": {
    "business": {
      "legalName": "Acme FZ-LLC",
      "entityType": "llc",
      "industry": "541511",
      "description": "Acme FZ-LLC develops custom software platforms for small and midsize businesses. It designs web and mobile applications, integrates payment and accounting systems, and provides ongoing maintenance, technical support, and managed services. Revenue is earned through fixed-price implementation projects and recurring subscriptions. Customers contract directly with Acme, pay invoices into company-owned accounts, and the business does not custody client funds or operate as a financial intermediary.",
      "registrationNumber": "REG-12345",
      "taxId": "TAX-12345",
      "countryOfRegistration": "AE",
      "formationDate": "2020-01-01",
      "website": "https://acme.example",
      "isDao": false
    },
    "addresses": {
      "registered": {
        "line1": "1 Market Street",
        "city": "Dubai",
        "state": "Dubai",
        "postalCode": "00000",
        "country": "AE"
      },
      "physical": {
        "line1": "1 Market Street",
        "city": "Dubai",
        "state": "Dubai",
        "postalCode": "00000",
        "country": "AE"
      }
    },
    "contact": {
      "email": "owner@acme.example",
      "phone": "+971501234567",
      "phoneCountryCode": "AE"
    },
    "operations": {
      "businessJurisdictions": ["AE"],
      "fundsMovementJurisdictions": ["AE"],
      "primarySourceOfFunds": "company_capital",
      "primarySourceOfFundsDescription": "Revenue from software implementation and support contracts.",
      "regulatedStatus": "unregulated",
      "accountPurpose": "business_operations",
      "actingAsIntermediary": false,
      "conductsMoneyServices": false,
      "operatesInProhibitedCountries": false,
      "highRiskActivities": [],
      "hasComplexOwnership": false
    },
    "volumes": {
      "usdValueOfFiat": 100000,
      "usdValueOfCrypto": 0,
      "monthlyDeposits": 10,
      "monthlyWithdrawals": 10,
      "monthlyCryptoDeposits": 0,
      "monthlyCryptoWithdrawals": 0,
      "monthlyInvestmentDepositUsd": 0,
      "monthlyInvestmentWithdrawalUsd": 0,
      "monthlyCryptoInvestmentDepositUsd": 0,
      "monthlyCryptoInvestmentWithdrawalUsd": 0,
      "expectedMonthlyPaymentsUsd": 50000,
      "estimatedAnnualRevenueUsd": 600000
    },
    "counterparties": {"counterparties": ["customers", "merchants_suppliers"]},
    "attestations": {
      "termsAndConditionsAccepted": true,
      "informationAttested": true
    },
    "associatedPersons": [
      {
        "personRef": "11111111-1111-4111-8111-111111111111",
        "firstName": "Aisha",
        "lastName": "Rahman",
        "email": "owner@acme.example",
        "phone": "+971501234567",
        "phoneCountryCode": "AE",
        "dateOfBirth": "1990-01-01",
        "nationality": "AE",
        "citizenship": "AE",
        "taxId": "784-1990-1234567-1",
        "address": {
          "line1": "1 Market Street",
          "city": "Dubai",
          "state": "Dubai",
          "postalCode": "00000",
          "country": "AE"
        },
        "ownershipPercent": 100,
        "roles": ["beneficial_owner", "control_person", "authorized_signer"],
        "title": "Managing Director",
        "relationshipEstablishedAt": "2020-01-01",
        "govIdKind": "national_id",
        "govIdNumber": "784-1990-1234567-1",
        "govIdCountry": "AE"
      }
    ]
  }
}
```

Each `personRef` is a client-generated UUID v4, unique and stable within that
business profile. At submission, roles must include at least one beneficial
owner, control person, and authorized signer. `dao` and `other` entity types
also require `business.corporateEntityTypeDescription`.

The complete field and enum catalog is in
[offramp-v2-tenant-enums.md](offramp-v2-tenant-enums.md).

## 3. Documents

Upload a customer/business document:

```http
POST /offramp/v2/customers/{customerId}/kyc/documents/
```

Multipart fields:

```text
email=customer@example.com
kind=business_formation
file=@formation.pdf
```

Upload an associated-person document:

```http
POST /offramp/v2/customers/{customerId}/kyc/persons/{personRef}/documents/
```

```text
email=owner@acme.example
kind=identity_card_front
file=@id-front.png
```

The person is selected solely by the path `personRef`.

Allowed files are PDF, JPEG, and PNG, from 10 KB through 10 MB per file. A
successful upload returns `201` and `status: uploaded`. Re-uploading the same
document slot creates a new version and supersedes the previous version.

```http
GET /offramp/v2/customers/{customerId}/kyc/documents/?email=customer@example.com
GET /offramp/v2/customers/{customerId}/kyc/documents/{documentId}/?email=customer@example.com
DELETE /offramp/v2/customers/{customerId}/kyc/documents/{documentId}/?email=customer@example.com
```

Standard individual uploads: `individual_government_id_front`,
`individual_government_id_back`, `individual_selfie`, and `proof_of_address`.
For every business associated person use `identity_card_front`,
`identity_card_back`, `selfie`, and `proof_of_address` on that person's route.
Business-level document kinds are listed in the enum reference. Upload every
document reported as required by verification status before submitting.

## 4. Submit And Check Verification

```http
POST /offramp/v2/customers/{customerId}/kyc/submit/
```

```json
{"email": "customer@example.com"}
```

The stored profile and documents are submitted. The response reports missing
fields before any provider submission. Check status with:

```http
GET /offramp/v2/customers/{customerId}/kyc/status/?email=customer@example.com
```

Handle `incomplete`, `needs_data`, `ready`, `submitted`, `under_review`,
`approved`, and `rejected`. `ready` means the local profile and required
documents are complete and can be submitted. Account provisioning requires an
approved profile.

## 5. Accounts

Accounts belong to a customer:

```http
POST /offramp/v2/customers/{customerId}/accounts/
GET /offramp/v2/customers/{customerId}/accounts/?email=customer@example.com
GET /offramp/v2/customers/{customerId}/accounts/{accountId}/?email=customer@example.com
GET /offramp/v2/customers/{customerId}/accounts/{accountId}/balance/?email=customer@example.com
DELETE /offramp/v2/customers/{customerId}/accounts/{accountId}/?email=customer@example.com
```

Creation returns `202`. List, detail, and balance return cached state and
queue a debounced refresh. Do not use account details while `status` is
`pending`; bank fields are intentionally empty until provisioning completes.

Create a virtual AED bank account:

```json
{
  "email": "customer@example.com",
  "kind": "fiat",
  "origin": "virtual",
  "country": "AE",
  "currency": "AED",
  "displayName": "AED collection account",
  "details": {}
}
```

Virtual fiat currencies accepted by this API are `USD`, `EUR`, `GBP`, and
`AED`. `AED` is configured in DashX and passes local validation, but actual
availability is organization- and provider-dependent. Treat it as available
only after the returned account reaches `active`; do not display account or
routing details while pending.

If a virtual account reaches `failed`, retry the same creation request with a
new `Idempotency-Key`. Reusing the original key returns the same failed
provider attempt and does not create a second attempt.

Create an external crypto wallet:

```json
{
  "email": "customer@example.com",
  "kind": "crypto",
  "origin": "external",
  "country": "AE",
  "currency": "USDC",
  "displayName": "Base payout wallet",
  "details": {
    "walletAddress": "0x1111111111111111111111111111111111111111",
    "blockchain": "BASE",
    "asset": "USDC",
    "accountHolderType": "individual",
    "accountHolderName": "Aisha Rahman"
  }
}
```

The account enum reference defines all account types, supported chains, and
external bank fields.

## 6. Reference Data

Use reference data at runtime rather than hardcoding payout coverage:

```http
GET /offramp/v2/currencies/
GET /offramp/v2/rails/
GET /offramp/v2/rail-schemas/
GET /offramp/v2/rates/?sourceCurrency=USD&destinationCurrency=USDC
```

These endpoints return global reference data.

## 7. Quotes And Orders

Create a quote:

```http
POST /offramp/v2/quotes/
```

```json
{
  "email": "customer@example.com",
  "customerId": "customer_01H...",
  "amount": "1000.00",
  "source": {
    "accountId": "acct_01H...",
    "currency": "AED"
  },
  "destination": {
    "accountId": "acct_01H...",
    "rails": ["base"]
  }
}
```

Quote creation returns `202`. Poll until the snapshot is ready:

```http
GET /offramp/v2/quotes/{quoteId}/?email=customer@example.com
```

Accept the selected or best quote:

```http
POST /offramp/v2/quotes/{quoteId}/accept/
Idempotency-Key: <unique-key>
```

```json
{
  "email": "customer@example.com",
  "paymentReason": "purchase_of_services",
  "reference": "invoice-123",
  "comment": "July services"
}
```

`paymentReason` is required. `selectedQuoteId`, `files`, `returnAddress`, and
`expiredQuoteBehavior` are optional. Compliance `files` are up to four base64
PDF, JPEG, or PNG data URIs, each at most 5 MB. Acceptance returns `202` with
an order ID.

```http
GET /offramp/v2/orders/?email=customer@example.com&customerId=customer_01H...
GET /offramp/v2/orders/{orderId}/?email=customer@example.com
POST /offramp/v2/orders/{orderId}/cancel/
```

Quote-backed order detail and cancellation derive the customer from the stored
order. A direct `POST /offramp/v2/orders/` is supported only for flows that do
not use a quote; send `customerId` with it.

## Errors And Async State

Validation errors use this shape:

```json
{
  "success": false,
  "error": "Invalid KYC profile",
  "errors": [{"field": "profile.identity.firstName", "message": "This field is required."}]
}
```

Treat `202` as queued, not complete. Poll the associated resource until it is
ready, active, approved, completed, failed, rejected, or needs data.
