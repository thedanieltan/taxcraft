# Multi-layer PIT packages — wave 1

## Scope

Wave 1 adds Switzerland for tax year 2026 with three independently reported income-tax layers:

- direct federal income tax;
- Canton Zürich income tax;
- City of Zürich municipal income tax.

The package accepts separate caller-confirmed federal and Zürich taxable-income amounts because the legal bases and deductions are not assumed to be identical. It accepts caller-confirmed federal and Zürich tariff selections and does not determine marriage, single-parent, child, supported-person, residence or filing eligibility.

## Federal calculation

The federal layer supports:

- the 2026 single tariff;
- the 2026 married-or-single-parent tariff;
- the CHF 263 tax reduction for each caller-confirmed child or supported person;
- disregard of taxable-income remainders below CHF 100;
- downward rounding of annual tax to five centimes;
- non-collection of federal tax below CHF 25;
- the statutory 11.5% upper-rate transition.

## Zürich calculation

The Zürich layer supports:

- the 2026 basic tariff;
- the 2026 married-or-single-parent tariff;
- disregard of taxable-income remainders below CHF 100;
- calculation of the simple state tax under section 35 of the Zürich Tax Act;
- downward rounding of the simple state tax to whole francs;
- the 2026 Canton Zürich multiplier of 95%;
- the 2026 City of Zürich municipal multiplier of 119%;
- commercial rounding of each canton and municipal amount to five centimes.

## Official sources

- Swiss Federal Tax Administration Circular No. 215 and Form 58c for the 2026 federal tariff, child reduction and rounding rules;
- Zürich Tax Act effective 1 January 2026 for the simple state tax and tariff bands;
- Cantonal Tax Office Zürich directive on tax-invoice calculation and rounding;
- official Canton Zürich and City of Zürich publications for the 2026 multipliers.

Source observation date: 2026-07-23.

## Exclusions

The package does not calculate or determine:

- taxable income, deductions or allowance eligibility;
- unsupported cantons or municipalities;
- church tax, personal tax, wealth tax or real-estate gains tax;
- withholding or source tax, social-insurance contributions or payroll administration;
- capital benefits, liquidation profits or other separately assessed schedules;
- partial-year, rate-determining, inter-cantonal or international allocation;
- credits, treaties, payments, refunds, penalties, interest or return reconciliation.

## Acceptance boundary

Implementation includes the country package, new regional-municipal workspace, closed input schema, catalogue and API registration, federal and Zürich boundary fixtures, privacy tests, source attribution and documentation.

Repository acceptance requires the exact branch head to pass the complete repository and hardened-container workflow. Deployment and live acceptance remain separate states and are not claimed by this work package.
