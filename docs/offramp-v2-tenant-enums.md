# Offramp v2 Tenant Enum Reference

Use this when testing the tenant-facing Offramp v2 customer APIs.

## Common

`profileType`

- `individual`
- `business`

Send `profileType` only when creating a customer. Every customer child route
derives it from the `customer_<ulid>` path identifier.

`corridor`

- `global`

Use ISO-3166 alpha-2 country codes, for example `IN`, `US`, `GB`, `DE`.

Blocked countries/regions:

- `AF`, `BY`, `CF`, `CD`, `CG`, `CU`, `GN`, `IR`, `IQ`, `LY`, `ML`, `MM`, `KP`, `RU`, `SO`, `SS`, `SD`, `SY`, `VE`, `YE`, `PS`
- US states: `NY`, `AK`
- Ukraine regions: `Crimea`, `Donetsk`, `Luhansk`

## KYC/KYB Profile Enums

`employment.employmentStatus`

- `employee`
- `self_employed`
- `retired`
- `unemployed`
- `homemaker`
- `student`
- `other`

`risk.primarySourceOfFunds` / `operations.primarySourceOfFunds`

- `employment`
- `savings`
- `winnings`
- `marital`
- `real_estate`
- `trust`
- `investment`
- `company`
- `company_capital`
- `loan`
- `private_capital`
- `grant`
- `other`

`risk.accountPurpose` / `operations.accountPurpose`

- `personal_use`
- `business_operations`
- `investment`
- `crypto_investment`
- `savings`
- `remittances`
- `payroll`
- `treasury_management`
- `other`

`risk.accountPurpose` is required for individual KYC. When either
`risk.primarySourceOfFunds` or `risk.accountPurpose` is `other`, provide the
matching `primarySourceOfFundsDescription` or `accountPurposeExplanation`.
`operations.primarySourceOfFundsDescription` is required for every business.

`risk.actingAsIntermediary` is optional and defaults to `false` for an
individual. `operations.actingAsIntermediary` is required for business KYB.

`jurisdictions.highRiskActivities` / `operations.highRiskActivities`

- `adult_entertainment`
- `drugs`
- `firearms`
- `gambling`
- `marijuana`
- `crypto_mixing`

`jurisdictions.vendorsAndCounterparties` / `counterparties.counterparties`

- `self_transactions`
- `merchants_suppliers`
- `customers`
- `employees`
- `contractors`
- `friends`
- `family`

`business.entityType`

- `sole_proprietorship`
- `llc`
- `s_corporation`
- `c_corporation`
- `b_corporation`
- `non_profit`
- `partnership`
- `limited_partnership`
- `limited_liability_partnership`
- `trust`
- `dao`
- `cooperative`
- `other`

`business.description` must contain at least 350 characters.

`business.regulatedStatus` / `operations.regulatedStatus`

- `regulated`
- `registered`
- `licensed`
- `unregulated`
- `not_required`

When `operations.regulatedStatus` is `regulated`, `registered`, or `licensed`,
provide all of `regulatedActivityDescription`, `regulatedAuthorityCountry`,
`regulatedAuthorityName`, and `regulatedLicenseNumber`. Providing any one of
these four fields requires the other three; otherwise all four must be null.

`associatedPersons[].roles`

- `beneficial_owner`
- `control_person`
- `officer`
- `director`
- `authorized_signer`

At submit time, a business profile must collectively include at least one
`beneficial_owner`, one `control_person`, and one `authorized_signer`.
`associatedPersons.authorizedSigner` in `missingFields` means no associated
person has the `authorized_signer` role; it is not a separate request field.
Beneficial-owner percentages may total less than 100 but must not exceed 100.
Every associated person must provide government-ID fields and the required
person document uploads reported by verification status.

`associatedPersons[].personRef` is a required, client-assigned UUID v4. It
must be unique within the business profile and remains stable for that person.
Provider person IDs are never accepted or returned.

When `business.entityType` is `dao` or `other`,
`business.corporateEntityTypeDescription` is required.

`governmentId.type`, `govIdKind`

- `passport`
- `drivers_license`
- `national_id`
- `residence_permit`
- `voters_card`
- `other`

## Document Upload

`POST /offramp/v2/customers/{customerId}/kyc/documents/` accepts customer or
business-level multipart fields `email`, `file`, `kind`, and optional
`description`.

Business person documents use:

`POST /offramp/v2/customers/{customerId}/kyc/persons/{personRef}/documents/`

Do not send `profileType`, `owner`, `personIndex`, `personId`, or provider IDs.

Individual `kind`:

