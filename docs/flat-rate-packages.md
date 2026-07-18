# Flat-rate PIT packages — wave 1

TaxCraft implements four independently manifested personal income tax packages in `@taxcraft/country-flat-rate`. All packages are deterministic, stateless, non-advisory and retain only the current plus two preceding calendar-year models.

## Bulgaria

The Bulgaria package applies the statutory 10% rate to a caller-confirmed general annual tax base for 2024 through 2026.

The caller is responsible for supplying the base after compulsory social-security contributions, statutory expenses and applicable reliefs. Sole-trader income taxed at 15%, dividends, final-rate income and eligibility decisions remain outside coverage.

Official sources:

- Ministry of Finance, *Personal Income Taxes*;
- National Revenue Agency, *Advance income tax*.

## Estonia

The Estonia package calculates resident annual income tax for 2024 through 2026 from:

- annual income used for the overall basic-exemption test;
- taxable income before the overall basic exemption;
- caller-confirmed pensionable-age status.

For 2024 it applies the 20% rate and the income-dependent general basic exemption. For 2025 it applies the 22% rate with the same income-dependent exemption structure. For 2026 it applies the 22% rate and the fixed annual general exemption. The separately published annual pensionable-age exemption is supported for each maintained year.

Mandatory funded-pension and unemployment-insurance deductions, other incentives, income-category exemptions and foreign-tax credits remain outside coverage.

Official sources:

- Estonian Tax and Customs Board, *Tax rates*;
- Estonian Tax and Customs Board, *Calculation of basic exemption*.

## Hungary

The Hungary package applies the statutory 15% rate to a caller-confirmed consolidated tax base after applicable base allowances for 2024 through 2026.

TaxCraft does not determine eligibility for family, age, maternity, disability, first-marriage or other allowances. Separately taxed income and social contributions remain outside coverage.

Official sources:

- National Legislation Database, Act CXVII of 1995 on Personal Income Tax, Section 8;
- National Tax and Customs Administration, personal-income-tax base allowance materials.

## Romania

The Romania package applies the statutory general 10% rate to caller-confirmed taxable income for 2024 through 2026.

The caller must confirm that the income category is governed by the general rate and must derive the taxable amount under the relevant category rules. Special rates, exemptions and mandatory social contributions remain outside coverage.

Official sources:

- National Agency for Fiscal Administration, Fiscal Code, Article 64;
- National Agency for Fiscal Administration, 2026 income-tax and mandatory-contribution legislative updates.

## Shared boundaries

A TaxCraft result estimates personal income tax only for the declared package scope. It does not determine residence, income classification, filing obligations, social contributions, payroll withholding or foreign-tax relief. Inputs contain tax facts only and exclude names, identity numbers, addresses and tax documents.
