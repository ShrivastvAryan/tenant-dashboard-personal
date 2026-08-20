# Offramp API (API Key Flow)

This document describes the **API key** flow for converting crypto to fiat. It is intended for tenants (merchants) integrating offramp for their end-users. Authentication is via API key only.

---

## Authentication

All requests must include your API key in the header:

```http
X-API-KEY: <your-api-key>
X-MERCHANT-ID: <your-merchant-id>
```

The API key identifies your tenant account. Fee rates and access are scoped to the tenant that owns the key.

**Important:**
- Each request that involves an end-user must include that user’s `email` in the body or query (as specified per endpoint).
- We only support append-slashes for all endpoints.

---

## 1. Local offramp (india only)

Local offramp converts crypto to fiat in a single supported region (only india for now). Processing fees are deducted from the sell amount; the effective rate is determined by your api key user's fee configuration.

### 1.1 Get a quote (by crypto amount)

**`POST /offramp/quote/crypto/`**

Returns a quote for selling a given crypto amount, including processing fee and estimated fiat output.

**Request body (JSON):**

| Field              | Type   | Required | Description                          | Allowed values / notes                                                                 |
|--------------------|--------|----------|--------------------------------------|-----------------------------------------------------------------------------------------|
| `sellTokenSymbol`  | string | Yes      | Token symbol                         | Supported: `USDC`, `USDT`                                                              |
| `sellTokenAddress` | string | Yes      | Token contract address               | Contract address matching the selected token/chain                                      |
| `chainId`          | number | Yes      | Chain ID                             | `137` (Polygon), `8453` (Base), `42161` (Arbitrum). Unsupported chains are rejected. |
| `fiatCurrency`     | string | Yes      | Fiat currency code                   | Must be `inr`                                                                          |
| `sellTokenAmount`  | number | Yes      | Amount of crypto to sell             | Positive number > 1 (token units, e.g. `100`)                                          |
| `senderAddress`    | string | Yes      | Sender wallet address                | EVM address (0x-prefixed)                                                              |
| `email`            | string | Yes      | End-user email                       | Must be an email owned by your tenant (required for API key auth)                      |
| `isNRI`            | bool   | No       | NRI quote flag                       | Optional, defaults to `false`. Required for NRI users.   |

**Response (success):**
`200 OK` with `success: true` and `data` containing quote fields (e.g. `sellTokens`, `originalSellAmount`, `fiatAmount`, `conversionRate`, `processingFeePercentage`, `processingFeeTokens`, `totalRequired`, optional `walletBalance` / `balanceSufficient` when `email` is provided).

**Example Response:**
```json
{
  "success": true,
  "data": {
    "sellTokens": "0.995",
    "originalSellAmount": "1",
    "conversionRate": "97.112874",
    "transactionFee": "0",
    "gasFee": "0",
    "fiatCurrency": "inr",
    "fiatAmount": "95.66",
    "processingFeePercentage": "0.5%",
    "processingFeeTokens": "0.005",
    "processingFeeUsd": "0.0049990639835",
    "totalRequired": "1",
    "payoutWalletAddress": "0x067a45b38245c19ce7eb3e5c74e71204330b20e2"
  }
}
```

---

### 1.2 KYC upload

If the region requires KYC, complete it before linking the bank account. (Required for INR)

**`POST /offramp/kyc/upload/`**
Content-Type: `multipart/form-data`

**Request Form Field:**
| Field          | Type    | Required | Description                                   | Allowed values / notes                                      |
|----------------|---------|----------|-----------------------------------------------|-------------------------------------------------------------|
| `email`        | string  | Yes      | End-user email                                | Email of the end-user                               |
| `selfie`       | file    | Yes      | Selfie photograph file                        | JPG/PNG recommended, max size is 1MB for every file
| `aadharFront`  | file    | Yes      | Front image of Aadhar card                    | JPG/PNG                                                     |
| `aadharBack`   | file    | Yes      | Back image of Aadhar card                     | JPG/PNG                                                     |
| `panFront`     | file    | Yes      | Front image of PAN card                       | JPG/PNG                                                     |
| `panBack`      | file    | Yes      | Back image of PAN card                        | JPG/PNG                                                     |
| `panNumber`    | string  | Yes      | PAN number                                    | 10-character alphanumeric (standard PAN format)            |
| `aadharNumber` | string  | Yes      | Aadhar number                                 | 12-digit numeric                                            |
| `firstName`    | string  | Yes      | First name of end-user                        | As per KYC documents (must match bank account name)                                        |
| `lastName`     | string  | Yes      | Last name of end-user                         | As per KYC documents                                        |
| `incomeRange`  | string  | Yes      | Income range                                  | Valid income ranges: ['<10L', '10L-15L', '15L-20L', '20L-25L', '25L-50L', '>50L'] (use as is)               |
| `profession`   | string  | Yes      | Profession                                    | Free text; may be validated      |
| `phone`        | string  | Yes      | Phone number (digits only)                    | 10 digits for India                                         |
| `countryCode`  | string  | Yes      | Country code (without `+`, e.g. `91` for IN)  | `91` for India                                              |
| `dob`          | string  | Yes      | Date of birth                                | YYYY-MM-DD format                                           |
| `socialUrl`    | string  | No       | Public website or social profile URL          | Optional.    |


**Response (success):**
`200 OK` with `success: true`.

**Example Response:**
```json
{
    "success": true,
    "data": {
        "message": "KYC already verified"
    }
}
```

---

### 1.2A NRI KYC upload

Use this endpoint for NRI individual KYC instead of the regular India KYC upload.

**`POST /offramp/kyc/nri/upload/`**
Content-Type: `multipart/form-data`

**Request Form Field:**
| Field               | Type   | Required | Description                                      | Allowed values / notes |
|---------------------|--------|----------|--------------------------------------------------|------------------------|
| `email`             | string | Yes      | End-user email                                   | Must be owned by your tenant |
| `name`              | string | Yes      | Full legal name                                  | As per KYC document |
| `dob`               | string | Yes      | Date of birth                                    | YYYY-MM-DD |
| `address[pin]`      | string | Yes      | Postal/PIN code                                  | Required |
| `address[state]`    | string | Yes      | State                                            | Required |
| `address[city]`     | string | Yes      | City                                             | Required |
| `address[locality]` | string | Yes      | Locality/address line                            | Required |
| `address[district]` | string | No       | District                                         | Optional |
| `address[landmark]` | string | No       | Landmark                                         | Optional |
| `income_range`      | string | No       | Income range                                     | Valid income ranges: ['<10L', '10L-15L', '15L-20L', '20L-25L', '25L-50L', '>50L'] (use as is)               |
| `profession`        | string | No       | Profession                                       | Optional |
| `drivingLicense`    | file   | Cond.    | NRI photo ID document                            | Upload this file or provide `drivingLicenseNumber`. Max 1MB per file. |
| `workVisa`          | file   | Cond.    | NRI photo ID document                            | Upload this file or provide `workVisaNumber`. Max 1MB per file. |
| `emiratesId`        | file   | Cond.    | NRI photo ID document                            | Upload this file or provide `emiratesIdNumber`. Max 1MB per file. |
| `drivingLicenseNumber` | string | Cond. | Driving License document number                  | Accepted instead of a Driving License file. |
| `workVisaNumber`   | string | Cond.    | Work Visa document number                        | Accepted instead of a Work Visa file. |
| `emiratesIdNumber` | string | Cond.    | Emirates ID document number                      | Accepted instead of an Emirates ID file. |
| `selfie`            | file   | No       | Selfie image                                     | Optional. Max 1MB. |

