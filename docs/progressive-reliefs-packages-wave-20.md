# Progressive-reliefs packages — wave 20

## Slovakia

TaxCraft implements Slovakia's ordinary calendar-year 2026 individual income-tax scale for a caller-confirmed annual tax base governed by section 4(1)(a).

### Supported calculation

The calculator applies:

- 19% through EUR 43,983.32;
- 25% from EUR 43,983.32 through EUR 60,349.21;
- 30% from EUR 60,349.21 through EUR 75,010.32;
- 35% above EUR 75,010.32.

The thresholds are the official 154.8, 212.4 and 264 multiples of the EUR 284.13 subsistence minimum valid on 1 January 2026. Amounts are represented in euro cents and each progressive band is rounded half-up to the nearest cent.

### Required facts

- `scopeConfirmed`: confirms that the ordinary section 4(1)(a) schedule applies;
- `taxBaseMinor`: caller-confirmed annual tax base after legally applicable deductions and non-taxable amounts.

TaxCraft does not infer residence, income classification, entitlement to allowances, or whether the section 4(1)(a) schedule applies.

### Explicit exclusions

The package does not calculate:

- gross or partial tax-base derivation;
- taxpayer, spouse, dependant or other non-taxable allowances;
- business and self-employment schedules, including the 15% small-business rate;
- dividend, capital, rental, special or final-tax income;
- social or health contributions;
- payroll advances or annual settlement reconciliation;
- foreign-tax or treaty relief, prior payments, penalties, interest or refunds.

### Primary sources

- Financial Administration of the Slovak Republic, 2026 calculation of income-tax advances and tax rates;
- Financial Administration of the Slovak Republic, subsistence minimum valid on 1 January 2026;
- Act No. 595/2003 Coll. on Income Tax, version effective from 1 January 2026.

### Acceptance fixtures

The deterministic test suite covers zero tax base, the smallest cent-level calculation, all three exact thresholds, a top-band case, source attribution, API discovery, schema exposure, exclusions, unsupported tax years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
