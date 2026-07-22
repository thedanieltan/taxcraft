# Progressive-reliefs packages — wave 32

## Algeria

TaxCraft implements Algeria's Article 104 annual progressive global income-tax scale for calendar year 2026 on caller-confirmed annual taxable income before category-specific tax abatements.

### Supported calculation

The calculator applies:

- 0% through DZD 240,000;
- 23% from DZD 240,000 through DZD 480,000;
- 27% from DZD 480,000 through DZD 960,000;
- 30% from DZD 960,000 through DZD 1,920,000;
- 33% from DZD 1,920,000 through DZD 3,840,000;
- 35% above DZD 3,840,000.

The Algerian Directorate General of Taxes continues to publish this Article 104 scale in its current salary and wage guidance, and published the consolidated 2026 Direct Taxes and Similar Taxes Code in April 2026. Amounts are represented in centimes and each progressive band is rounded half-up to the nearest centime.

### Required facts

- `scopeConfirmed`: confirms that the Article 104 progressive scale applies before any category-specific tax abatement;
- `annualTaxableIncomeMinor`: caller-confirmed annual taxable income after legally applicable deductions and exemptions but before salary, pension or other tax abatements.

TaxCraft does not infer residence, income classification, taxable-income derivation or entitlement to a tax abatement.

### Explicit exclusions

The package does not calculate:

- gross income, category income, expenses, deductions or annual-taxable-income derivation;
- the 40% salary and pension tax abatement, its minimum and maximum amounts, or secondary relief formulas;
- monthly payroll annualisation, withholding, employer remittance or annual reconciliation;
- disabled-worker, pensioner or non-resident pension-specific payroll treatment;
- occasional intellectual-activity, author, artist or other final withholding schedules;
- property, capital, agricultural, business or other category-specific and provisional tax calculations;
- social-security contributions, credits, foreign-tax or treaty relief, prior payments, penalties, interest or refunds.

### Primary sources

- Algerian Directorate General of Taxes, current Article 104 IRG salary and wage guidance in French;
- Algerian Directorate General of Taxes, current Article 104 guidance in Arabic, updated in February 2026;
- Algerian Directorate General of Taxes, publication of the consolidated 2026 Direct Taxes and Similar Taxes Code.

### Acceptance fixtures

The deterministic suite covers zero income, the DZD 240,000 zero-rate threshold, every intermediate transition, the DZD 3,840,000 boundary, the open-ended 35% band, source attribution, API discovery, schema exposure, exclusions, unsupported tax years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
