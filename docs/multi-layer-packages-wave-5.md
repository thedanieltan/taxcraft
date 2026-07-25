# Multi-layer PIT packages — wave 5

## Scope

Wave 5 adds Sweden for calendar year 2026 with two independently reported earned-income tax layers:

- state income tax;
- caller-confirmed municipal income tax.

The package accepts separate final taxable earned-income bases because the caller remains responsible for applying the basic allowance, deductions and other adjustments before calculation.

## State calculation

For income year 2026:

- no state income tax applies to taxable earned income through SEK 643,000;
- 20% state income tax applies to the portion above SEK 643,000.

The threshold is applied to taxable earned income after the basic allowance. The package therefore does not use the pre-allowance age-specific breakpoints.

## Municipal calculation

Municipal income tax is calculated by applying the caller-confirmed municipal rate to the caller-confirmed municipal taxable earned-income base.

A supplied value of `3,238` represents 32.38%, the official 2026 national average municipal rate. The package does not identify the municipality or maintain a municipal-rate catalogue.

## Deterministic fixture

For SEK 800,000 state taxable earned income, SEK 700,000 municipal taxable earned income and a 32.38% municipal rate, the package calculates:

- SEK 31,400.00 state income tax;
- SEK 226,660.00 municipal income tax;
- SEK 258,060.00 total included tax.

## Official sources

- Swedish Tax Agency guidance confirming the SEK 643,000 state threshold and 20% rate for income year 2026;
- Swedish Tax Agency 2026 amounts and percentages, including the state threshold and 32.38% average municipal rate;
- Swedish Tax Agency salary-taxation guidance confirming that municipal rates vary by municipality.

Source observation date: 2026-07-24.

## Exclusions

The package does not calculate or determine:

- gross income, assessed income, basic allowance or taxable-income derivation;
- earned-income tax credit, pension tax reduction or other credits;
- public-service fee, church fee, funeral fee or other municipality-linked charges;
- employee social-insurance and pension contributions;
- capital, pension, benefit, business or foreign income;
- municipality identity or municipal-rate lookup;
- withholding, prepayments, treaties or assessment reconciliation.

## Acceptance boundary

Implementation includes the country model, combined multi-layer registry, closed input schema, catalogue and API registration, threshold and municipal fixtures, privacy tests, official-source attribution and documentation.

Repository acceptance requires the exact branch head to pass the complete repository and hardened-container workflow. Deployment and live acceptance remain separate states and are not claimed by this work package.
