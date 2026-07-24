# Multi-layer PIT packages — wave 4

## Scope

Wave 4 adds Finland for calendar year 2026 with two independently reported earned-income tax layers:

- progressive state income tax;
- caller-confirmed municipal income tax.

The package accepts separate caller-confirmed taxable earned-income bases for state and municipal taxation because legally applicable deductions may produce different bases.

## State calculation

The 2026 state earned-income schedule is:

- 12.64% through EUR 22,000;
- EUR 2,780.80 plus 19.00% above EUR 22,000 through EUR 32,600;
- EUR 4,794.80 plus 30.25% above EUR 32,600 through EUR 40,100;
- EUR 7,063.55 plus 33.25% above EUR 40,100 through EUR 52,100;
- EUR 11,053.55 plus 37.50% above EUR 52,100.

The calculation floors each final layer to euro cents.

## Municipal calculation

Municipal earned-income tax is calculated by applying the caller-confirmed municipal rate to the caller-confirmed municipal taxable earned-income base.

A supplied value of `800` represents 8.00%. The package does not identify the municipality or maintain a municipal-rate catalogue.

## Deterministic fixture

For EUR 50,000 state taxable earned income, EUR 45,000 municipal taxable earned income and an 8.00% municipal rate, the package calculates:

- EUR 10,355.30 state income tax;
- EUR 3,600.00 municipal income tax;
- EUR 13,955.30 total included tax.

## Official sources

- Finnish Tax Administration publication of the 2026 progressive state earned-income scale;
- Finnish Tax Administration 2026 tax-bases publication covering municipal rates and other earned-income tax parameters.

Source observation date: 2026-07-24.

## Exclusions

The package does not calculate or determine:

- gross income, net earned income, deductions or taxable-income derivation;
- earned-income deduction, basic allowance, work-income credit or other credits;
- church tax, public broadcasting tax, health-care contribution or daily-allowance contribution;
- pension, unemployment or other employee insurance contributions;
- capital, pension, benefit, business or foreign income;
- municipality identity or municipal-rate lookup;
- withholding, prepayments, treaties or assessment reconciliation.

## Acceptance boundary

Implementation includes the country model, combined multi-layer registry, closed input schema, catalogue and API registration, state-threshold and municipal fixtures, privacy tests, source attribution and documentation.

Repository acceptance requires the exact branch head to pass the complete repository and hardened-container workflow. Deployment and live acceptance remain separate states and are not claimed by this work package.
