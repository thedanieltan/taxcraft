# Progressive-reliefs packages — wave 21

## Austria

TaxCraft implements Austria's ordinary calendar-year 2026 annual income-tax tariff for caller-confirmed taxable income.

### Supported calculation

The calculator applies:

- 0% through EUR 13,539;
- 20% from EUR 13,539 through EUR 21,992;
- 30% from EUR 21,992 through EUR 36,458;
- 40% from EUR 36,458 through EUR 70,365;
- 48% from EUR 70,365 through EUR 104,859;
- 50% from EUR 104,859 through EUR 1,000,000;
- 55% above EUR 1,000,000 through calendar year 2029.

Amounts are represented in euro cents and each progressive band is rounded half-up to the nearest cent. The package reproduces the Austrian Business Service Portal's published example: EUR 40,000 of taxable income produces EUR 7,447.20 of tariff tax.

### Required facts

- `scopeConfirmed`: confirms that the ordinary section 33(1) annual tariff applies;
- `taxableIncomeMinor`: caller-confirmed annual taxable income after legally applicable deductions and allowances.

TaxCraft does not infer residence, income classification, entitlement to credits or whether special-rate income is present.

### Explicit exclusions

The package does not calculate:

- gross-income, expense, deduction or taxable-income derivation;
- employee, pensioner, sole-earner, single-parent, maintenance or transport tax credits;
- family and child reliefs, extraordinary burdens or loss offsets;
- capital income, real-estate gains or other special-rate income;
- social-insurance contributions;
- wage-tax withholding, advance payments or assessment reconciliation;
- foreign-tax or treaty relief, prior payments, penalties, interest or refunds.

### Primary sources

- Austrian Federal Legal Information System, Income Tax Act 1988 section 33, version effective 1 January 2026;
- Austrian Business Service Portal, 2026 tariff levels and worked example;
- Austrian Federal Ministry of Finance, 2026 tax tariff and tax credits page.

### Acceptance fixtures

The deterministic suite covers zero and exempt income, every tariff threshold, the official EUR 40,000 example, the EUR 1 million transition, the temporary 55% band, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
