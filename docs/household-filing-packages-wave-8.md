# Household and filing-status PIT packages — wave 8

## Scope

Wave 8 adds Luxembourg resident ordinary income tax for tax year 2026 under caller-confirmed tax classes 1, 1a and 2.

The package accepts annual adjusted taxable income after applicable deductions and allowances. It does not infer residence, tax-class eligibility, household composition, collective-assessment eligibility or filing obligations.

## Calculation

The package supports:

- the Article 118 progressive tariff applicable from tax year 2025 and retained for tax year 2026;
- class 1 assessment under the base tariff;
- the Article 120bis class 1a transformation below EUR 51,804 and the statutory 39%, 40%, 41% and 42% marginal-rate caps above that threshold;
- the Article 121 class 2 procedure, applying twice the tariff tax on half the adjusted taxable income;
- flooring adjusted taxable income to the lower EUR 50 multiple;
- flooring assessed tax to whole euro;
- treating assessed tax below EUR 12 as zero;
- the contribution to the employment fund at 7%, or 9% above EUR 150,000 for classes 1 and 1a and above EUR 300,000 for class 2.

Income tax and the employment-fund contribution are reported separately and reconcile to the total payable amount produced by the supported calculation.

## Official sources

- Luxembourg Direct Tax Administration coordinated Income Tax Law effective 1 January 2026, Articles 118 to 126;
- Luxembourg Direct Tax Administration base tariff for natural persons applicable from tax year 2025;
- Luxembourg Direct Tax Administration resident tax-class guidance;
- Luxembourg Direct Tax Administration employment-fund contribution guidance.

Source observation date: 2026-07-23.

## Exclusions

The package does not calculate or determine:

- gross income, net-income categories, deductions, allowances or adjusted taxable income;
- residence, tax-class eligibility, collective assessment or filing obligations;
- child abatements, single-parent credit or other tax credits;
- employee, pensioner, self-employed, CO2, overtime, start-up or activity-retention credits and allowances;
- exempt-income progression, extraordinary-income spreading or special global-rate calculations;
- withholding, payroll tax cards, social-security or dependency contributions;
- non-resident minimum rates, treaty relief, foreign-tax credits or separate income schedules;
- prepayments, prior withholding, refunds, penalties, interest or assessment reconciliation.

## Acceptance boundary

Implementation includes the country package, closed input schema, official source register, catalogue and API registration, tariff and transition fixtures, employment-fund threshold tests, privacy tests and documentation.

Repository acceptance requires the exact branch head to pass the complete repository and hardened-container workflow. Deployment and live acceptance remain separate states and are not claimed by this work package.
