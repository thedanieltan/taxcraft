# TaxCraft API

The reference service is stateless. It does not create accounts, set cookies or persist worksheet or calculation requests and results.

## Routes

- `GET /v1/jurisdictions`
- `GET /v1/jurisdictions/{code}`
- `GET /v1/jurisdictions/{code}/{taxYear}/coverage`
- `POST /v1/worksheets/SG/chargeable-income`
- `POST /v1/calculate`
- `GET /openapi.json`

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

All money values use Singapore cents and must represent whole-dollar amounts. The resident status and chargeable income must already have been determined by the caller or by the TaxCraft worksheet using user-confirmed totals.

Every successful calculation includes the calculation lines, assumptions, coverage limits and official sources used by those lines.
