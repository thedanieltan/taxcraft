# Household and filing-status packages: wave 3

## Malta

Jurisdiction code: `MT`

Package: `@taxcraft/country-household-filing`

Maintained year: `2026`

Currency: euro (`EUR`)

## Supported calculation

The package calculates ordinary individual income tax on caller-confirmed annual chargeable income under seven official schedules:

- single;
- married;
- married with one child;
- married with two or more children;
- parent;
- parent with one child;
- parent with two or more children.

Each schedule applies the published 0%, 15%, 25% and 35% bands and its schedule-specific thresholds.

## Input boundary

The caller selects the legally applicable schedule. TaxCraft does not determine schedule eligibility and does not request personal records to support the selection.

## Excluded scope

The package does not calculate or infer:

- chargeable-income, exemption, deduction or loss-relief derivation;
- joint versus separate computation decisions;
- non-resident or special residence regimes;
- social-security contributions;
- payroll withholding, provisional tax or return reconciliation;
- investment, property, capital-gain or category-specific schedules;
- foreign-tax relief, prior payments, penalties, interest or refunds.

## Source

Primary source:

- Malta Tax and Customs Administration, `Tax Rates for Individuals — 2026`.

The authority publishes the complete 2026 schedule table in English and Maltese. The English page is the calculator's canonical source record.

## Acceptance fixtures

Tests cover:

- the zero-rate threshold for every schedule;
- the end of the 15% and 25% bands for every schedule;
- the 35% top band for every schedule;
- package-bundle, catalogue and API registration;
- public schema and all seven schedule values;
- official source attribution;
- unsupported-year rejection;
- disallowed additional fact rejection.

## Maintenance boundary

The package uses manual source maintenance. Future rate changes must be grounded in a later Malta Tax and Customs Administration table. Social-security and special residence calculations remain separate scopes.
