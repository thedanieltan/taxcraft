# Progressive PIT packages with reliefs — wave 2

## South Africa individual income tax

The South Africa package calculates annual individual income tax for tax years 2025, 2026 and 2027.

## Input contract

The caller supplies:

- confirmation that the ordinary South African individual tax table applies;
- annual taxable income after applicable deductions and exemptions;
- the legally applicable cumulative rebate schedule.

The rebate selector is calculation data only. TaxCraft does not request age, date of birth, identity numbers or tax documents.

## Tax years 2025 and 2026

The maintained bands are:

- 18% through ZAR 237,100;
- 26% through ZAR 370,500;
- 31% through ZAR 512,800;
- 36% through ZAR 673,000;
- 39% through ZAR 857,900;
- 41% through ZAR 1,817,000;
- 45% on the excess.

Rebates:

- primary: ZAR 17,235;
- secondary: an additional ZAR 9,444;
- tertiary: an additional ZAR 3,145.

## Tax year 2027

The inflation-adjusted bands are:

- 18% through ZAR 245,100;
- 26% through ZAR 383,100;
- 31% through ZAR 530,200;
- 36% through ZAR 695,800;
- 39% through ZAR 887,000;
- 41% through ZAR 1,878,600;
- 45% on the excess.

Rebates:

- primary: ZAR 17,820;
- secondary: an additional ZAR 9,765;
- tertiary: an additional ZAR 3,249.

## Rebate application

The package exposes three cumulative schedules:

- `primary`;
- `primary-secondary`;
- `primary-secondary-tertiary`.

The selected rebate is applied non-refundably. It can reduce gross tax to zero but cannot create a refund.

## Output

The result separately reports:

- taxable income;
- gross income tax before rebates;
- total rebate entitlement;
- rebate applied;
- net income tax.

## Exclusions

The package excludes:

- taxable-income and deduction derivation;
- medical scheme fees and additional medical expense tax credits;
- retirement contribution deductions and capital-gain inclusion;
- PAYE reconciliation, provisional tax and prior payments;
- rebate eligibility, residence, source and filing-obligation determinations.

## Sources

The maintained model uses SARS individual tax-rate tables, Budget 2026 guidance and the 2027 employer deduction tables.
