# United Kingdom country package

This package calculates Income Tax on non-savings income using the rates for England, Wales and Northern Ireland for tax years 2024–25, 2025–26 and 2026–27.

## Input

The caller supplies:

- `territory`: `England`, `Wales` or `Northern Ireland`;
- `nonSavingsIncomeMinor`: non-savings income in pence, using whole pounds;
- `adjustedNetIncomeMinor`: user-confirmed adjusted net income in pence, using whole pounds.

## Included

- the standard Personal Allowance;
- the £1-for-£2 Personal Allowance taper above £100,000;
- basic, higher and additional rates for England, Wales and Northern Ireland.

## Excluded

- Scottish Income Tax;
- residency and territorial-status determination;
- savings and dividend income;
- National Insurance;
- Marriage Allowance, Blind Person’s Allowance and other reliefs;
- filing and tax advice.

Every calculation line cites the HMRC current-and-previous-years rates publication. TaxCraft does not store calculation inputs or results.
