# Household and filing-status packages — wave 2

## Poland

TaxCraft implements the ordinary Polish personal-income-tax scale for calendar years 2024, 2025 and 2026 with three caller-selected filing schedules:

- individual;
- joint spouses;
- single parent.

## Inputs

The package accepts:

- confirmation that ordinary scale taxation applies;
- the legally applicable filing schedule;
- primary taxable income after deductions;
- secondary taxable income for joint-spouse filing, or zero for the other schedules.

TaxCraft does not request names, civil-status records, child details, identity numbers or tax documents.

## Calculation

The package first rounds the applicable taxable base to whole Polish zloty under the statutory half-up rule.

The ordinary scale is:

- 12% through PLN 120,000, reduced by PLN 3,600 and floored at zero;
- PLN 10,800 plus 32% of the excess above PLN 120,000.

For joint spouses, TaxCraft:

1. combines both taxable-income amounts;
2. calculates tax on one half of the combined amount;
3. multiplies that tax by two.

For single-parent filing, TaxCraft:

1. calculates tax on one half of the parent's taxable income;
2. multiplies that tax by two.

The final tax is rounded to whole Polish zloty under the same statutory half-up rule.

## Exclusions

The package does not determine:

- taxable income, costs, social contributions or deductions;
- eligibility for joint-spouse or single-parent filing;
- child, rehabilitation, internet, donation or other reliefs;
- minor-child income aggregation or foreign-income relief;
- flat-rate, lump-sum, capital-income or category-specific schedules;
- withholding, advances, prior payments, refunds or the filing balance.

## Sources

The package is grounded in official Ministry of Finance guidance for the tax scale, joint-spouse filing and single-parent filing, plus Article 63 of the Tax Ordinance for whole-zloty rounding.

Implementation, deployment and live acceptance remain separate states.
