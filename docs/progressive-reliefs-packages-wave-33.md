# Progressive-reliefs packages — wave 33

## Guernsey

TaxCraft implements Guernsey's individual standard-rate income tax for the Year of Charge 2026.

### Supported calculation

The calculator applies the enacted 22% individual standard rate to caller-confirmed chargeable income.

Amounts are represented in pounds sterling minor units and tax is rounded half-up to the nearest penny.

### Required facts

- `scopeConfirmed`: confirms that the individual standard-rate method applies;
- `chargeableIncomeMinor`: caller-confirmed chargeable income after all legally applicable allowances, deductions and reliefs.

TaxCraft does not infer residence, income source, allowance entitlement, standard-charge eligibility or tax-cap eligibility.

### Explicit exclusions

The package does not calculate:

- gross-income, deduction, allowance, relief or chargeable-income derivation;
- personal, dependant, mortgage-interest, pension or other allowance eligibility;
- standard-charge elections or tax caps;
- Alderney-specific limits, non-resident treatment or temporary-residence rules;
- social-insurance contributions;
- ETI withholding, instalments or assessment reconciliation;
- foreign-tax or treaty relief, prior payments, penalties, interest or refunds.

### Primary sources

- States of Deliberation of Guernsey, Annual Budget for 2025, which enacted a 22% individual standard rate for the Years of Charge 2025 and 2026;
- States of Deliberation of Guernsey, Annual Budget for 2026 allowance propositions;
- States of Deliberation of Guernsey, Annual Budget for 2026 standard-charge proposition.

### Acceptance fixtures

The deterministic suite covers zero income, penny-level rounding, ordinary and high chargeable-income cases, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
