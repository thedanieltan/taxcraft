# Simple-progressive packages — wave 14

## Montenegro

TaxCraft implements Montenegro's national tax on monthly personal earnings for calendar year 2026.

### Supported calculation

- 0% through EUR 700 of monthly taxable personal earnings;
- 9% from EUR 700 through EUR 1,000;
- 15% above EUR 1,000.

The package uses euro cents and half-up rounding. Municipal surtax and social contributions are excluded.

### Required facts

- `scopeConfirmed`;
- `monthlyTaxablePersonalIncomeMinor`.

### Explicit exclusions

Gross-to-taxable derivation, contributions, municipal surtax, annual aggregation, non-salary schedules, withholding administration, residence and filing determinations remain outside scope.

### Primary sources

- Tax Administration of Montenegro personal-earnings bands;
- Government payroll calculation instruction applicable from 1 January 2026;
- current consolidated Personal Income Tax Law.

### Acceptance fixtures

The deterministic suite covers zero income, both exact thresholds, the open-ended 15% band, source attribution, catalogue and API discovery, schema exposure, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
