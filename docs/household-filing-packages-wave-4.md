# Household and filing-status packages — wave 4

## Portugal

TaxCraft implements Portugal's calendar-year 2026 general personal income tax tariff for separate and joint assessment, together with the additional solidarity rate.

### Supported calculation

The calculator applies the nine article 68 general bands:

- 12.5% through EUR 8,342;
- 15.7% through EUR 12,587;
- 21.2% through EUR 17,838;
- 24.1% through EUR 23,089;
- 31.1% through EUR 29,397;
- 34.9% through EUR 43,090;
- 43.1% through EUR 46,566;
- 44.6% through EUR 86,634;
- 48% above EUR 86,634.

The additional solidarity rate is:

- 2.5% on taxable income above EUR 80,000 and through EUR 250,000;
- 5% above EUR 250,000.

For joint assessment, the article 69 quotient divides combined taxable income by two before applying the tariff and multiplies the resulting tax by two. TaxCraft implements the mathematically equivalent doubled-threshold form, avoiding half-cent quotient ambiguity while preserving the statutory result.

### Required facts

- `scopeConfirmed`: confirms that the ordinary 2026 Portuguese IRS schedule applies;
- `filingSchedule`: `separate` or `joint`;
- `taxableIncomeMinor`: individual taxable income for separate assessment or combined household taxable income for joint assessment.

### Rounding

General IRS is calculated with cumulative remainder allocation so rounding occurs on cumulative liability rather than independently on every band. Solidarity components are rounded half-up to the nearest cent.

### Explicit exclusions

The package does not calculate:

- category aggregation, expenses, deductions, losses or taxable-income derivation;
- minimum-existence protections;
- household, dependent, ascendant or expense deductions from collection;
- special, autonomous, withholding or final-rate income;
- non-resident and special residence regimes;
- withholding, payments on account, prior payments or return reconciliation;
- legal eligibility for joint assessment.

### Primary sources

- Portuguese Tax and Customs Authority, Personal Income Tax Code article 68, 2026 general rates;
- Portuguese Tax and Customs Authority, article 69 joint-assessment quotient;
- Portuguese Tax and Customs Authority, article 68-A additional solidarity rate.

### Acceptance fixtures

The deterministic suite covers every general-rate transition, both filing schedules, the EUR 80,000 and EUR 250,000 solidarity thresholds and their doubled joint equivalents, cumulative cent allocation, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
