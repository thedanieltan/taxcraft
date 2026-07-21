# Progressive-reliefs packages — wave 23

## Colombia

TaxCraft implements Colombia's calendar-year 2026 resident natural-person income-tax table under article 241 of the Tax Statute.

### Precision contract

Article 241 expresses its thresholds, marginal calculations and fixed tax amounts in UVT. To preserve the legal formula without inferring how a peso-denominated taxable base should be converted, the calculator requires the caller-confirmed taxable base in units of one ten-thousandth of a UVT.

The result exposes both:

- tax in one ten-thousandth of a UVT; and
- tax in Colombian peso cents using the 2026 UVT of COP 52,374.

Payment-form rounding to thousands of pesos remains outside scope.

### Supported calculation

The package applies the article 241 table:

- 0% through 1,090 UVT;
- 19% from 1,090 through 1,700 UVT;
- 28% above 1,700 through 4,100 UVT, plus 116 UVT;
- 33% above 4,100 through 8,670 UVT, plus 788 UVT;
- 35% above 8,670 through 18,970 UVT, plus 2,296 UVT;
- 37% above 18,970 through 31,000 UVT, plus 5,901 UVT;
- 39% above 31,000 UVT, plus 10,352 UVT.

The statutory fixed amounts are used directly. They are not reconstructed from earlier bands, preserving the table's published transition amounts.

### Required facts

- `scopeConfirmed`;
- `taxableBaseUvtTenThousandths`: caller-confirmed resident taxable base in 1/10,000 UVT.

### Explicit exclusions

TaxCraft does not calculate:

- conversion of a peso-denominated taxable base into UVT;
- gross income, exempt income, costs, deductions, cedular consolidation or taxable-base derivation;
- dividends, occasional gains, non-resident or special-rate schedules;
- credits, withholding, advances or prior payments;
- declaration and payment-form rounding;
- residence, source, classification or filing obligations.

### Primary sources

- Colombia Tax Statute article 241, current consolidated text;
- DIAN Resolution 238 of 2025, setting the 2026 UVT at COP 52,374;
- Tax Statute article 868 and DIAN doctrine on UVT conversion and approximation.

### Acceptance fixtures

The deterministic suite covers the zero-rate range, every statutory fixed-offset transition, the open-ended 39% range, UVT-to-COP conversion, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
