# Progressive-reliefs packages — wave 24

## Greece

TaxCraft implements Greece's tax-year 2026 profile-aware annual income-tax tariffs for caller-confirmed employment, pension and business-profit income.

### Profile inputs

The caller selects:

- `incomeSchedule`: employment/pension or business profit;
- `ageSchedule`: up to 25, 26 through 30, or 31 and above;
- `dependentChildrenCount`: the number of eligible dependent children;
- `taxableIncomeMinor`: annual taxable income after applicable deductions.

TaxCraft does not determine age, dependant eligibility, residence or income classification.

### Supported rates

The package applies the ordinary 2026 six-band tariff through EUR 10,000, EUR 20,000, EUR 30,000, EUR 40,000 and EUR 60,000, with a 44% open-ended top band. It applies the official age and dependant-child adjustments to the first three bands:

- taxpayers up to 25 receive 0% on the first EUR 20,000;
- taxpayers aged 26 through 30 receive the reduced second-band rate;
- eligible dependent children reduce the first three bands, including 0% on the first EUR 20,000 from four children onward.

### Article 16 reduction

Employment and pension income receives the non-refundable Article 16 tax reduction:

- EUR 777 without children;
- EUR 900 with one child;
- EUR 1,120 with two children;
- EUR 1,340 with three children;
- EUR 1,580 with four children;
- EUR 1,780 with five children;
- an additional EUR 220 for each child after the fifth.

The available reduction decreases by EUR 20 for each completed EUR 1,000 of taxable income above EUR 12,000. The reduction is capped at gross tariff tax. Business profits receive no Article 16 reduction.

### Explicit exclusions

TaxCraft does not calculate:

- taxable-income derivation;
- minimum presumptive net income for individual businesses;
- mixed employment, pension and business allocation;
- property, investment and capital-gain schedules;
- electronic-payment adjustments or other credits;
- withholding, advances or return reconciliation;
- eligibility, residence, source or filing determinations.

### Primary sources

- Hellenic Ministry of National Economy and Finance, English income-tax guide for tax year 2026;
- Hellenic Ministry of National Economy and Finance, Greek official income-tax guide;
- Hellenic Government, 2026 income-tax reform measures.

### Acceptance fixtures

The deterministic suite covers all three age profiles, zero-rate child profiles, the five-child and post-fifth-child credit amounts, the Article 16 taper, non-refundable credit capping, business-profit exclusion from the credit, API discovery, schema exposure, unsupported tax years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
