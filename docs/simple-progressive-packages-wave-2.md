# Simple-progressive PIT packages — wave 2

TaxCraft extends `@taxcraft/country-simple-progressive` with three independently manifested packages for calendar years 2024 through 2026.

## Panama

The Panama package calculates annual individual income tax on caller-confirmed net taxable Panama-source income.

The first PAB 11,000 is exempt, income from PAB 11,000 to PAB 50,000 is taxed at 15%, and income above PAB 50,000 is taxed at 25% after the accumulated tax on the preceding band.

The caller must derive net taxable income after allowable deductions. Educational insurance, social-security contributions, payroll withholding and special regimes remain outside coverage.

## Honduras

The Honduras package applies the officially indexed progressive individual income-tax tables for 2024, 2025 and 2026.

Each year has a separate exempt threshold and 15%, 20% and 25% bands. The calculator therefore uses the selected year's published table rather than carrying one year's thresholds forward.

The caller must supply taxable income after applicable deductions and exemptions. Medical-expense allowances, withholding reconciliation, social contributions and other taxes remain outside coverage.

## Dominican Republic

The Dominican Republic package calculates natural-person income tax on caller-confirmed annual net taxable income for 2024 through 2026.

It implements the annual exempt band followed by the published 15%, 20% and 25% brackets. At the third and fourth brackets, TaxCraft applies the accumulated-tax amounts published by the tax authority rather than deriving approximate bases from rounded bracket endpoints.

The caller must derive net taxable income after allowable expenses and deductions. Salary withholding reconciliation, prior payments, social-security contributions and special withholding regimes remain outside coverage.

## Shared boundaries

Each result is personal income tax only for the confirmed annual taxable-income scope. TaxCraft does not determine residence, source, deduction eligibility, filing obligations, payroll withholding, social contributions or foreign-tax credits. Inputs contain tax facts only and exclude names, identity numbers, addresses and tax documents.
