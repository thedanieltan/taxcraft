# TaxCraft API

The reference service is stateless. It does not create accounts, set cookies or persist worksheet or calculation requests and results.

## Global PIT catalogue routes

- `GET /v1/pit/status`
- `GET /v1/pit/calculation-families`
- `GET /v1/pit/jurisdictions`
- `GET /v1/pit/jurisdictions/{code}`
- `GET /v1/pit/jurisdictions/{code}/{taxYear}/coverage`
- `GET /v1/pit/jurisdictions/{code}/{taxYear}/input-schema`
- `POST /v1/pit/calculate`

The catalogue list contains every registered ISO 3166-1 country or territory and distinguishes:

- `implemented` — an accepted TaxCraft calculator exists;
- `source-indexed` — the system has provisional implementation-family evidence;
- `source-discovery` — the jurisdiction remains registered but unmapped.

A registered jurisdiction without a calculator returns `409 not_implemented` from model-specific coverage or input-schema routes. Catalogue metadata itself remains available with HTTP 200.

## Compatibility routes

- `GET /v1/jurisdictions`
- `GET /v1/jurisdictions/{code}`
- `GET /v1/jurisdictions/{code}/{taxYear}/coverage`
- `POST /v1/calculate`

These routes retain the original implemented-package behaviour. `POST /v1/pit/calculate` and `POST /v1/calculate` execute the same deterministic engine.

## Other routes

- `POST /v1/worksheets/SG/chargeable-income`
- `GET /openapi.json`

## Browser access

API responses include a credential-free public CORS policy:

```text
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: content-type
```

TaxCraft does not support cookies or credentialed browser requests. External clients remain responsible for explaining what they transmit and must not add identity fields to TaxCraft payloads.

## Manifest-driven input schema

An implemented model exposes its executable facts schema:

```text
GET /v1/pit/jurisdictions/SG/YA2026/input-schema
```

The response identifies the model version, tax-year status, PIT package contract and closed `factsSchema`. Clients can use this metadata to generate forms without embedding jurisdiction-specific fields.

## Singapore chargeable-income worksheet

The worksheet performs arithmetic on totals whose classification and eligibility the caller has already confirmed.

```json
{
  "facts": {
    "employmentIncomeMinor": 10000000,
    "otherTaxableIncomeMinor": 1000000,
    "allowableDeductionsMinor": 500000,
    "personalReliefsMinor": 2000000,
    "eligibilityConfirmed": true
  }
}
```

The successful response includes `chargeableIncomeMinor`, calculation lines, assumptions, coverage and the official IRAS sources used by the worksheet. It does not determine whether income is taxable or whether a deduction or relief is legally available.

## Singapore calculation request

```json
{
  "jurisdiction": "SG",
  "taxYear": "YA2026",
  "facts": {
    "taxResident": true,
    "chargeableIncomeMinor": 8500000
  }
}
```

Singapore money values use cents and must represent whole-dollar amounts. Resident status and chargeable income must already have been determined by the caller or by the TaxCraft worksheet using user-confirmed totals.

## United Kingdom calculation request

```json
{
  "jurisdiction": "GB",
  "taxYear": "2026-27",
  "facts": {
    "territory": "England",
    "nonSavingsIncomeMinor": 3500000,
    "adjustedNetIncomeMinor": 3500000
  }
}
```

UK money values use pence and must represent whole-pound amounts. `territory` is limited to `England`, `Wales` or `Northern Ireland`. The caller must determine adjusted net income and territorial status. Scotland, savings, dividends, National Insurance and special allowances are not supported.

Every successful calculation includes calculation lines, assumptions, coverage limits and the official sources used by those lines.

## Examples

- `examples/node-client` demonstrates server-side consumption and structured error handling.
- `examples/browser-client` demonstrates the credential-free CORS contract.
