# TaxCraft API

The reference service is stateless. It does not create accounts, set cookies or persist calculation requests and results.

## Routes

- `GET /v1/jurisdictions`
- `GET /v1/jurisdictions/{code}`
- `GET /v1/jurisdictions/{code}/{taxYear}/coverage`
- `POST /v1/calculate`
- `GET /openapi.json`

## Singapore calculation request

```json
{
  "jurisdiction": "SG",
  "taxYear": "YA2026",
  "facts": {
    "taxResident": true,
    "chargeableIncomeMinor": 10000000
  }
}
```

`chargeableIncomeMinor` uses Singapore cents and must represent a whole-dollar amount. The resident status and chargeable income must already have been determined by the caller.

Every successful calculation includes the calculation lines, assumptions, coverage limits and official sources used by those lines.
