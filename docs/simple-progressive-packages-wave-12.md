# Simple-progressive packages — wave 12

## Andorra

TaxCraft implements Andorra's standard resident general-income IRPF schedule for calendar year 2026.

### Supported calculation

The calculator applies the Government of Andorra's published effective schedule for a resident using the standard EUR 24,000 personal minimum:

- 0% through EUR 24,000 of annual general net income;
- 5% from EUR 24,000 through EUR 40,000;
- 10% above EUR 40,000.

The 5% middle band reflects the statutory 10% general rate and the 50% general-income bonus, capped at EUR 800. Amounts are represented in euro cents and each band is rounded half-up to the nearest cent.

### Required facts

- `scopeConfirmed`: confirms that the standard resident general-income schedule and EUR 24,000 personal minimum apply;
- `generalNetIncomeMinor`: caller-confirmed annual general net income before the standard personal minimum.

TaxCraft does not infer residence, income classification, entitlement to enhanced reductions or whether savings-base income is present.

### Explicit exclusions

The package does not calculate:

- gross-income, expense, integration, compensation or net-income derivation;
- the EUR 30,000 disability minimum or EUR 40,000 spouse-related minimum;
- dependant, mortgage, pension, compensatory-payment or other family reductions;
- savings-base income, its EUR 3,000 minimum or capital gains;
- double-tax, investment or employment-creation deductions;
- withholding, instalments, filing balances, prior payments, penalties, interest or refunds.

### Primary sources

- Government of Andorra, published effective IRPF percentages;
- Government of Andorra, statutory 10% IRPF rate;
- Government of Andorra, 50% general-income bonus capped at EUR 800.

### Acceptance fixtures

The deterministic suite covers zero income, the EUR 24,000 exemption boundary, the 5% band, the EUR 40,000 bonus-cap transition, the 10% upper band, source attribution, API discovery, schema exposure, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
