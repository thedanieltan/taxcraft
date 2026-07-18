# Simple-progressive PIT packages — wave 4

This work package adds Uganda and Guatemala to the manifest-driven PIT calculator.

## Uganda

The calculator accepts caller-confirmed annual chargeable income and a non-identifying selection of the legally applicable resident or non-resident schedule.

Resident schedule:

- 0% through UGX 2,820,000;
- 10% through UGX 4,020,000;
- 20% through UGX 4,920,000;
- 30% through UGX 120,000,000;
- 40% on the excess, representing the ordinary 30% rate plus the additional 10% high-income charge.

Non-resident schedule:

- 10% through UGX 4,020,000;
- 20% through UGX 4,920,000;
- 30% through UGX 120,000,000;
- 40% on the excess.

The calculator excludes chargeable-income derivation, withholding reconciliation, rental and category-specific regimes, and residence decisions.

Official sources: Uganda Revenue Authority domestic-tax guidance and the 2024–25 and 2025–26 taxation handbooks.

## Guatemala

The calculator accepts caller-confirmed annual taxable employment income after applicable deductions.

- 5% on the first GTQ 300,000;
- 7% on the excess.

The calculator excludes the derivation and eligibility of personal-expense, VAT, donation, insurance and social-contribution deductions, as well as employer withholding reconciliation and refunds.

Official sources: SAT's Decree 10-2012 income-tax law listing, employee ISR calculator and employment-deduction guidance.

## Shared boundaries

Both packages:

- support 2024, 2025 and 2026;
- reject undeclared and identity-bearing fields;
- use integer minor units and explicit half-up rounding;
- return cited calculation lines, assumptions and unsupported scope;
- do not infer residence, source, deductions or filing obligations.