Do not send utility bill or bank statement for NRI KYC; accepted photo IDs are Driving License, Work Visa, and Emirates ID.


**Response (success):**
`200 OK` with `success: true` and a provider submission message. If KYC is already complete, the response may contain `"message": "KYC already verified"`.

---

### 1.3 Get Banks and Payment Codes

To get payment codes and bank names.

**`GET /offramp/international/banks/`**

Returns the full list of payment codes and corresponding bank names that can be used when linking a bank account in the offramp flow.

**Request:**
No parameters required.

**Example Request:**
```
GET /offramp/international/banks/
```

**Response:**
- `success`: Indicates the success of the request.
- `data`: List of supported banks and payment codes.

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "paymentCode": "state_bank_of_india",
      "bankName": "STATE BANK OF INDIA",
      "currency": "INR",
      "country": "INDIA"
    },
    {
      "paymentCode": "hdfc_bank",
      "bankName": "HDFC BANK",
      "currency": "INR",
      "country": "INDIA"
    }
    // ...additional supported banks and codes
  ]
}
```

**Notes:**
- Use the `paymentCode` returned here as the `paymentCode` field value when linking a bank account.
- Not all banks listed may be available for every region or currency.

---

### 1.4 Link bank account

For **API key individual users**, the documented onboarding order is:

1. Complete **individual KYC first**
2. Call **link-bank**
3. The backend will **auto-create the matching international individual recipient** from the same payload in most cases
4. After that, the user can use local and international individual offramp flows

End-users must link a bank account before creating a local offramp order.

**`POST /offramp/account/link-bank/`**

**Request body (JSON):**

| Field           | Type   | Required | Description                          | Allowed values / notes                                                                                     |
|-----------------|--------|----------|--------------------------------------|------------------------------------------------------------------------------------------------------------|
| `email`         | string | Yes      | End-user email                       | Must be an email owned by your tenant                                                                      |
| `name`          | string | Yes      | Account holder name                  | Full legal name as per bank records                                                                        |
| `panNumber`     | string | No       | PAN                                  | Optional. Not required for NRI users.                                                                      |
| `bankDetails`   | object | Yes      | Bank account details                 | Must include: <br>- `accountNumber`: string <br>- `accountName`: string <br>- `ifsc`: string <br>- `branchAddress`: string |
| `address`       | string | Conditional | End-user address                   | Required for regular users. Omit for NRI users when using `bankDetails.branchAddress`. |
| `recipientType` | string | Yes      | Recipient type                       | `"Individual"` for individual users.                                                                       |
| `postCode`      | string | Conditional | Postal code                        | Required for regular users.                                        |
| `city`          | string | Conditional | City                               | Required for regular users.                                        |
| `paymentCode`   | string | Yes      | Payment code                         | E.g., `state_bank_of_india` for SBI (INR accounts)                                                        |
| `accountType`   | string | Yes      | Account type                         | E.g., `"Savings"` or `"Checking"`, etc.                                                                    |
| `bankName`      | string | Yes      | Full bank name                       | E.g., `"STATE BANK OF INDIA"`                                                                              |
| `reference`     | string | No       | Reference label                      | Optional.                             |

**API key individual note:**
- Treat this endpoint as the main setup step **after KYC**.
- Do not ask tenants to separately create an international individual recipient first.
- The API-key-only fields (`recipientType`, `paymentCode`, `accountType`, `bankName`) are reused to auto-provision the international individual recipient.
- For NRI users, include the real Indian bank branch address in `bankDetails.branchAddress` and omit top-level `address`, `city`, and `postCode`.
- For regular users, collect and send real top-level `address`, `city`, and `postCode`.
- Auto-provisioning is best-effort. If it fails, the recipient can still be created later with the international recipient create endpoint.

**Example payload (NRI user):**
```json
{
  "email": "hi@example.xyz",
  "name": "John Snow",
  "bankDetails": {
    "accountNumber": "12345678901",
    "accountName": "John Snow",
    "ifsc": "SBIN0001234",
    "branchAddress": "Connaught Place, Delhi"
  },
  "recipientType": "Individual",
  "bankName": "STATE BANK OF INDIA",
  "paymentCode": "state_bank_of_india",
  "accountType": "Savings",
  "reference": "John Snow"
}
```

**Example payload (regular user):**
```json
{
  "email": "hi@example.xyz",
  "name": "John Snow",
  "bankDetails": {
    "accountNumber": "12345678901",
    "accountName": "John Snow",
    "ifsc": "SBIN0001234",
    "branchAddress": "Connaught Place, Delhi"
  },
  "address": "123 Main Street, Connaught Place",
  "city": "Delhi",
  "postCode": "110001",
  "recipientType": "Individual",
  "bankName": "STATE BANK OF INDIA",
  "paymentCode": "state_bank_of_india",
  "accountType": "Savings",
  "reference": "John Snow"
}
```


**Response (success):**
`200/201` with `success: true` and `data` containing e.g. `bankStatus`, `referenceNumber`, `bankId`.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "bankStatus": "SUCCESS",
    "referenceNumber": "4a756e4b-3313-4097-a9e7-d491ff1ebb65",
    "bankId": 18
  },
  "message": "Bank account linked successfully"
}
```

---

### 1.5 Check KYC status

**`GET /offramp/kyc/status/?email=<user@example.com>`**

**Required query params:**

| Param   | Type   | Required | Description              | Allowed values / notes                        |
|---------|--------|----------|--------------------------|-----------------------------------------------|
| `email` | string | Yes      | End-user email to check | Must be an email owned by the api key user         |

**Response (success):**
`200 OK` with KYC status and related flags (e.g. verified, pending).

**Example Response:**
```json
{
  "success": true,
  "data": {
    "isKycVerified": true,
    "kycStatus": "COMPLETE"
  }
}
```

---

### 1.6 Get linked banks
**`GET /offramp/account/fetch-banks/?email=<user@example.com>`**

Retrieve the list of all bank accounts previously linked by the specified end-user.

**Required query params:**

| Param   | Type   | Required | Description                | Allowed values / notes                     |
|---------|--------|----------|----------------------------|--------------------------------------------|
| `email` | string | Yes      | End-user email to check    | Must be owned by the api key user               |

