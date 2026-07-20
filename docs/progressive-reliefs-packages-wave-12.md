# Progressive-reliefs packages — wave 12

## Guyana

TaxCraft implements Guyana's ordinary annual individual income-tax rates for calendar year 2026.

Only 2026 is exposed. Historical years are not backfilled without accepted year-specific evidence.

## Input

The package requires:

- confirmation that the request is within the ordinary annual individual income-tax scope;
- caller-confirmed annual chargeable income in Guyana dollars.

Chargeable income must already reflect all legally applicable personal deductions, National Insurance deductions, allowances and exclusions. The calculator does not request a name, taxpayer identification number, address, employer, children, insurance policy, overtime records, second-job details or supporting documents.

## Annual chargeable-income rates

- first GYD 3,360,000 of chargeable income: 25%;
- chargeable income above GYD 3,360,000: 35%.

These rates apply to chargeable income, not gross income. TaxCraft therefore does not apply the personal deduction or other statutory deductions inside the rate engine.

## Caller-derived deductions

The 2026 authority notice identifies a number of deductions and exclusions that remain outside this package, including:

- the greater of GYD 1,680,000 or one-third of qualifying income as the personal deduction;
- National Insurance Scheme deductions;
- medical and life insurance premium deductions;
- child deductions;
- second-job deductions;
- overtime deductions.

Eligibility, limits, qualifying income, withholding exclusions and period apportionment must be resolved before supplying chargeable income.

## Output

The package returns:

- annual chargeable income;
- tax attributed to the 25% and 35% bands;
- total annual individual income tax;
- the current official source reference;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not calculate or determine:

- gross income, taxable income or chargeable income;
- statutory deductions, allowances or exemptions;
- daily, weekly, fortnightly, monthly or cumulative PAYE;
- employer or self-employed periodic computation worksheets;
- withholding tax or estimated payments;
- return balances, penalties, interest, prior payments or refunds;
- residence, source, exemption or filing obligations.

## Sources and maintenance

The 2026 rates, rate threshold and deduction framework are grounded in the Guyana Revenue Authority's revised personal allowance and deductions notice effective 1 January 2026.

The package uses manual source maintenance. A new annual allowance notice, rate amendment or Income Tax Act change must be reviewed before the supported year or rate parameters change.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
