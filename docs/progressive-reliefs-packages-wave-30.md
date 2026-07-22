# Progressive-reliefs packages — wave 30

## Morocco

TaxCraft implements Morocco's general income-tax scale published in the 2026 General Tax Code for caller-confirmed annual net taxable income.

### Supported calculation

The calculator applies:

- 0% through MAD 40,000;
- 10% from MAD 40,000 through MAD 60,000;
- 20% from MAD 60,000 through MAD 80,000;
- 30% from MAD 80,000 through MAD 100,000;
- 34% from MAD 100,000 through MAD 180,000;
- 37% above MAD 180,000.

The 2026 General Tax Code incorporates Finance Law No. 50-25 and retains the general scale introduced by the 2025 reform. Amounts are represented in centimes and each progressive band is rounded half-up to the nearest centime.

### Required facts

- `scopeConfirmed`: confirms that the Article 73-I general scale applies;
- `netTaxableIncomeMinor`: caller-confirmed annual net taxable income after legally applicable deductions and exemptions.

TaxCraft does not infer residence, income-period classification, category-income amounts, deduction eligibility or whether a specific rate or special regime applies.

### Explicit exclusions

The package does not calculate:

- gross income, category income, expenses, deductions or net-taxable-income derivation;
- family-charge reductions, pension relief, professional-expense deductions or other credits and reductions;
- salary withholding, advance payments, annual return reconciliation or payment administration;
- professional-contribution, auto-entrepreneur, simplified, presumptive or other special business regimes;
- property, capital, rental, agricultural, foreign-source or other category-specific and final-rate schedules;
- social-security and health-insurance contributions;
- foreign-tax or treaty relief, prior payments, penalties, interest or refunds.

### Primary sources

- Ministry of Economy and Finance, General Tax Code 2026, Article 73-I;
- General Directorate of Taxes, Circular No. 737 on Finance Law No. 50-25 for 2026;
- Official Bulletin No. 7465 bis containing Finance Law No. 50-25 for 2026.

### Acceptance fixtures

The deterministic suite covers zero income, the MAD 40,000 exempt threshold, every intermediate statutory transition, the MAD 180,000 boundary, the open-ended 37% band, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
