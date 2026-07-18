# Simple-progressive PIT packages — wave 3

This work package adds Barbados, Seychelles and Trinidad and Tobago to the manifest-driven PIT calculator.

## Barbados

The calculator accepts caller-confirmed annual taxable income after the applicable personal allowance and deductions.

- 2024 and 2025: 12.5% on the first BBD 50,000 of taxable income and 28.5% on the excess.
- 2026: 11.5% on the first BBD 50,000 and 27.5% on the excess.

It excludes personal-allowance derivation, compensatory and reverse tax credits, PAYE reconciliation and National Insurance.

Official sources: Barbados Revenue Authority personal-income-tax policy notes, including the Income Year 2026 rate reduction.

## Seychelles

The calculator accepts gross monthly cash emoluments from one employment source and a caller-confirmed citizen or non-citizen schedule.

Citizen schedule:

- 0% through SCR 8,555.50;
- 15% through SCR 10,000;
- 20% through SCR 83,333;
- 30% above SCR 83,333.

Non-citizen schedule:

- 15% through SCR 10,000;
- 20% through SCR 83,333;
- 30% above SCR 83,333.

It excludes annual aggregation, non-monetary benefits tax, special-project income, arrears attribution and employer reconciliation.

Official source: Seychelles Revenue Commission income and non-monetary benefits tax guidance.

## Trinidad and Tobago

The calculator accepts caller-confirmed annual chargeable income after deductions and allowances.

- 25% on the first TTD 1,000,000;
- 30% on the excess.

It excludes chargeable-income derivation, tax credits, PAYE reconciliation, Business Levy, Health Surcharge and National Insurance.

Official sources: Inland Revenue Division individual and PAYE computation guidance.

## Shared boundaries

All three packages:

- support 2024, 2025 and 2026;
- reject undeclared and identity-bearing fields;
- use integer minor units and explicit half-up rounding;
- return cited calculation lines, assumptions and unsupported scope;
- do not determine residence, citizenship, source or filing obligations.
