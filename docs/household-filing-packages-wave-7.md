# Household-filing packages — wave 7

## France

TaxCraft implements the standard Article 197 household quotient calculation for the 2026 assessment of 2025 income.

### Supported calculation

The package:

1. rounds household taxable income to the nearest whole euro;
2. divides the scale through caller-confirmed whole half-parts;
3. applies the 0%, 11%, 30%, 41% and 45% tariff per quotient part;
4. rounds gross tariff tax to the nearest whole euro;
5. applies the general EUR 1,807 quotient-family cap per additional half-part;
6. applies the selected overseas-department reduction;
7. applies the single or joint decote formula.

The per-part thresholds are EUR 11,600, EUR 29,579, EUR 84,577 and EUR 181,917.

The territorial reductions are:

- 30%, capped at EUR 2,450, for Guadeloupe, Martinique and Reunion;
- 40%, capped at EUR 4,050, for Guyane and Mayotte.

The decote equals the positive difference between:

- EUR 897 and 45.25% of tax for single, divorced or widowed assessment;
- EUR 1,483 and 45.25% of tax for joint assessment.

### Required facts

- `scopeConfirmed`: confirms ordinary resident Article 197 scope;
- `filingSchedule`: `single` or `joint`;
- `territorySchedule`: metropolitan France, Guadeloupe/Martinique/Reunion, or Guyane/Mayotte;
- `standardQuotientCapConfirmed`: confirms that only the general quotient cap applies;
- `quotientHalfParts`: total quotient-family parts expressed in whole half-parts;
- `taxableIncomeMinor`: caller-confirmed household taxable income after applicable deductions and allowances.

A joint assessment requires at least four half-parts. TaxCraft does not determine filing eligibility or quotient parts.

### Explicit exclusions

The package does not calculate:

- quarter-parts for shared custody;
- lone-parent, veteran, invalidity, widow, attached-adult or other special quotient caps and supplementary reductions;
- gross income, category income, deductions or taxable-income derivation;
- tax reductions, tax credits, exceptional high-income contributions or differential high-income contributions;
- investment, capital, property or other separate and proportional-rate income;
- social contributions, withholding at source, advance payments or assessment reconciliation;
- non-resident minimum rates or worldwide-income effective-rate elections;
- residence, source, filing-status, quotient-part or territorial eligibility.

### Primary sources

- General Tax Code Article 197, version effective from 21 February 2026;
- French tax authority 2026 quotient-family cap guidance;
- French tax authority income-base and gross-tax rounding guidance.

### Acceptance fixtures

The deterministic suite covers the tariff and decote for a single taxpayer, the official EUR 130,000 and five-part quotient-cap example, both overseas-department reductions, whole-euro rounding, API and schema exposure, invalid joint half-parts, unsupported tax years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
