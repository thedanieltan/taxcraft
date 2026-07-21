# Progressive-reliefs packages — wave 25

## Jordan

TaxCraft implements Jordan's calendar-year 2026 ordinary natural-person income-tax schedule and the separate national contribution.

### Supported calculation

The ordinary income-tax calculator applies:

- 5% to the first JOD 5,000;
- 10% to the next JOD 5,000;
- 15% to the next JOD 5,000;
- 20% to the next JOD 5,000;
- 25% to taxable income above JOD 20,000 through JOD 1,000,000;
- 30% above JOD 1,000,000.

A separate 1% national contribution applies to the portion of natural-person taxable income above JOD 200,000. The result reports ordinary income tax, national-contribution base, national contribution and the combined total separately.

### Required facts

- `scopeConfirmed`;
- `taxableIncomeMinor`: caller-confirmed annual taxable income after legally applicable deductions and exemptions.

TaxCraft does not determine eligibility for personal, dependant, disability, medical, education, rent, housing-finance or other exemptions.

### Explicit exclusions

The package does not calculate:

- gross-income, expense, loss, exemption, donation or taxable-income derivation;
- foreign-source, pension, end-of-service, agricultural or other special income schedules;
- withholding, advances, prior payments or return reconciliation;
- foreign-tax or treaty relief, penalties, interest or refunds;
- residence, source, classification or filing obligations.

### Primary sources

- Jordan Income and Sales Tax Department, current Income Tax Law No. 34 of 2014 and amendments;
- Jordan Income and Sales Tax Department, natural-person tax bands effective from 2020 onwards;
- Jordan Income and Sales Tax Department, national contribution for natural persons.

### Acceptance fixtures

The deterministic suite covers all six ordinary income-tax thresholds, the JOD 200,000 national-contribution boundary, the JOD 1,000,000 top-rate transition, separate and combined totals, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
