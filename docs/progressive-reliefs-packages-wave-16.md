# Progressive-reliefs packages: wave 16

## South Korea

Jurisdiction code: `KR`

Package: `@taxcraft/country-progressive-reliefs`

Maintained calendar year: `2026`

Currency: Korean won (`KRW`)

## Supported calculation

The package calculates two statutory layers on caller-confirmed resident global-income tax base:

1. national income tax under the eight Article 55 bands from 6% through 45%;
2. standard personal local income tax under the corresponding Article 92 bands from 0.6% through 4.5%.

The output exposes national, standard-local and combined tax totals separately.

## Standard-local confirmation

The Local Tax Act permits local governments to adjust the standard personal local income-tax rates by ordinance within the statutory range. TaxCraft does not infer the applicable municipality or ordinance.

The caller must confirm that the standard Article 92 rates apply. Jurisdiction-specific ordinance variations remain outside scope.

## Input boundary

The caller supplies resident global-income tax base after legally applicable necessary expenses and income deductions. TaxCraft does not derive the tax base from gross income or category-level income.

## Excluded scope

The package does not calculate or infer:

- gross income, necessary expenses, deductions or tax-base derivation;
- tax credits, exemptions, reductions or minimum tax;
- local ordinance variations;
- employment withholding, year-end settlement or interim payments;
- retirement, capital gains or other category-specific schedules;
- non-resident, foreign-worker flat-rate, treaty or foreign-tax-credit treatment;
- prior payments, penalties, interest or refunds.

## Sources

Primary statutory sources:

- Korea National Law Information Center, `Income Tax Act, Article 55 — Tax Rates`;
- Korea National Law Information Center, `Local Tax Act, Article 92 — Tax Rates`.

National and local calculation lines cite their respective statutes independently.

## Acceptance fixtures

Tests cover:

- zero tax base;
- every national threshold from KRW 14 million through KRW 1 billion;
- the 45% top national band;
- every corresponding standard-local band;
- separate statutory source attribution;
- catalogue and API discovery;
- required standard-local confirmation;
- unsupported-year rejection;
- identity-bearing fact rejection.

## Maintenance boundary

The package uses manual source maintenance. A future update must verify both statutes independently. Local ordinance variants require an explicit subdivision or municipality model and must not silently replace the standard rates.
