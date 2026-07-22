# Progressive-reliefs packages — wave 27

## Ecuador

TaxCraft implements Ecuador's fiscal-year 2025 general-regime individual income-tax table. This is the latest complete ordinary individual schedule officially published by the Internal Revenue Service of Ecuador and is the schedule being filed during 2026.

### Supported calculation

The calculator applies the official basic-fraction table to caller-confirmed taxable base:

| Basic fraction from | Up to | Fixed tax | Rate on excess |
| ---: | ---: | ---: | ---: |
| USD 0 | USD 12,081 | USD 0 | 0% |
| USD 12,081 | USD 15,387 | USD 0 | 5% |
| USD 15,387 | USD 19,978 | USD 165 | 10% |
| USD 19,978 | USD 26,422 | USD 624 | 12% |
| USD 26,422 | USD 34,770 | USD 1,398 | 15% |
| USD 34,770 | USD 46,089 | USD 2,650 | 20% |
| USD 46,089 | USD 61,359 | USD 4,914 | 25% |
| USD 61,359 | USD 81,817 | USD 8,731 | 30% |
| USD 81,817 | USD 108,810 | USD 14,869 | 35% |
| USD 108,810 | No limit | USD 24,316 | 37% |

TaxCraft uses each published fixed tax amount directly at the basic-fraction transition. It does not reconstruct those values from cumulative band arithmetic because the official table includes whole-dollar transition amounts.

### Required facts

- `scopeConfirmed`: confirms that the fiscal-year 2025 general-regime table applies;
- `taxableBaseMinor`: caller-confirmed annual taxable base after applicable income and deduction rules.

The output is tax caused before the personal-expense rebate and other tax credits.

### Explicit exclusions

The package does not calculate:

- gross income, exempt income, costs, expenses, deductions or taxable-base derivation;
- the personal-expense rebate or family-load calculations;
- older-adult and disability exemptions;
- RIMPE popular-business or entrepreneur schedules;
- inheritance, legacy, donation or gratuitous-transfer tax;
- IESS contribution derivation, withholding or annual return reconciliation;
- Galapagos adjustments, foreign-tax credits, treaty relief, prior payments, penalties, interest or refunds;
- residence, source, income classification or filing obligations.

A separately published 2026 inheritance and donation table is not ordinary personal income tax and is therefore not represented as 2026 general-regime coverage.

### Primary sources

- Internal Revenue Service of Ecuador, 2025 individual income-tax declaration and general-regime table;
- Internal Revenue Service of Ecuador, general income-tax guidance and taxable-base rules;
- Internal Revenue Service of Ecuador, 2025 filing campaign published in February 2026.

### Acceptance fixtures

The deterministic suite covers every official basic-fraction transition, a within-band calculation, the open-ended 37% band, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
