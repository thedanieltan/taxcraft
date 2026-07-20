# No-PIT jurisdiction packages — wave 2

TaxCraft's second no-PIT implementation wave adds independently manifested packages for:

- Saudi Arabia (`SA`);
- British Virgin Islands (`VG`).

Each package supports calendar years 2024, 2025 and 2026. The 2026 model is current; 2024 and 2025 remain historical-supported.

## Meaning of a zero result

A zero result means zero personal income tax only within the caller-confirmed package scope. It does not mean that the person, employer or business has no tax, withholding, payroll, social-insurance or regulatory obligations.

The caller must explicitly confirm the implemented scope before TaxCraft calculates. The input schema does not request identity data and does not determine residence, source, legal status or income classification.

## Saudi Arabia

The Saudi Arabia package covers caller-confirmed employment remuneration outside taxable business activity, permanent-establishment income and other Saudi-source profit-seeking activity.

The package explicitly excludes:

- business, professional, investment and other profit-seeking activity;
- non-resident permanent-establishment and other Saudi-source income;
- withholding tax and Zakat;
- social insurance and payroll obligations;
- residence, source and income-classification decisions.

The zero result must not be used for a person carrying on taxable activity or deriving income that falls within Saudi income-tax scope.

## British Virgin Islands

The British Virgin Islands package calculates personal income tax only. It does not calculate payroll tax.

British Virgin Islands payroll tax is a separate tax on remuneration administered by the Inland Revenue Department. Employer and self-employed liabilities, employee deductions, the annual remuneration exemption, payroll-tax classes and rates remain outside this package.

The package also excludes social security, National Health Insurance, pensions, property tax, stamp duty, hotel accommodation tax, business obligations and other fees.

## Sources and maintenance

The Saudi package cites the Zakat, Tax and Customs Authority's income-tax scope. The British Virgin Islands package cites the Government's Inland Revenue Department tax inventory and payroll-tax guidance so that the separate remuneration tax remains visible in every calculation result.

The packages use manual source maintenance. A source change does not alter an accepted model until its scope and effective date are reviewed and deterministic fixtures are updated.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This wave adds repository, API and manifest-driven calculator support. It does not by itself claim deployment or production acceptance.
