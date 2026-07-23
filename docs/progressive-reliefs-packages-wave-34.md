# Progressive-reliefs packages — wave 34

## Scope

Wave 34 adds the Netherlands calendar-year 2026 resident Box 1 calculation to `@taxcraft/country-progressive-reliefs`.

## Supported calculation

The package calculates:

- Box 1 tax for a person below AOW age for all of 2026;
- Box 1 tax for a person at AOW age for all of 2026 who was born on or after 1 January 1946;
- the separate first-band threshold for a full-year AOW taxpayer born before 1 January 1946;
- the general tax credit from caller-confirmed aggregate income;
- the employment tax credit from caller-confirmed employment income;
- non-refundable application of those two credits against the included Box 1 liability.

The input contract separates Box 1 taxable income, aggregate income and employment income because those statutory bases are not interchangeable.

## Published parameters

For a taxpayer below AOW age throughout 2026, the Box 1 rates are 35.75% through EUR 38,883, 37.56% through EUR 78,426 and 49.50% above that amount.

For a full-year AOW taxpayer, the first rate is 17.85%. The first threshold is EUR 38,883 for someone born on or after 1 January 1946 and EUR 41,123 for someone born before that date. The later bands use 37.56% and 49.50%.

The general credit is based on aggregate income. The employment credit is based on employment income. Both use the official 2026 Belastingdienst tables and are limited to the included Box 1 liability.

## Deterministic boundaries

The model floors supplied monetary bases to whole euro, floors each published Box 1 band amount to whole euro, and rounds the public credit-table formula to whole euro using half-up rounding. Belastingdienst notes that full-year AOW credit-table results can differ from the final assessment by one euro because of rounding.

The official EUR 80,000 Box 1 example is reproduced as EUR 29,531 before credits.

## Explicit exclusions

The package does not determine or calculate:

- the year in which a person reaches AOW age;
- income, deduction, own-home, aggregate-income or employment-income derivation;
- other tax credits, partner transfers or partial insurance periods;
- Box 2, Box 3 or the tariff adjustment for deductions;
- withholding, payroll administration, social-insurance eligibility, treaties or assessment reconciliation.

## Sources

The executable package cites the official Belastingdienst 2026 Box 1 rate page, general-credit table, employment-credit table and income-tax calculation guidance.
