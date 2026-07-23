# Multi-layer PIT packages — wave 2

## Scope

Wave 2 adds Belgium for income year 2026 with two separately reported layers:

- ordinary resident personal income tax;
- the municipal addition to personal income tax.

The package accepts caller-confirmed annual jointly taxable income and a caller-confirmed municipal percentage expressed in basis points. It does not identify the municipality or infer the applicable local percentage.

## Federal calculation

The ordinary personal income-tax calculation supports:

- 25% through EUR 16,720;
- 40% through EUR 29,510;
- 45% through EUR 51,070;
- 50% above EUR 51,070;
- the EUR 11,180 basic tax-free amount.

The basic tax-free amount lies entirely within the 25% band and is represented by its standard EUR 2,795 tax reduction. Increased tax-free amounts and family-related enhancements remain outside scope.

## Municipal calculation

Belgian municipalities may impose an additional percentage calculated on the personal income-tax amount. The package applies the caller-confirmed percentage after the standard basic tax-free reduction and reports the municipal amount independently.

A supplied value of `700` represents 7.00%. The package does not maintain a municipality-rate catalogue.

## Official sources

- Belgian Federal Public Service Finance publication for income-year 2026 brackets and the EUR 11,180 basic tax-free amount;
- Belgian Federal Public Service Finance explanation that municipal additions are calculated by applying a municipal percentage to personal income tax.

Source observation date: 2026-07-24.

## Exclusions

The package does not calculate or determine:

- income, professional expenses, social contributions, deductions or taxable-income derivation;
- increased tax-free amounts, dependants, disability, marital quotient or spouse allocation;
- regional tax reductions, other credits, rebates or separately taxed income;
- municipality identity or municipal-rate lookup;
- withholding, advance payments, special social-security contributions or assessment reconciliation;
- non-resident tax, treaty positions, prior payments, refunds, penalties or interest.

## Acceptance boundary

Implementation includes the country model, combined multi-layer registry, closed input schema, catalogue and API registration, bracket and municipal boundary fixtures, privacy tests, source attribution and documentation.

Repository acceptance requires the exact branch head to pass the complete repository and hardened-container workflow. Deployment and live acceptance remain separate states and are not claimed by this work package.
