# Onramp API (API Key Flow)

This document describes the **API key** flow for converting fiat to crypto. It is intended for tenants integrating onramp for their end-users. Authentication is via API key only.

---

## Authentication

All requests must include your API key in the header:

```http
X-API-KEY: <your-api-key>
X-MERCHANT-ID: <your-merchant-id>
```

The API key identifies your tenant account. Fee rates and access are scoped to the tenant that owns the key.

**Important:**  
- Each request that involves an end-user must include that user's `email` in the body or query, as specified per endpoint.
- End-user emails must belong to your tenant.
- We only support append-slashes for all endpoints.

---

## 1. Get a Quote

**`POST /onramp/quote/`**

Returns an onramp quote for a fiat amount, target token, and chain.

**Request body (JSON):**

| Field          | Type   | Required | Description                     | Allowed values / notes                    |
|----------------|--------|----------|---------------------------------|-------------------------------------------|
| `email`        | string | Yes      | End-user email                  | Must be owned by your tenant              |
| `fiatCurrency` | string | Yes      | Fiat currency code              | Example: `INR`                            |
| `fiatAmount`   | number | Yes      | Fiat amount to convert          | Positive number                           |
| `cryptoSymbol` | string | Yes      | Token symbol to receive         | Example: `USDC`, `USDT`                   |
| `chainId`      | number | Yes      | Destination chain ID            | Example: `137`, `8453`, `42161`           |
| `walletAddress` | string | Yes      | End-user destination wallet     | EVM address for supported EVM chains      |

**Example Request:**

```json
{
  "email": "user@example.com",
  "fiatCurrency": "INR",
  "fiatAmount": 10000,
  "cryptoSymbol": "USDC",
  "chainId": 137,
  "walletAddress": "0x1111111111111111111111111111111111111111"
}
```

**Response (success):**  
`200 OK` with `success: true` and quote data such as fiat amount, token amount, fee, exchange rate, expiry, and supported payment instructions when available.

---

## 2. Create an Onramp Order

**`POST /onramp/`**

Creates an onramp order for the tenant end-user.

**Request body (JSON):**

| Field          | Type   | Required | Description                     | Allowed values / notes                    |
|----------------|--------|----------|---------------------------------|-------------------------------------------|
| `email`        | string | Yes      | End-user email                  | Must be owned by your tenant              |
| `fiatCurrency` | string | Yes      | Fiat currency code              | Example: `INR`                            |
| `fiatAmount`   | number | Yes      | Fiat amount to convert          | Positive number                           |
| `cryptoSymbol` | string | Yes      | Token symbol to receive         | Example: `USDC`, `USDT`                   |
| `chainId`      | number | Yes      | Destination chain ID            | Example: `137`, `8453`, `42161`           |
| `walletAddress` | string | Yes      | End-user destination wallet     | EVM address for supported EVM chains      |
| `quoteId`      | string | No       | Quote identifier                | Include when returned by quote endpoint   |

**Example Request:**

```json
{
  "email": "user@example.com",
  "fiatCurrency": "INR",
  "fiatAmount": 10000,
  "cryptoSymbol": "USDC",
  "chainId": 137,
  "walletAddress": "0x1111111111111111111111111111111111111111",
  "quoteId": "quote_123"
}
```

**Response (success):**  
`200/201` with `success: true` and order data including `orderId`, status, fiat amount, crypto amount, fees, payment instructions, and expiry when available.

---

## 3. Submit Payment Reference

**`PUT /onramp/<order_id>/utr/`**

Submit the bank transfer reference for an onramp order after the end-user completes the fiat payment.

**Request body (JSON):**

| Field | Type   | Required | Description                         |
|-------|--------|----------|-------------------------------------|
| `email` | string | Yes    | End-user email owned by your tenant |
| `utr`   | string | Yes    | Bank transfer reference             |

**Example Request:**

```json
{
  "email": "user@example.com",
  "utr": "123456789012"
}
```

**Response (success):**  
`200 OK` with `success: true` and the updated order status.

---

## 4. Get One Order

**`GET /onramp/<order_id>/?email=<user@example.com>`**

Returns one onramp order for an end-user owned by your tenant.

**Required query params:**

| Param   | Type   | Required | Description                         |
|---------|--------|----------|-------------------------------------|
| `email` | string | Yes      | End-user email owned by your tenant |

**Response (success):**  
`200 OK` with order amount, currency, fee, network, payment status, and timestamps.

---

## 5. List Orders

**`GET /onramp/orders/?email=<user@example.com>&page=1&page_size=20`**

Returns paginated onramp orders for an end-user owned by your tenant.

**Query params:**

| Param       | Type   | Required | Description                         |
|-------------|--------|----------|-------------------------------------|
| `email`     | string | Yes      | End-user email owned by your tenant |
| `page`      | number | No       | Page number                         |
| `page_size` | number | No       | Items per page                      |

**Response (success):**  
`200 OK` with pagination metadata and order results.

---

## 6. Account Linking

Use these endpoints when an end-user needs to save payment account details before creating orders.

### 6.1 Link UPI

**`POST /onramp/account/link-upi/`**

**Request body (JSON):**

| Field   | Type   | Required | Description                         |
|---------|--------|----------|-------------------------------------|
| `email` | string | Yes      | End-user email owned by your tenant |
| `upiId` | string | Yes      | UPI ID                              |

### 6.2 Link Bank

**`POST /onramp/account/link-bank/`**

**Request body (JSON):**

| Field           | Type   | Required | Description                         |
|-----------------|--------|----------|-------------------------------------|
| `email`         | string | Yes      | End-user email owned by your tenant |
| `accountNumber` | string | Yes      | Bank account number                 |
| `accountName`   | string | Yes      | Bank account holder name            |
| `ifsc`          | string | Yes      | IFSC code                           |

**Response (success):**  
`200/201` with `success: true` and linked account details.
