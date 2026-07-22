# Household and filing-status packages — wave 5

## Germany

TaxCraft implements Germany's assessment-year 2026 ordinary income-tax tariff for individual assessment and statutory joint spouse assessment.

### Supported calculation

For individual assessment, the calculator applies section 32a(1):

- no tariff tax through EUR 12,348;
- the first linear-progressive formula from EUR 12,349 through EUR 17,799;
- the second linear-progressive formula from EUR 17,800 through EUR 69,878;
- 42% less the statutory fixed amount from EUR 69,879 through EUR 277,825;
- 45% less the statutory fixed amount from EUR 277,826.

For joint assessment, section 32a(5) applies twice the tariff tax calculated on half of the combined taxable income.

### Required facts

- `scopeConfirmed`: confirms that the ordinary section 32a tariff and selected assessment procedure apply;
- `filingSchedule`: `individual` or `joint`;
- `taxableIncomeMinor`: individual taxable income or combined spouse taxable income after legally applicable deductions and allowances.

### Statutory rounding

The law requires taxable income to be rounded down to full euro before the formula is applied. The resulting tariff tax is also rounded down to full euro. Under joint assessment, the tariff is applied to the whole-euro amount obtained from half of combined taxable income, and that whole-euro tax is doubled.

### Explicit exclusions

The package does not calculate:

- gross-income, expenses, deductions, allowances or taxable-income derivation;
- the child-allowance and child-benefit comparison;
- solidarity surcharge or church tax;
- progression-clause income or special rates under sections 32b, 32d, 34, 34a, 34b and 34c;
- payroll withholding, wage-tax classes, prepayments or assessment reconciliation;
- foreign-tax or treaty relief;
- residence, income classification, spouse eligibility or filing obligations.

### Primary sources

- German Income Tax Act section 32a, 2026 tariff and spouse-splitting procedure;
- German Federal Ministry of Finance 2026 Wage Tax Handbook, section 32a;
- German Federal Ministry of Finance summary of the 2026 tax changes.

### Acceptance fixtures

The deterministic suite covers all five statutory tariff zones, whole-euro income and tax flooring, individual and joint assessment, odd-cent joint income, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
