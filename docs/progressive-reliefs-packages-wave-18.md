# Progressive-reliefs packages: wave 18

## Tunisia

Jurisdiction code: `TN`

Package: `@taxcraft/country-progressive-reliefs`

Maintained calendar year: `2026`

Currency: Tunisian dinar (`TND`), represented in millimes

## Supported calculation

The package calculates ordinary individual income tax on caller-confirmed annual net taxable income:

- first TND 5,000 at 0%;
- next TND 15,000 at 26%;
- next TND 10,000 at 28%;
- next TND 20,000 at 32%;
- excess above TND 50,000 at 35%.

## Input boundary

The caller supplies annual net taxable income after legally applicable common and category deductions. TaxCraft does not derive the amount from gross or category income.

Amounts use the Tunisian dinar's millime minor unit.

## Excluded scope

The package does not calculate or infer:

- allowances, family deductions or net-taxable-income derivation;
- the separate social solidarity contribution;
- minimum tax based on turnover or gross receipts;
- withholding, advances, provisional instalments or return reconciliation;
- category-specific, presumptive, export, non-resident or final-tax schedules;
- foreign-tax or treaty relief;
- prior payments, penalties, interest or refunds.

## Sources

Primary and continuity sources:

- Ministry of Finance of Tunisia, Arabic general overview and IRPP scale;
- Ministry of Finance of Tunisia, French tax-system overview and IRPP scale;
- Ministry of Finance of Tunisia, Finance Law for 2026.

The ordinary IRPP rate table is the source of the executable bands. The Finance Law establishes the current-year context but is not used to infer deductions or separate contributions.

## Acceptance fixtures

Tests cover:

- zero net taxable income;
- each threshold from TND 5,000 through TND 50,000;
- the 35% top band;
- millime-denominated outputs;
- catalogue and API discovery;
- separate-levy exclusions;
- source attribution;
- unsupported-year rejection;
- identity-bearing fact rejection.

## Maintenance boundary

The package uses manual source maintenance. Future updates must verify the ordinary IRPP scale separately from the solidarity contribution, minimum tax, deductions and withholding rules. Separate levies must not be silently folded into the ordinary income-tax total.
