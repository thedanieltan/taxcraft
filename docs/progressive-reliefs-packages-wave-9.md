# Progressive-reliefs packages — wave 9

## Eswatini

TaxCraft implements Eswatini's normal annual individual income-tax schedule for the income year ended 30 June 2026 (`2025-26`).

Only this current income year is exposed. Historical years are not backfilled without accepted year-specific evidence.

## Inputs

- confirmation that the request is within the normal individual income-tax scope;
- standard or over-60 rebate schedule;
- caller-confirmed annual taxable income in lilangeni.

Taxable income must already reflect all legally applicable deductions, allowances and exclusions. The calculator does not request a name, taxpayer number, national identity number, address, employer, age or supporting document.

## Normal individual rates

- first SZL 100,000: 20%;
- amount above SZL 100,000 to SZL 150,000: 25%;
- amount above SZL 150,000 to SZL 200,000: 30%;
- amount above SZL 200,000: 33%.

The authority also states that normal individual rates become payable on amounts exceeding SZL 41,000. TaxCraft represents this through the gross 20% first band and the non-refundable SZL 8,200 standard rebate: 20% of SZL 41,000 equals the full rebate.

## Rebates

### Standard schedule

- annual rebate available: SZL 8,200.

### Over-60 schedule

- standard annual rebate: SZL 8,200;
- additional over-60 rebate: SZL 2,700;
- total available rebate: SZL 10,900.

Rebates are non-refundable. The amount applied cannot exceed gross income tax.

The caller selects the legally applicable rebate schedule. TaxCraft does not collect or infer age.

## Output

The package returns:

- annual taxable income;
- gross progressive income tax;
- available rebate;
- rebate applied;
- net individual income tax;
- source-linked calculation lines;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not calculate or determine:

- taxable income, employment benefits, deductions or allowances;
- redundant or retiring-person concessionary tax schedules;
- graded tax or social and mandatory contributions;
- monthly, weekly, daily or cumulative PAYE withholding;
- director, casual-worker, bonus, terminal-benefit or special payment treatment;
- withholding tax, provisional tax, prior payments or filing balances;
- penalties, interest or refunds;
- rebate eligibility, residence, source or filing obligations.

## Sources and maintenance

The rates, thresholds and rebates are grounded in the Eswatini Revenue Service rates-and-thresholds publication. The current-year scope is corroborated by the Revenue Service's 2026 PAYE computation tool and income-tax legislation index.

The package uses manual source maintenance. A new rate table, PAYE tool or legislative amendment must be reviewed before the supported year or parameters change.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