**Success Response:**
`200 OK` with a list of bank accounts:

```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": 19,
        "account_number": "XXXXXXX7320",
        "account_name": "John Snow",
        "ifsc": "SBIN00xxxxx",
        "branch_address": "xxx DELHI",
        "pan_number": "ABCDEFGHI",
        "phone_number": "+91_xxxxx",
        "link_status": "SUCCESS",
        "reference_id": "4a756e4b-3313-4097-a9e7-d491ff1ebb65",
        "transaction_id": "26A4FC9529C74F6E8846F3B32E3E9D79",
        "tenant_id": "68b557a2d8b54eebb1ff10d8",
        "verification_name": "Mr JOHN SNOW",
        "is_active": true,
        "created_at": "2026-02-06T18:42:28.521543Z",
        "updated_at": "2026-02-10T19:52:10.387128Z"
      }
    ]
  }
}
```

**Notes:**
- The `account_number` is always masked for security.

---

### 1.7 Review and process local order

Before creating a local offramp order, fetch the end-user deposit address and latest balance with the review endpoints below. The end-user must deposit the required `sellTokenAmount` to their chain/token wallet address, and the latest balance should be sufficient before order creation.

### 1.7A Get deposit address for order review

**`GET /offramp/deposit-address/?email=<user@example.com>&chainId=137&sellTokenSymbol=USDC`**

Returns the wallet user's address for the selected chain/token without creating an order or provider order ID.

**Required query params:**

| Param             | Type   | Required | Description                 | Allowed values / notes |
|-------------------|--------|----------|-----------------------------|------------------------|
| `email`           | string | Yes      | End-user email              | Must be owned by your tenant |
| `chainId`         | number | Yes      | Chain ID                    | `137` Polygon, `8453` Base |
| `sellTokenSymbol` | string | Yes      | Token symbol                | `USDC`; `USDT` where supported |

**Response (success):**
```json
{
  "success": true,
  "data": {
    "depositAddress": "0x067a45b38245c19ce7eb3e5c74e71204330b20e2",
    "chainId": 137,
    "chainCode": "MATIC",
    "sellTokenSymbol": "USDC",
    "sellTokenAddress": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"
  }
}
```

### 1.7B Fetch latest wallet balance

**`GET /offramp/balance/?email=<user@example.com>&chainId=137&sellTokenSymbol=USDC&sellTokenAmount=100`**

Fetches the end-user wallet balance and returns whether it is enough for the requested order amount. This endpoint does not create an order or provider order ID.

**Required query params:**

| Param             | Type   | Required | Description                       | Allowed values / notes |
|-------------------|--------|----------|-----------------------------------|------------------------|
| `email`           | string | Yes      | End-user email                    | Must be owned by your tenant |
| `chainId`         | number | Yes      | Chain ID                          | `137` Polygon, `8453` Base |
| `sellTokenSymbol` | string | Yes      | Token symbol                      | `USDC`; `USDT` where supported |
| `sellTokenAmount` | number | No       | Amount you intend to sell/offramp | When provided, `balanceSufficient` is calculated |

**Response (success):**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x067a45b38245c19ce7eb3e5c74e71204330b20e2",
    "chainId": 137,
    "chainCode": "MATIC",
    "sellTokenSymbol": "USDC",
    "sellTokenAddress": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    "walletBalance": "250",
    "totalRequired": "100",
    "balanceSufficient": true
  }
}
```

### 1.7C Create local offramp order

**`POST /offramp/`**

Creates a local offramp order for the given end-user. The user must have completed KYC and bank linking (as required by the region).

**Request body (JSON):**

| Field                 | Type   | Required | Description                          | Allowed values / notes                                                         |
|-----------------------|--------|----------|--------------------------------------|-------------------------------------------------------------------------------|
| `email`               | string | Yes      | End-user email                       | Must be owned by your tenant                                                 |
| `sellTokenSymbol`     | string | Yes      | Token symbol                         | Supported: `USDC`, `USDT`                                                    |
| `sellTokenAddress`    | string | Yes      | Token contract address               | Contract address matching the selected token/chain                            |
| `chainId`             | number | Yes      | Chain ID                             | `137` (Polygon mainnet), `8453` (Base mainnet), `42161`(Arbitrum mainnet), `900` (Solana mainnet)                                                    |
| `fiatCurrency`        | string | Yes      | Fiat currency                        | Must be `inr`                                                                |
| `bankDetails`         | object | Yes      | Linked bank details for confirmation                | `{ "ifsc": "<ifsc_code>", "accountNumber": "<account_numer>" }`                     |
| `refundWalletAddress` | string | Yes      | Refund address if order fails        | EVM address for refunds                                                      |
| `sellTokenAmount`     | number | Cond.    | Crypto amount (quote-by-crypto)      | Positive number > 0 (USDC). Mutually exclusive with `fiatAmount`             |
| `isNRI`               | bool   | No       | NRI flag                             | Optional, defaults to `false`. Required for NRI users.   |

**Example Request Body:**
```json
{
  "sellTokenSymbol": "USDC",
  "sellTokenAddress": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  "chainId": 137,
  "fiatCurrency": "inr",
  "sellTokenAmount": 1,
  "bankDetails": {
    "accountNumber": "xxxxx",
    "ifsc": "SBIN00xxxx"
  },
  "refundWalletAddress": "0x067a45b38245c19ce7eb3e5c74e71204330b20e2",
  "email": "hi@example.xyz"
}
```

**Response (success):**
`201 Created` with `success: true` and `data` containing order details. For direct local rails, `receiver_wallet_address` is the deposit/offramp address and `fiat_amount` is the expected payout amount.

**Example Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "LOCAL_ORDER_ID",
    "receiver_wallet_address": "0xDepositAddress",
    "fiat_amount": 9580.12,
    "fiat_currency": "inr",
    "sell_token_amount": 99.5,
    "sell_token_symbol": "USDC",
    "chain_id": 137,
    "payment_mode": "BANK"
  }
}
```

---

### 1.8 Get order status

**`GET /offramp/<order_id>/?email=<user@example.com>`**

Required query params:

| Param     | Type   | Required | Description                                    | Allowed values / notes                        |
|-----------|--------|----------|------------------------------------------------|-----------------------------------------------|
| `email`   | string | Yes      | End-user email for this order                 | Must be owned by your tenant                  |

**Response (success):**
`200 OK` with `data` containing e.g. `orderId`, `status`, `fiat`, `currency`, `txnHash`, `created_at`, `bankDetails`, `customer`.

---

### 1.9 List orders

**`GET /offramp/orders/?email=<user@example.com>&page=1&page_size=20`**

Required query params:

