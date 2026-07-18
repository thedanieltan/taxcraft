# Simple-progressive PIT packages — wave 6

## Australia resident individual income tax

The Australia package calculates statutory resident individual income tax from caller-confirmed annual taxable income.

### Maintained tax years

- `2024-25`;
- `2025-26`;
- `2026-27`.

For 2024-25 and 2025-26, the resident schedule is:

- tax free through AUD 18,200;
- 16% from AUD 18,201 through AUD 45,000;
- 30% from AUD 45,001 through AUD 135,000;
- 37% from AUD 135,001 through AUD 190,000;
- 45% above AUD 190,000.

For 2026-27, the first taxable rate falls from 16% to 15%. The remaining thresholds and rates are unchanged.

The package excludes the Medicare levy, Medicare levy surcharge, offsets, rebates, study-loan repayments, withholding reconciliation, foreign-resident rates and working-holiday-maker rates.

## Philippines graduated individual income tax

The Philippines package calculates the ordinary graduated tax schedule effective from 1 January 2023 onwards from caller-confirmed annual taxable income.

### Maintained calendar years

- `2024`;
- `2025`;
- `2026`.

The schedule is:

- 0% through PHP 250,000;
- 15% on the excess through PHP 400,000;
- 20% on the excess through PHP 800,000;
- 25% on the excess through PHP 2,000,000;
- 30% on the excess through PHP 8,000,000;
- 35% above PHP 8,000,000.

The package excludes the optional 8% gross-income regime, minimum-wage exemptions, passive-income final taxes, capital-gains taxes, foreign-tax credits and withholding reconciliation.

## Shared contract

Both packages:

- accept only a scope confirmation and annual taxable income;
- request no names, identity numbers, addresses or tax documents;
- return deterministic progressive-band breakdowns;
- cite official government and tax-authority sources;
- expose unsupported scope explicitly.
