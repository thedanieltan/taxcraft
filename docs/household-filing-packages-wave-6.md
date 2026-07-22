# Household and filing-status packages — wave 6

## Isle of Man

TaxCraft implements the Isle of Man resident income-tax schedules for tax year 2026-27.

### Supported calculation

For an individual, the calculator applies:

- a GBP 17,000 personal allowance;
- a GBP 6,500 standard-rate band at 10%;
- 21% on the remaining taxable income.

For a jointly assessed couple, it applies:

- a GBP 34,000 personal allowance;
- a GBP 13,000 standard-rate band at 10%;
- 21% on the remaining taxable income.

The ordinary personal allowance is reduced by GBP 1 for every GBP 2 of total income above GBP 100,000 for an individual or GBP 200,000 for a jointly assessed couple. The caller may also provide legally available additional allowances after eligibility has been determined outside TaxCraft.

### Required facts

- `scopeConfirmed`: confirms the resident individual or joint schedule applies;
- `filingSchedule`: `individual` or `joint`;
- `assessableIncomePounds`: assessable income after expenses and deductions but before personal allowances, in whole pounds;
- `totalIncomeForAllowanceTaperPounds`: total income used for the allowance taper, in whole pounds;
- `additionalAllowancesPounds`: caller-confirmed additional allowances, in whole pounds.

Whole-pound inputs preserve the GBP 1-for-GBP 2 taper and both tax rates exactly in pence.

### Explicit exclusions

The package does not calculate:

- gross income, expenses, deductions or assessable-income derivation;
- eligibility for single-parent, blind, disabled, nursing, medical, donation, interest or other allowances;
- non-resident tax;
- income-tax cap elections;
- National Insurance contributions;
- payroll withholding, prior payments or assessment reconciliation;
- residence, income classification, joint-assessment eligibility or filing obligations.

### Primary sources

- Isle of Man Government, income-tax rates and allowances for 2026-27;
- Isle of Man Government, Budget 2026 facts and figures;
- Isle of Man Treasury, Budget Speech 2026.

### Acceptance fixtures

The deterministic suite covers the individual and joint personal allowances, both standard-rate bands, higher-rate tax, the first whole-pound allowance reduction, complete allowance exhaustion, caller-confirmed additional allowances, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
