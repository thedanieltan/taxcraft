# Progressive-reliefs packages: wave 14

## Saint Lucia

Jurisdiction code: `LC`

Package: `@taxcraft/country-progressive-reliefs`

Maintained income year: `2026`

Currency: East Caribbean dollar (`XCD`)

## Supported calculation

The package calculates ordinary individual income tax on caller-confirmed annual chargeable income through XCD 30,000:

- first XCD 10,000 at 10%;
- next XCD 10,000 at 15%;
- next XCD 10,000 at 20%.

The caller must supply chargeable income after all legally applicable allowances, deductions and exemptions.

## Fail-closed boundary

The Inland Revenue Department page publishes a 30% band above XCD 30,000 with a fixed preceding tax amount of XCD 3,500. That amount does not reconcile with the preceding published bands, which produce XCD 4,500 at XCD 30,000.

TaxCraft does not select or repair either amount. Annual chargeable income above XCD 30,000 returns `facts.unsupported-scope` until authoritative material resolves the conflict.

## Excluded scope

The package does not calculate or infer:

- assessable income or chargeable-income derivation;
- personal, child, education, medical, insurance, mortgage, investment or other deductions;
- pension-income exemption eligibility;
- tax codes, PAYE tables or periodic withholding;
- National Insurance contributions;
- prior payments, filing balances, penalties, interest or refunds;
- residence, source, exemption or filing-obligation status.

## Sources

Primary rate source:

- Inland Revenue Department, Saint Lucia, `FAQs: Allowances and Deductions`.

Current-law continuity sources:

- Government of Saint Lucia, `Tax Code Updates Essential Following Announcement of Income Tax Changes`;
- Government of Saint Lucia, `Budget 2026/27: More Support for Families, More Space for Business, No New Taxes`.

The continuity sources support the current-year context but are not used to infer deductions or repair the conflicting upper-band fixed amount.

## Acceptance fixtures

Tests cover:

- zero chargeable income;
- the XCD 10,000, XCD 20,000 and XCD 30,000 boundaries;
- rejection immediately above XCD 30,000;
- package and catalogue registration;
- public input-schema and coverage endpoints;
- source attribution;
- unsupported-year rejection;
- identity-bearing fact rejection.

## Maintenance boundary

The package uses manual source maintenance. A future update may extend the calculator above XCD 30,000 only when an authoritative source publishes a reconciled upper-band formula or fixed amount. Allowance and deduction changes remain separate from the rate engine unless TaxCraft explicitly implements their eligibility rules.
