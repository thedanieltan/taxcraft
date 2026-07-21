# Progressive-reliefs packages: wave 19

## Slovenia

Jurisdiction code: `SI`

Package: `@taxcraft/country-progressive-reliefs`

Maintained calendar year: `2026`

Currency: euro (`EUR`)

## Supported calculation

The package calculates annual income tax on caller-confirmed net annual tax base under the official 2026 scale:

- up to EUR 9,721.43 at 16%;
- next amount through EUR 28,592.44 at 26%;
- next amount through EUR 57,184.88 at 33%;
- next amount through EUR 82,346.23 at 39%;
- excess above EUR 82,346.23 at 50%.

Progressive-band arithmetic reproduces the official fixed transition amounts of EUR 1,555.43, EUR 6,461.89, EUR 15,897.40 and EUR 25,710.33.

## Input boundary

The caller supplies net annual tax base after all legally applicable allowances, deductions and losses. TaxCraft does not derive the tax base from gross or category income.

## Excluded scope

The package does not calculate or infer:

- the general allowance or additional general allowance formula;
- dependant, disability, pension, student or other personal allowances;
- social-security contributions;
- payroll advances or annual assessment reconciliation;
- capital, rental, interest, dividend, business or other final-tax schedules;
- foreign-tax or treaty relief;
- prior payments, penalties, interest or refunds.

## Sources

Primary source:

- Official Gazette of the Republic of Slovenia, `Rules on determination of allowances and tax scale for assessment of income tax for 2026`.

Supporting official sources:

- Financial Administration of the Republic of Slovenia, `Annual income tax assessment`;
- Government of Slovenia, `Taxes on income of natural and legal persons`.

The official-gazette regulation is the source of the executable thresholds and rates.

## Acceptance fixtures

Tests cover:

- zero net annual tax base;
- every official threshold and fixed-transition amount;
- the 50% top band;
- catalogue and API discovery;
- allowance and final-tax exclusions;
- official source attribution;
- unsupported-year rejection;
- identity-bearing fact rejection.

## Maintenance boundary

The package uses manual source maintenance. Each future calendar year requires the new official-gazette regulation. Allowance formulas and annual-assessment mechanics remain separate implementation scopes.
