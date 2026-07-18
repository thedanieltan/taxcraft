# Simple-progressive PIT packages — wave 1

TaxCraft implements three independently manifested personal income tax packages in `@taxcraft/country-simple-progressive`. All packages are deterministic, stateless, non-advisory and retain only the current plus two preceding tax-year models.

## New Zealand

The New Zealand package calculates basic yearly income tax on caller-confirmed total taxable income for tax years ending 31 March 2024, 2025 and 2026.

It includes the composite transition bands published for the year ending 31 March 2025 and the post-1 April 2025 bands for the year ending 31 March 2026. Income must be entered in whole New Zealand dollars, consistent with Inland Revenue's basic yearly tax calculation.

The result excludes tax credits, tax already deducted or paid, the ACC earners' levy, student loans, KiwiSaver and prescribed investor rate calculations.

Official sources:

- Inland Revenue, *Tax rates for individuals*;
- Inland Revenue, *Work out tax on your yearly income*.

## Paraguay

The Paraguay package calculates personal-services IRP from caller-confirmed gross and net Paraguayan-source personal-services income for calendar years 2024 through 2026.

It applies the official gross-income payment threshold of PYG 80,000,000. Above that threshold, net personal-services income is taxed progressively at 8% on the first PYG 50,000,000, 9% on the next PYG 100,000,000 and 10% on the remainder.

The package does not derive deductible expenses. Capital income and gains under the separate schedule, registration obligations, filing obligations and social-security contributions remain outside coverage. A zero payment result below the threshold does not imply that formal obligations are absent.

Official sources:

- Dirección Nacional de Ingresos Tributarios, *Impuesto a la Renta Personal*;
- Law No. 6380/2019, Article 69.

## Cyprus

The Cyprus package calculates individual income tax on caller-confirmed taxable income for calendar years 2024 through 2026.

It applies the pre-reform brackets for 2024 and 2025 and the Tax Reform 2026 brackets effective from 1 January 2026. The 2026 tax-free band is EUR 22,000, followed by bands at 20%, 25%, 30% and 35%.

Family, housing, green-investment and other deduction eligibility must be resolved before taxable income is supplied. Special Defence Contribution, General Healthcare System contributions, capital gains tax, residence and domicile determinations remain outside coverage.

Official sources:

- Cyprus Tax Department, individual income tax return and tax rates;
- Cyprus Tax Department, *Tax Reform 2026*.

## Shared boundaries

A TaxCraft result estimates personal income tax only for the declared package scope. It does not determine residence, source, filing obligations, social contributions, payroll withholding, relief eligibility or foreign-tax credits. Inputs contain tax facts only and exclude names, identity numbers, addresses and tax documents.
