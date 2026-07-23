# Multi-layer PIT packages — wave 3

## Scope

Wave 3 adds a bounded Denmark calendar-year 2026 calculation for an adult full-year resident with ordinary employment income below the middle-tax threshold.

The package reports three payable layers:

- the 8% labour-market contribution (AM-bidrag);
- the 12.01% bottom-bracket state tax;
- caller-confirmed municipal income tax.

## Executable boundary

The first Denmark wave is intentionally limited to employment income whose personal-income amount after AM contribution does not exceed DKK 641,200.

The model rejects higher income rather than omitting the 2026 middle, top or additional-top bracket taxes. It also excludes capital income because positive net capital income can change the bottom and middle-tax calculations.

## Inputs

The caller supplies:

- annual employment income fully subject to AM contribution;
- municipal taxable income after legally applicable employment, job and other deductions but before personal-allowance relief;
- the applicable municipal income-tax rate in basis points.

A municipal rate of `2,500` represents 25.00%.

The package does not identify the municipality or maintain a municipal-rate catalogue.

## Personal allowance

For 2026 the adult personal allowance is DKK 54,100.

The package calculates the tax value of the allowance separately against:

- bottom-bracket tax at 12.01%;
- municipal tax at the caller-confirmed rate.

Each reduction is non-refundable and limited to its corresponding tax layer.

## Deterministic fixture

For DKK 500,000 employment income, DKK 390,000 municipal taxable income and a 25.00% municipal rate, the package calculates:

- DKK 40,000.00 AM contribution;
- DKK 48,748.59 bottom-bracket tax after personal allowance;
- DKK 83,975.00 municipal tax after personal allowance;
- DKK 172,723.59 total included tax.

## Official sources

- Danish Tax Agency guidance for the 8% AM contribution and the age rule applying from 2026;
- Danish Tax Agency guidance for the 2026 bottom, middle, top and additional-top bracket rates and thresholds;
- Danish Ministry of Taxation table for the 2026 DKK 54,100 personal allowance and statutory thresholds;
- Danish Tax Agency calculation guidance showing the personal allowance applied separately to bottom-bracket and municipal tax.

Source observation date: 2026-07-24.

## Exclusions

The package does not calculate or determine:

- middle, top or additional-top bracket tax;
- capital, share, pension, benefit, business or foreign income;
- employment, job, senior, single-parent, pension or other deduction derivation;
- church tax, municipality lookup or the personal-income tax ceiling;
- taxpayers under age 18, partial-year residence or spouse allowance transfers;
- withholding, preliminary tax, property tax, treaties or assessment reconciliation.

## Acceptance boundary

Implementation includes the country model, combined multi-layer registry, closed input schema, catalogue and API registration, threshold and allowance fixtures, privacy tests, source attribution and documentation.

Repository acceptance requires the exact branch head to pass the complete repository and hardened-container workflow. Deployment and live acceptance remain separate states and are not claimed by this work package.
