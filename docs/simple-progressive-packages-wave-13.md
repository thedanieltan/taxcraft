# Simple-progressive packages — wave 13

## Zambia

TaxCraft implements Zambia's ordinary calendar-year 2026 annual individual income-tax schedule for caller-confirmed taxable income.

### Supported calculation

The calculator applies:

- 0% through ZMW 61,200;
- 20% from ZMW 61,200 through ZMW 85,200;
- 30% from ZMW 85,200 through ZMW 110,400;
- 37% above ZMW 110,400.

The annual thresholds were enacted by the Income Tax (Amendment) Act No. 22 of 2023 with effect from 1 January 2024. The 2025 amendments, including the amendment effective from 1 January 2026, changed other provisions and did not replace the ordinary individual bands. The current Zambia Revenue Authority PAYE guidance presents the equivalent monthly schedule.

Amounts are represented in ngwee and each progressive band is rounded half-up to the nearest ngwee.

### Required facts

- `scopeConfirmed`: confirms that the ordinary individual Charging Schedule applies;
- `taxableIncomeMinor`: caller-confirmed annual taxable income after legally applicable deductions and exemptions.

TaxCraft does not infer residence, income classification, deductions, exemptions or eligibility for another tax regime.

### Explicit exclusions

The package does not calculate:

- gross income, emoluments, expenses, deductions or taxable-income derivation;
- NAPSA, National Health Insurance, skills-development levy or other statutory contributions;
- monthly PAYE withholding, cumulative payroll tables, employer remittance or annual payroll reconciliation;
- turnover tax, presumptive tax, rental tax, minimum alternative tax or business-specific schedules;
- investment, interest, dividend, property, mining, farming or other special-rate income;
- foreign-tax or treaty relief, prior payments, penalties, interest or refunds.

### Primary sources

- National Assembly of Zambia, Income Tax (Amendment) Act No. 22 of 2023, Charging Schedule paragraph 2(1);
- Zambia Revenue Authority, current PAYE tax information;
- National Assembly of Zambia, Income Tax (Amendment) (No. 2) Act No. 17 of 2025, effective 1 January 2026.

### Acceptance fixtures

The deterministic suite covers zero income, the ZMW 61,200 tax-free threshold, the ZMW 85,200 and ZMW 110,400 transitions, the open-ended 37% band, source attribution, API discovery, schema exposure, exclusions, unsupported tax years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