| Param        | Type   | Required | Description                              | Allowed values / notes                     |
|--------------|--------|----------|------------------------------------------|--------------------------------------------|
| `email`      | string | Yes      | End-user email                           | Must be owned by your tenant               |
| `page`       | number | No       | Page number                              | `>= 1`, defaults to `1`                    |
| `page_size`  | number | No       | Page size                                | Reasonable values like `10`, `20`, `50`    |

Returns paginated orders for that end-user (scoped to your tenant).

**Response Sample:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 67,
        "order_id": "699f1a47803a116a10f76xxx",
        "transaction_id": "0xsomething",
        "amount": 1,
        "currency": "INR",
        "status": "fiat-pending",
        "points_earned": 0,
        "bank_details": {
          "id": 22,
          "account_number": "XXXXXXX7321",
          "account_name": "John Snow",
          "ifsc": "SBIN0011001",
          "branch_address": "DELHI",
          "pan_number": "DDDS11132C",
          "phone_number": "+91_xxxxxxxxx",
          "link_status": "SUCCESS",
          "reference_id": "4a756e4b-3313-4097-a9e7-d491ff1exxxx",
          "transaction_id": "26A4FC9529C74F6E8846F3B32E3Exxxx",
          "tenant_id": "68b557a2d8b54eebb1ff10d8",
          "verification_name": "Mr JOHN  SNOW",
          "is_active": true,
          "created_at": "2026-02-25T15:41:40.207574Z",
          "updated_at": "2026-02-25T15:41:40.207590Z"
        },
        "created_at": "2026-02-25T15:50:31.341978Z",
        "chain_id": 137
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 20,
      "total_orders": 1,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false,
      "next_page": null,
      "previous_page": null
    }
  }
}
```

**Response (success):**
`200 OK` with `data.orders`(list) and `data.pagination`(object).

---

## 2. International offramp (multi-currency)

International offramp supports multiple fiat currencies and countries. Standard
business KYB and Priority Rail use the same profile schema, with separate
endpoints so standard orders do not enter Priority onboarding.

- **Standard rail:** submit business KYB to `/kyb/upload/`, wait until its local
  status is `COMPLETE`, then create a recipient, quote, and order. It does not
  require Priority Rail unlock or terms acceptance.
- **Priority Rail:** submit the same schema to `/priority-rail/profile/`, then
  unlock Priority Rail, complete terms acceptance, create a recipient and
  sender partner, quote, and create the order with `priority=priority`.

Offramp orders require a complete international profile. A processing fee is
applied (configurable per tenant); the rest is sent to the offramp processor.

Supported outputs depend on configuration (e.g. INR, AED, MYR and corresponding countries).

---

### 2.1 Get quote (by crypto amount)

**`POST /offramp/international/quote/crypto/`**

**Request body (JSON):**

| Field             | Type   | Required | Description                           | Allowed values / notes                                                                 |
|-------------------|--------|----------|---------------------------------------|-----------------------------------------------------------------------------------------|
| `sellTokenSymbol` | string | Yes      | Token symbol                          | Supported: `USDC`, `USDT`                                                              |
| `sellTokenAddress` | string | No       | Token contract address                | Optional for this endpoint. |
| `chainId`         | string | Yes      | Chain identifier                      | `POL`/`MATIC`, `BASE`, `ARB`. |
| `fiatCurrency`    | string | Yes      | Fiat currency used for quoting        | `INR` |
| `sellTokenAmount` | number | Yes      | Total crypto amount user will send    | Positive number > ~11.50 USDC. Less than 15000 USDC-equivalent per request. |
| `email`           | string | Yes      | End-user email                        | Must be owned by the api key owner                               |
| `priority`        | string | No       | Rail selector                         | Use `priority` for Priority Rail; omit or use `standard` for standard rail. |

**Response (success):**
`200 OK` with quote and fee breakdown (`offrampAmount`, `processingFeePercentage`, `processingFeeTokens`, `totalRequired`, etc.).

**Response Example:**
```json
{
  "success": true,
  "data": {
    "status": true,
    "currency": "INR",
    "token": "usdc-polygon",
    "rate_amount": 90.32126399999999,
    "amount": 10.9,
    "amount_in_currency": 984.5017775999999,
    "total_received_amount": 10.475500000000002,
    "total_received_amount_in_currency": 946.160401032,
    "total_fee_amount": 0.4244999999999983,
    "total_fee_amount_in_currency": 38.34137656799987,
    "expiry_time": 15,
    "payout_wallet": "0x1a847816c016a052d2b80af5fd8a6589fc75d9b5",
    "offrampAmount": "10.9",
    "processingFeePercentage": "0.1%",
    "processingFeeTokens": "0.1000",
    "totalRequired": "11"
  }
}
```

---

### 2.2 Standard international KYB (business only)

**`POST /offramp/international/kyb/upload/`**
`multipart/form-data`

Use this endpoint for standard-rail business KYB. It validates and stores the
same profile fields, `persons` JSON array, and document fields below locally;
it does not create or activate a Priority account. Standard-rail individuals
continue to use the required KYC flow. Priority Rail uses the same schema at
`POST /offramp/international/priority-rail/profile/`.

For standard KYB, use `sole_proprietor`, `company`,
`limited_liability_partnership`, or `partnership`. The individual row below is
for the Priority profile endpoint.

| Field | Required | Notes |
|---|---:|---|
| `email` | Yes | End-user email in the tenant scope. |
| `businessType` | Yes | `individual`, `sole_proprietor`, `company`, `limited_liability_partnership`, or `partnership`. `llp` is accepted as an alias. |
| `purposeCodes` | Yes | One code, comma-separated codes, or a JSON array string. |
| `businessName` | Conditional | Required for businesses; 3 to 16 characters. |
| `productDescription` | Yes | Actual business activity, 1 to 500 characters. |
| `annualRevenueUsd`, `monthlyVolumeUsd` | Yes | Positive estimated USD amounts. |
| `addressLine1`, `city`, `state`, `postCode` | Conditional | Account address. The first person address can supply these when omitted. |
| `websiteUrl`, `socialUrl` | Conditional | `individual` and `sole_proprietor` need one, unless both `existingFirc` and `sampleInvoice` are supplied. |
| `gstin` | Conditional | Required for `sole_proprietor` and `partnership`. |
| `companyIdentifier` | Conditional | Required CIN or LLP identifier for `company` and `limited_liability_partnership`. |
| `businessPan` | No | Business PAN when available. |
| `businessIndustry` | Conditional | Required for non-individual profiles. |
| `persons` | Yes | JSON array using the person schema below. |

Each `persons` entry requires `clientId`, `fullName`, `email`,
`dateOfBirth` (`YYYY-MM-DD`), `addressLine1`, `city`, `state`, `postCode`, and
`relationship`. `relationship.owner` is required for at least one person;
for `individual` and `sole_proprietor` it must be exactly `{"owner": true}`.
`director` and `representative` are available for company, LLP, and
partnership profiles. `panNumber` is required for individuals and recommended
for every other person.

| Document field | Applies to | Requirement |
|---|---|---|
| `person{index}PanDocument` | Every person | Required for `individual`; include for every owner/director where available. |
| `person{index}AddressDocument` | Every person | Upload only when requested by profile status. |
| `existingFirc`, `sampleInvoice` | Individual / sole proprietor | Both are the alternative to `websiteUrl` or `socialUrl`. |
| `gstinDocument` | Sole proprietor | Required. |
| `cinDocument` | Company / LLP | Required. |
| `businessPanDocument` | Company / LLP | Optional supporting document. |
| `ownershipStructureDocument` | Company / LLP / partnership | Required for company and LLP; optional supporting document for partnership. |
| `partnershipDeedDocument` | Partnership | Required. |
| `udyamCertificateDocument`, `shopEstablishmentDocument`, `taxRegistrationDocument`, `utilityBillDocument` | Sole proprietor | Optional supporting documents. |

| Business type | Persons | Required business documents |
|---|---|---|
| `individual` | Exactly one owner-only person. | `person0PanDocument`; online presence or both `existingFirc` and `sampleInvoice`. |
| `sole_proprietor` | Exactly one owner-only person. | `gstinDocument`, `person0PanDocument`; online presence or both `existingFirc` and `sampleInvoice`. |
| `company` | 1 to 8 persons; at least one owner. | `cinDocument`, `ownershipStructureDocument`. |
| `limited_liability_partnership` | 1 to 8 persons with owner, director, and representative coverage. | `cinDocument`, `ownershipStructureDocument`. |
| `partnership` | 1 to 8 persons; at least one owner. | `partnershipDeedDocument`. |

#### Priority individual KYC example

```text
email=<end-user-email>
businessType=individual
businessName=Jane Doe
productDescription=Software consulting services for overseas clients
websiteUrl=https://example.com
purposeCodes=P0802
annualRevenueUsd=50000
monthlyVolumeUsd=5000
addressLine1=12 Residency Road
city=Bengaluru
state=Karnataka
postCode=560001
persons=[{"clientId":"owner-1","fullName":"Jane Doe","email":"jane@example.com","dateOfBirth":"1990-01-01","panNumber":"ABCDE1234F","addressLine1":"12 Residency Road","city":"Bengaluru","state":"Karnataka","postCode":"560001","relationship":{"owner":true}}]
person0PanDocument=@owner-pan.pdf
```

#### Company KYB example

```text
email=<end-user-email>
businessType=company
businessName=Acme Exports
productDescription=Cross-border software services
websiteUrl=https://acme.example
purposeCodes=P0802
annualRevenueUsd=250000
monthlyVolumeUsd=25000
businessIndustry=541511
companyIdentifier=U12345KA2024PTC000000
addressLine1=7 MG Road
city=Bengaluru
state=Karnataka
postCode=560038
persons=[{"clientId":"owner-1","fullName":"Jane Doe","email":"jane@example.com","dateOfBirth":"1990-01-01","panNumber":"ABCDE1234F","addressLine1":"12 Residency Road","city":"Bengaluru","state":"Karnataka","postCode":"560001","relationship":{"owner":true,"director":true,"representative":true}},{"clientId":"director-2","fullName":"John Doe","email":"john@example.com","dateOfBirth":"1992-02-02","panNumber":"ABCDE1234G","addressLine1":"13 Residency Road","city":"Bengaluru","state":"Karnataka","postCode":"560001","relationship":{"director":true}}]
cinDocument=@certificate-of-incorporation.pdf
ownershipStructureDocument=@ownership-structure.pdf
person0PanDocument=@owner-pan.pdf
person1PanDocument=@director-pan.pdf
```

The profile response is authoritative when documents are already on file or
additional documents are requested. Submit only the missing or changed data.

**`GET /offramp/international/kyb/status/?email=<end-user-email>`**

For standard business orders, read `data.profile_complete` and
`data.missing_requirements`. `data.kyb_status` is `COMPLETE` only when the
KYB profile and required documents are complete; no Priority activation
is involved. For Priority Rail, use
`GET /offramp/international/priority-rail/profile/?email=<end-user-email>`.

```json
{
  "success": true,
  "data": {
    "kyb_status": "COMPLETE",
    "kyb_submitted_at": "2026-07-26T10:34:00+00:00",
    "profile_complete": true,
    "missing_requirements": []
  }
}
```

---

### 2.3 Recipients (list / get / create)

Recipients are bank/payout details for a given end-user in a given country. All recipient operations are scoped to the tenant and to the `email` you supply.

- **Standard list:** `GET /offramp/international/recipients/?email=<user@example.com>`
- **Priority list:** `GET /offramp/international/recipients/?email=<user@example.com>&priority=priority`
- **Get one:** `GET /offramp/international/recipients/<id>/?email=<user@example.com>`
  (`id` is the stable ID returned when listing or creating.)
- **Create:** `POST /offramp/international/recipients/create/`

For create, use the same `email` in the body for API key flow. List/get/delete use `email` in query params.
**Note:** For **API key individual users**, if you already completed the required KYC and used the India offramp to `link-bank`, the international individual recipient is usually already created. Use this create endpoint mainly as a fallback if auto-provisioning failed, or for business recipients / non-auto-provisioned cases.

**Create recipient request body (JSON):**

| Field           | Type   | Required | Description                          | Allowed values / notes                                                                                               |
|-----------------|--------|----------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `email`         | string | Yes      | End-user email                       | Must be owned by your tenant                                                                                        |
| `name`          | string | Yes      | Recipient name                       | Full legal name                                                                                                      |
| `recipientType` | string | Yes      | Recipient type                       | `Individual` or `Business`                                                                                           |
| `address`       | string | Yes      | Street address                       | Non-empty                                                                                                            |
| `city`          | string | Yes      | City                                  | Non-empty                                                                                                            |
| `postCode`      | string | Yes      | Postal code                          | Country-specific format                                                                                              |
| `reference`     | string | No       | Free-form reference                  | Optional, can be empty/null                                                                                          |
| `bank`          | object | Yes      | Bank details                         | Must include fields below, validated per country (see `/offramp/international/countries/`)                          |
| `priority`      | string | No       | Rail selector                        | Use `priority` to create a Priority Rail recipient. |

The `bank` object must include at least:

- Base fields (all countries):
  - `accountName` (string, required)
  - `accountNumber` (string, required)
  - `currency` (string, required; `INR`)
  - `country` (string, required; `INDIA`)

- India (`country = INDIA`, `currency = INR`):
  - Required: `accountName`, `accountNumber`, `ifsc`, `bankName`, `paymentCode`
  - Optional: `accountType` (`Checking` or `Savings`)


#### List

**Response:**
```json
{
  "success": true,
  "data": {
    "recipients": [
      {
        "id": 43,
        "receiver_id": "698e16554de5df8a412xxx",
        "name": "John Snow",
        "email": "xyz@dashx.xyz",
        "recipient_type": "Individual",
        "address": "Delhi",
        "city": "Delhi",
        "post_code": "110001",
        "reference": null,
        "bank_account_name": "JOHN SNOW",
        "bank_name": "STATE BANK OF INDIA",
        "bank_account_number": "xxxxxxxx",
        "bank_currency": "INR",
        "bank_country": "INDIA",
        "bank_payment_code": "state_bank_of_india",
        "bank_ach_number": null,
        "bank_fedwire_number": null,
        "bank_iban_number": null,
        "bank_ifsc": "SBIN00xxxx",
        "bank_account_type": "Savings",
        "bank_id": "698e16554de5df8a412xxxx",
        "is_active": true,
        "is_default": false,
        "created_at": "2026-02-12T18:05:09.793294Z",
        "updated_at": "2026-02-12T18:05:09.793310Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 10,
      "page": 1,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

#### Get

```json
{
  "success": true,
  "data": {
    "id": 43,
    "receiver_id": "698e16554de5df8a412xxxx",
    "name": "John Snow",
    "email": "xyz@dashx.xyz",
    "recipient_type": "Individual",
    "address": "Delhi",
    "city": "Delhi",
    "post_code": "110001",
    "reference": null,
    "bank_account_name": "JOHN SNOW",
    "bank_name": "STATE BANK OF INDIA",
    "bank_account_number": "xxxxxxx",
    "bank_currency": "INR",
    "bank_country": "INDIA",
    "bank_payment_code": "state_bank_of_india",
    "bank_ach_number": null,
    "bank_fedwire_number": null,
    "bank_iban_number": null,
    "bank_ifsc": "SBIN00xxxxx",
    "bank_account_type": "Savings",
    "bank_id": "698e16554de5df8a4126axxx",
    "is_active": true,
    "is_default": false,
    "created_at": "2026-02-12T18:05:09.793294Z",
    "updated_at": "2026-02-12T18:05:09.793310Z"
  }
}
```

### 2.4 Remittance metadata (purpose & fund source)

Some destination corridors require (or strongly recommend) providing a **remittance purpose** and **source of funds**. If your integration supplies these, use the APIs below to fetch the **supported values** for a given output currency, then pass the chosen values into the create-order request.

#### 2.4.1 List purposes

**`GET /offramp/international/purposes/<outputCurrency>/`**

For Priority Rail, include `?priority=priority&email=<end-user-email>`.

Path params:

| Param            | Type   | Required | Description        | Allowed values / notes              |
|------------------|--------|----------|--------------------|-------------------------------------|
| `outputCurrency` | string | Yes      | Output fiat currency | Example: `INR` (use uppercase ISO) |

**Response (success):**
`200 OK` with `data.purposes` (array of strings).

#### 2.4.2 List fund sources

**`GET /offramp/international/fund-sources/<outputCurrency>/`**

Path params:

| Param            | Type   | Required | Description        | Allowed values / notes              |
|------------------|--------|----------|--------------------|-------------------------------------|
| `outputCurrency` | string | Yes      | Output fiat currency | Example: `INR` (use uppercase ISO) |

**Response (success):**
`200 OK` with `data.fundSources` (array of strings).

---

### 2.5 Create international offramp order

**`POST /offramp/international/offramps/create/`**
Content-Type: `multipart/form-data` if you send files (e.g. income source document / invoice).

**Note:** Complete the shared international profile (section 2.2) before
creating an order. Priority Rail also requires unlock, accepted terms, a
Priority Rail recipient, and a sender partner.

**Request body / form fields:**

| Field                 | Type        | Required | Description                          | Allowed values / notes                                                                                  |
|-----------------------|-------------|----------|--------------------------------------|---------------------------------------------------------------------------------------------------------|
| `email`               | string      | Yes      | End-user email                       | Must be owned by your tenant                                                                           |
| `priority`            | string      | No       | Rail selector                        | Use `priority` for Priority Rail. Omit it for standard rail. |
| `sellTokenAmount`     | number      | Yes      | Total crypto amount (fee deducted)   | Must be `> 12` and `<= 15000` USDC-equivalent (autofirc requires amount to be greater than 15.00 USDC)                              |
| `sellTokenSymbol`     | string      | Cond.   | Token symbol                         | Required for crypto funding. Standard supports `USDC`, `USDT`; Priority Rail supports `USDC`. |
| `chainId`             | string      | Cond.   | Chain identifier                     | Required for crypto funding. Priority Rail also supports `SOL`. |
| `outputCurrency`      | string      | Yes      | Fiat currency                        | `INR` |
| `receiverId`          | string      | Yes      | Recipient ID from recipients API     | Must be a valid `receiver_id` for this `email`                                                         |
| `senderName`          | string      | Cond.   | Sender name                           | Required for crypto funding; optional for `fiat_balance` with `senderPartnerId`. |
| `senderEmail`         | string      | Cond.   | Sender email                         | Required for crypto funding; optional for `fiat_balance` with `senderPartnerId`. |
| `senderPartnerId`     | string      | Cond.   | Priority sender partner              | Required for Priority Rail. |
| `walletAddress`       | string      | No       | Sender wallet (optional)             | Blockchain address on the selected chain                                                               |
| `fundingMethod`       | string      | No       | Funding source                       | Priority only: omit/use `crypto`, or use `fiat_balance`. |
| `virtualAccountId`    | string      | No       | Fiat virtual account                 | Priority `fiat_balance` only. Use `id` from `virtualAccounts`. Send it whenever the quoted sell currency must be preserved; otherwise DashX selects an available funded account. |
| `reason`              | string      | No       | Reason for transfer                  | Free text                                                                                               |
| `description`         | string      | No       | Description                           | Free text                                                                                               |
| `fundSource`          | string      | No       | Source of funds                      | Use one of the values from `GET /offramp/international/fund-sources/<outputCurrency>/` (if enforced)   |
| `purpose`             | string      | No       | Purpose of transaction               | Use one of the values from `GET /offramp/international/purposes/<outputCurrency>/` (if enforced)       |
| `income_source_file`  | file        | Yes for Priority | Invoice/supporting document | Required for every Priority order, including fiat-balance orders. PDF/JPG/PNG, max 1MB. |
| `applyFircUpfront`    | boolean     | No       | Queue upfront FIRC request           | When `true`, backend queues FIRC processing after order placement (bridge-safe). Default: `false`      |
| `estimatedOutputAmount` | number    | No       | Pre-calculated fiat amount           | Optional optimization; when provided, avoids an extra quote call                                       |

**Upfront FIRC behavior:**
If `applyFircUpfront=true`, send normal `sellTokenAmount` (do not client-side mutate for FIRC deduction) and also ensure `sellTokenAmount` and deposited amount is greater than `15.00` USDC. FIRC are processed asynchronously:

- non-bridge orders: queued immediately after order creation
- bridge orders: queued after bridge completes

**Response (success):**
- direct/non-bridge: `201 Created` with `success: true`, `data` (offramp id, status, amounts, `feeInfo` with `processingFeePercentage`, `providerAmount`), and `localTransactionId`.
- bridge flow: `202 Accepted` with `success: true`, processing message, bridge context, and `localTransactionId`.

---

### 2.6 Get offramp detail

**`GET /offramp/international/offramps/<offramp_id>/?email=<user@example.com>`**

Required query params:

| Param   | Type   | Required | Description              | Allowed values / notes                        |
|---------|--------|----------|--------------------------|-----------------------------------------------|
| `email` | string | Yes      | End-user email           | Must be an email owned by your tenant         |

Returns the international offramp transaction detail for that ID and user (tenant-scoped).

For priority rail, `<offramp_id>` can be either the priority receivable id returned as `data.offrampId` or the numeric local transaction id.

---

### 2.7 List offramps

**`GET /offramp/international/offramps/?email=<user@example.com>`**

Required query params:

| Param   | Type   | Required | Description              | Allowed values / notes                        |
|---------|--------|----------|--------------------------|-----------------------------------------------|
| `email` | string | Yes      | End-user email           | Must be an email owned by your tenant         |
| `priority` | string | No | Rail selector | Omit for standard orders. Use `priority` to list only Priority Rail orders. |

Returns the list of international offramp transactions for that end-user (tenant-scoped).


**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 29,
        "offramp_id": "63ab8321-31d3-46bb-bcb2-xxx",
        "transaction_hash": "0x6ad0f0976c67e2dde6471241299fcf19a7a02b4bd434eb7b8d41f820792443d4",
        "input_amount": "10.900000000000000355",
        "input_amount_exact": "10.900000000000000355",
        "input_currency": "usdc-polygon",
        "crypto_id": "usdc-polygon",
        "output_amount": "983.52361596",
        "output_amount_exact": "945.22033385",
        "output_currency": "INR",
        "fee_rate_amount": "90.23152440",
        "fee_total_amount": "0.42450000",
        "fee_total_in_currency": "38.30328211",
        "status": "completed",
        "reason": "Accounting services",
        "description": "..",
        "blockchain": "polygon",
        "blockchain_type": "EVM",
        "route_id": null,
        "use_smart_contract": false,
        "payout_wallet": "0x0385b0d366f68a43f8edd4cecc48625451d727a4",
        "memo": null,
        "sender_provider_id": "6941008ff1fd998ba72d0xxx",
        "sender_name": "John Snow",
        "sender_email": "xyz@dashx.xyz",
        "sender_wallet_address": "0xe98160BAe29b036da07171bFf5e3848406C52d9b",
        "recipient": null,
        "receiver_provider_id": "698e10662d975f870f4218d9",
        "organization_id": "6941008ff1fd998ba72d0b91",
        "organization_name": "Dashx",
        "expired_date": "2026-02-12T18:49:47.474000Z",
        "activity_history": [
          {
            "_id": "698e1d482d975f870f425db8",
            "status": "completed",
            "activity": "Signed by Payee",
            "updatedAt": "2026-02-12T18:35:27.856Z",
            "description": "Waiting for signature from sender"
          },
          {
            "_id": "698e1d482d975f870f425db9",
            "status": "completed",
            "activity": "Converted to",
            "updatedAt": "2026-02-12T18:35:27.856Z",
            "description": "Waiting for crypto asset to be received by system, to be converted to fiat afterward"
          },
          {
            "_id": "698e1d482d975f870f425dba",
            "status": "processing",
            "activity": "Sent to recipient account",
            "updatedAt": "2026-02-12T18:35:27.856Z",
            "description": "Transaction is under process and will be transferred out to recipient after conversion is done"
          },
          {
            "_id": "698e1d482d975f870f425dbb",
            "status": "pending",
            "activity": "Received by recipient account",
            "updatedAt": "2026-02-12T18:35:27.856Z",
            "description": "Transaction is executed successfully and closed"
          }
        ],
        "admin_notes_activities": [],
        "points_earned": 0,
        "partner_redirect_url": null,
        "us_network": null,
        "disbursement_service": null,
        "firc_requested": true,
        "firc_requested_at": "2026-02-12T18:58:28.320481Z",
        "firc_fee_transaction": 4110,
        "created_at": "2026-02-12T18:34:48.041070Z",
        "updated_at": "2026-02-16T12:00:00.430350Z",
        "provider_created_at": "2026-02-12T18:34:48.017000Z",
        "provider_updated_at": "2026-02-12T18:35:27.856000Z"
      }
    ],
    "pagination": {
      "total": 3,
      "limit": 10,
      "page": 1,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

---

### 2.8 Request FIRC document

**`POST /offramp/international/offramps/<offramp_id>/request-firc/`**

**Note:** This endpoint is the **manual** follow-up path and currently charges a fixed **$4** fee.

**Request body (JSON):**

| Field            | Type   | Required | Description                          | Allowed values / notes                        |
|------------------|--------|----------|--------------------------------------|-----------------------------------------------|
| `email`          | string | Yes      | End-user email for this offramp      | Must be an email owned by your tenant         |
| `priority`       | string | No       | Rail selector                         | Use `priority` for a Priority Rail FIRC request. |
| `chainId`        | string | Yes       | Chain for fee deduction               | `POL`, `MATIC`, `ARB`, `BASE` |
| `feeTokenSymbol` | string | No       | Preferred fee token                   | `USDC` or `USDT` (default inferred from offramp token) |

`chainId` is currently required in practice for deterministic fee deduction flow.

**Response (success):**
`200 OK` with confirmation payload including:

- `fircFee` (currently `"$4.0"`)
- `fircFeeToken` (`USDC` or `USDT`)
- `feeTransactionId`
- `circleTransactionId`

---

### 2.9 Priority Rail

Priority Rail is an optional international rail selected with
`priority=priority`. It is scoped to the end-user `email` supplied with the
request. Do not use these endpoints for standard international orders.

#### Setup

| Step | Endpoint | Purpose |
|---:|---|---|
| 1 | `POST /offramp/international/priority-rail/profile/` | Save the end-user international profile and KYC/KYB documents. Uses `multipart/form-data`. |
| 2 | `POST /offramp/international/priority-rail/unlock/` | Enable Priority Rail after the profile is complete. |
| 3 | `POST /offramp/international/priority-rail/tos/start/` | Start terms acceptance and redirect the user to `data.redirectUrl`. |
| 4 | `POST /offramp/international/priority-rail/tos/accept/` | Complete terms acceptance with `signedAgreementId`. |
| 5 | `POST /offramp/international/recipients/create/` | Create the priority payout recipient. |
| 6 | `POST /offramp/international/priority-rail/partner/` | Create sender details and retain `data.partner.accountId` for orders. |

Use `GET /offramp/international/priority-rail/status/?email=<end-user-email>`
to read profile readiness, terms status, recipients, and receive instruments.

#### Crypto-funded quote and order

**`POST /offramp/international/quote/crypto/`**

```json
{
  "email": "<end-user-email>",
  "priority": "priority",
  "sellTokenSymbol": "USDC",
  "chainId": "POL",
  "fiatCurrency": "INR",
  "sellTokenAmount": "100"
}
```

Crypto-funded Priority Rail orders use `USDC` and one of `POL`/`MATIC`, `ARB`,
`BASE`, or `SOL`. The status response is the final source of availability.

**`POST /offramp/international/offramps/create/`**
`multipart/form-data`

```text
email=<end-user-email>
priority=priority
sellTokenAmount=100
sellTokenSymbol=USDC
chainId=POL
outputCurrency=INR
receiverId=<priority-recipient-receiver-id>
senderPartnerId=<saved-sender-partner-id>
senderName=<sender-name>
senderEmail=<sender-email>
purpose=<approved-priority-purpose-code>
invoiceNumber=<invoice-reference>
income_source_file=@invoice.pdf
```

`senderPartnerId` is required. `walletAddress` is optional; when supplied it
must be a synced wallet on the selected chain. The sender name and email are
required for crypto-funded orders.

#### Fiat-balance quote and order

Use fiat-balance funding only after the end-user has an active virtual account
with enough available balance.

**`POST /offramp/international/quote/fiat/`**

```json
{
  "email": "<end-user-email>",
  "priority": "priority",
  "sellCurrency": "EUR",
  "fiatCurrency": "INR",
  "sellAmount": "100"
}
```

For the create request, omit `sellTokenSymbol`, `chainId`, and `walletAddress`
unless `applyFircUpfront=true`; in that case all three identify the wallet used
for the FIRC fee:

```text
email=<end-user-email>
priority=priority
fundingMethod=fiat_balance
sellTokenAmount=100
outputCurrency=INR
receiverId=<priority-recipient-receiver-id>
senderPartnerId=<saved-sender-partner-id>
purpose=<approved-priority-purpose-code>
invoiceNumber=<invoice-reference>
income_source_file=@invoice.pdf
virtualAccountId=<virtual-account-id-from-virtualAccounts>
```

Use the `id` returned by `virtualAccounts` as `virtualAccountId`. It should
match `sellCurrency` from the fiat quote. Omit it only when DashX may select
any sufficiently funded currency. `sellAmount` and `sellTokenAmount` are the
total debit amount; the quote returns the amount available for conversion after
the processing fee. Sender name and email are optional for this funding mode
when `senderPartnerId` is already saved.

#### Multi-currency activation and virtual accounts

Activate Priority Rail first, then read the multi-currency status before every
submission. It returns `missingRequirements`,
`canReuseExistingAddressDocument`, and the current activation state.

**`GET /offramp/international/priority-rail/multi-currency/?email=<end-user-email>`**

Use the returned requirements to decide whether the tenant needs to collect
anything. When the existing profile and documents satisfy the requirements,
activate multi-currency without re-uploading them:

**`POST /offramp/international/priority-rail/multi-currency/`**
`multipart/form-data`

```text
email=<end-user-email>
monthlyVolumeUsd=10000
```

When person details or documents are missing, submit the required persons and
files. Keep every existing `clientId` stable so the person is updated rather
than duplicated:

```text
email=<end-user-email>
monthlyVolumeUsd=10000
persons=[{"clientId":"owner-1","fullName":"Jane Doe","email":"jane@example.com","dateOfBirth":"1990-01-01","panNumber":"ABCDE1234F","addressLine1":"12 Residency Road","city":"Bengaluru","state":"Karnataka","postCode":"560001","relationship":{"owner":true}}]
person0PanDocument=@owner-pan.pdf
person0AddressDocument=@owner-address.pdf
```

For `company`, `limited_liability_partnership`, and `partnership`, send each
required owner's physical address in `persons`. Add
`person{index}PanDocument` for owners when requested; add
`ownershipStructureDocument=@ownership.pdf` only when the status response
lists it as missing and its applicable. For `individual` and `sole_proprietor`, use
`person{index}AddressDocument` when the status response lists an address
document as missing. Do not upload any document merely because it is present
in an older profile.

**`POST /offramp/international/priority-rail/multi-currency/virtual-account/`**

```json
{
  "email": "<end-user-email>",
  "currency": "EUR"
}
```

This returns `202` while provisioning is queued. Poll the multi-currency
status or the virtual-account list until the currency reports `activated`.
USD can be provisioned as soon as Priority Rail is active. Other currencies
require multi-currency capability activation.

Supported additional currencies are `GBP`, `EUR`, `CAD`, `CNY`, `CZK`, `HUF`,
`MXN`, `RON`, `THB`, `PLN`, `TRY`, `CHF`, `DKK`, `NOK`, `SEK`, `ZAR`, `AED`,
`AUD`, `HKD`, `ILS`, `KES`, `NZD`, `QAR`, `SAR`, and `SGD`.

Each `virtualAccounts` entry represents one payment rail. A USD request may
return `local`, `fedwire`, and `swift` entries. EUR returns `local` (SEPA and
SEPA Instant) and `swift`; GBP returns `local` (FPS) and `swift`; CAD returns
`local` (EFT) and `swift`. Other additional currencies return `swift` only.

#### Virtual accounts, history, and metrics

| Endpoint | Method | Purpose |
|---|---:|---|
| `/offramp/international/priority-rail/virtual-accounts/` | `GET` | List active virtual accounts and `lastBalanceSnapshot`; accepts optional `currency`. |
| `/offramp/international/priority-rail/history/` | `GET` | List cached fiat deposits. Use `includePayouts=true` only when payout rows are required. |
| `/offramp/international/priority-rail/metrics/` | `GET` | Return cached deposit totals by currency and current/last-month comparison. |


---

## 3. Errors and status codes

- **400 Bad Request** – Missing or invalid parameters (e.g. missing `email`, invalid payload).
- **403 Forbidden** – The given `email` is not owned by your tenant (e.g. `REG_PERM_DENIED`), or you are not allowed to perform the action.
- **404 Not Found** – Resource not found (e.g. order, recipient, user) or not visible to your tenant.
- **500 Internal Server Error** – Server or processing error; error message may be sanitized.

Responses typically include a JSON body with `success: false` and an `error` (or `errors`) field.

---

## 4. Fee behavior (API key)

- **Local offramp:** Processing fee is deducted from the sell amount. The fee rate is determined by **your tenant (API key owner)**. The `email` in the request identifies the end-user for balance/ownership only; it does not change which fee rate is used.
- **International offramp:** Same: the processing fee is based on your tenant’s configuration. Fee is applied to the input amount; the remainder is the amount sent for conversion to fiat.

All monetary values in responses use the units and currencies documented per endpoint (e.g. crypto in token units, fiat in the requested currency).
