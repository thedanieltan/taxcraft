# PIT country-package contract

Every maintained personal income tax package declares a `manifest.pit` object conforming to `taxcraft.pit-country-package.v1`.

The contract is published as `packages/country-sdk/schemas/pit-country-package.schema.json` and enforced by `definePitCountryPackage`.

## Declared structure

Each package declares:

- tax unit: individual, filing-status, household or household-or-filing-status;
- tax-year basis;
- supported currencies;
- income schedules;
- national, subnational and local tax layers;
- whether subdivision selection is required;
- a closed JSON Schema for calculation facts;
- rounding stages and minor-unit quanta;
- manual, automated or hybrid maintenance mode.

## Executable fact schema

The `factsSchema` is both metadata and runtime validation. TaxCraft checks the basic object shape before invoking country validation. Established country-specific errors are preserved; remaining schema violations are then enforced for:

- undeclared fields;
- missing required facts;
- incompatible types;
- values outside declared enums, constants or ranges;
- money that is not represented in integer minor units;
- values that violate declared whole-unit increments.

The package contract accepts only a constrained JSON Schema subset suitable for deterministic form generation and API validation.

## Fact annotations

Each property declares `x-taxcraft-kind`:

- `money-minor`
- `confirmed-status`
- `enum`
- `subdivision-code`
- `count`
- `percentage-basis-points`
- `plain`

Money facts must identify one of the package's declared currencies. Identity-bearing fact names are prohibited.

## Boundaries

The schema describes facts required by a calculator. It does not establish that the facts are legally correct.

The caller or country-specific package remains responsible for confirming:

- residency and territorial status;
- filing status and household composition;
- income classification;
- deduction, allowance, credit and rebate eligibility;
- the applicable regional or local regime.

## Maintained packages

Singapore declares confirmed resident status and whole-dollar chargeable income.

The United Kingdom package declares the selected England, Wales or Northern Ireland regime, non-savings income and adjusted net income in whole pounds.

Both packages retain their existing country-specific validation and calculation fixtures alongside the shared schema check.
