# Singapore country package

This package calculates Singapore resident personal income tax for YA 2024, YA 2025 and YA 2026.

## Input

The caller supplies:

- `taxResident: true`, confirming that residency has already been determined;
- `chargeableIncomeMinor`, expressed in Singapore cents and limited to whole-dollar chargeable income.

The package does not derive chargeable income from salary, deductions, CPF contributions or personal reliefs.

## Included

- resident progressive rates published by IRAS for YA 2024 onwards;
- the general Personal Income Tax Rebate for YA 2024;
- the general Personal Income Tax Rebate for YA 2025;
- IRAS worked examples for YA 2026 as fixtures.

## Excluded

- tax-residency determination;
- non-resident cases;
- relief and deduction eligibility;
- Parenthood Tax Rebate and other taxpayer-specific rebates;
- filing or tax advice.

Every calculation line links to the IRAS source supporting the applied rate or rebate. TaxCraft processes the supplied facts for the calculation and does not store them.