- `individual_government_id_front`
- `individual_government_id_back`
- `individual_selfie`
- `proof_of_address`

Business associated-person `kind`:

- `identity_card_front`
- `identity_card_back`
- `selfie`
- `proof_of_address`

Business `kind`:

- `business_formation`
- `tax_document`
- `ownership_information`
- `shareholder_register`
- `proof_of_nature_of_business`
- `bank_statement`
- `proof_of_address`
- `proof_of_source_of_funds`
- `articles_of_incorporation`
- `memorandum_of_association`
- `flow_of_funds`
- `compliance_screening`
- `licensed_vendors_attestation`
- `proof_of_licensure`
- `other`

`other` requires a non-blank `description` of at most 256 characters. It is
the only kind that can have multiple live rows for the same owner; every
upload creates a separate row. Other kinds replace the live row in their
`(personRef, kind)` slot while retaining the previous version
for audit.

Uploads return `201` with `status=uploaded` after local persistence. Document
responses include `version`; replacing a live `(personRef, kind)` slot
increments it. Files must be PDF, JPEG, or PNG and between 10 KB and 10 MB.
The `other` kind also requires a non-blank `description` of at most 256
characters; invalid uploads are rejected before storage.

Individual standard requirements are a front government ID image, back image
for two-sided IDs, selfie, and proof of address. Each business associated
person has the same requirements. Before submission, upload every business
document returned as required by the customer's verification status, including
the funding-evidence fields it reports.

## Accounts API Enums

`kind`

- `fiat`
- `crypto`

`origin`

- `external`
- `virtual`

`instrumentDetails.accountHolderType`

- `individual`
- `business`

`instrumentDetails.accountType`

- `checking`
- `saving`

Crypto `asset`

- `USDC`
- `USDT`

External crypto `blockchain`:

- `POLYGON`
- `BASE`
- `ETHEREUM`
- `ARBITRUM`
- `OPTIMISM`

Virtual crypto `blockchain`:

- `POLYGON`
- `BASE`
- `ETHEREUM`
- `ARBITRUM`
- `OPTIMISM`
- `SOLANA`

External crypto accounts support EVM rails. Virtual crypto accounts also
support `SOLANA`. `TRON` is not accepted by the current provider route.

Account creation and deletion return `202`. Account list, detail, balance, and
deposit reads return cached database state and queue a debounced background
refresh. Public account IDs are local IDs; never send or persist an upstream
account ID.

Virtual fiat currencies:

- `USD`
- `EUR`
- `GBP`
- `AED`

`AED` is accepted by the DashX virtual-fiat account contract. Provisioning is
asynchronous and provider availability is organization-dependent; use an
account only after its public status is `active`.

For USD auto-liquidation, `details.liquidationAccountId` is a local crypto
account ID and `details.liquidationDeveloperFeeBps` is an optional integer
from `0` to `10000`.

## Quotes

Quote creation returns `202` and a local snapshot ID. Poll
`GET /offramp/v2/quotes/{snapshotId}/` until `status=ready`.
Quote creation requires `customerId`; quote detail and acceptance derive it
from the stored snapshot.

Quote legs:

- `source.currency`
- `destination.currency`
- `source.account` / `source.accountId`
- `destination.account` / `destination.accountId`
- `source.rails`
- `destination.rails`

Common rail values:

- `base`
- `polygon`
- `ethereum`
- `arbitrum`
- `optimism`

Quote acceptance uses `POST /offramp/v2/quotes/{snapshotId}/accept/`.

- `selectedQuoteId`: optional local option ID such as `option_1`; omit to
  accept the best quote.
- `reference`: optional caller correlation key.
- `comment`: optional audit note.
- `files`: optional array of at most four PDF, JPEG, or PNG base64 data URIs, each at most 5 MB.
- `returnAddress`: optional stablecoin refund address.
- `expiredQuoteBehavior`: optional; currently `flexible_destination_amount`.
- `paymentReason`: required.

Acceptance returns `202` with a local order ID. Poll order detail or list;
order reads use stored state and queue a debounced background refresh.
Order creation without a quote and order listing require `customerId`.
Quote-backed order creation, order detail, and cancellation derive it.

`paymentReason`:

- `charitable_contributions`
- `education_fees`
- `employee_salaries_or_wages`
- `gifts`
- `investments`
- `purchase_of_goods`
- `purchase_of_services`
- `personal_transfers`
- `rent`
- `loans`
- `utility_bills`
- `family_support`
- `friends_support`
- `real_estate`
- `insurance`
- `intercompany_transfer`
- `taxes`
- `travel`
