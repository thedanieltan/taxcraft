# Progressive-reliefs packages: wave 17

## Kazakhstan

Jurisdiction code: `KZ`

Package: `@taxcraft/country-progressive-reliefs`

Maintained calendar year: `2026`

Currency: Kazakhstani tenge (`KZT`)

## Supported calculation

The package calculates the general individual income-tax schedule on caller-confirmed annual taxable income:

- 10% through 8,500 monthly calculation indices;
- 15% on the portion exceeding 8,500 monthly calculation indices.

For 2026, the monthly calculation index effective on 1 January is KZT 4,325. The statutory threshold is therefore KZT 36,762,500.

## Input boundary

The caller supplies taxable income after legally applicable social payments and tax deductions. TaxCraft does not derive taxable income from gross employment or other receipts.

The caller also confirms that the income belongs to the general Article 363 schedule.

## Excluded scope

The package does not calculate or infer:

- social-payment, basic, social or other deductions;
- private-practice income taxed at 9%;
- dividend income under its separate schedule;
- individual-entrepreneur or farm income under separate schedules or reductions;
- employment withholding or payroll-period calculations;
- declarations, return reconciliation or filing obligations;
- foreign-tax or treaty relief;
- prior payments, penalties, interest or refunds.

## Sources

Primary and supporting official sources:

- Kazakhstan Tax Code, Article 363;
- Ministry of Finance, `Questions and answers on tax administration`;
- State Revenue Committee, `Individual income tax for individuals: rates and deductions`.

The statutory threshold is calculated directly from the official 8,500-MRP multiplier and the official 2026 MRP value. Approximate figures in explanatory announcements do not override that arithmetic.

## Acceptance fixtures

Tests cover:

- zero taxable income;
- the exact KZT 36,762,500 threshold;
- income above the threshold under the 15% marginal rate;
- the KZT 4,325 MRP value exposed in calculation totals;
- catalogue and API discovery;
- source attribution;
- exclusion of special category schedules;
- unsupported-year rejection;
- identity-bearing fact rejection.

## Maintenance boundary

The package uses manual source maintenance. Each future calendar year requires verification of both Article 363 and the monthly calculation index effective on 1 January. Special income categories remain independent calculation scopes.
