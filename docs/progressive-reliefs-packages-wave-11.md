# Progressive-reliefs packages — wave 11

## Lesotho

TaxCraft implements Lesotho's annual individual income-tax schedules for income year 2026-27.

Only this current income year is exposed. Historical years are not backfilled without accepted year-specific evidence.

## Inputs

- confirmation that the request is within the annual individual income-tax scope;
- resident or non-resident individual schedule;
- caller-confirmed annual chargeable income in loti.

Chargeable income must already reflect all legally applicable expenses, deductions, allowances and exclusions. The calculator does not request a name, tax identification number, address, employer, citizenship, residence evidence or supporting document.

## Resident schedule

- first LSL 77,760 of annual chargeable income: 20%;
- excess above LSL 77,760: 30%;
- non-refundable annual personal tax credit: LSL 12,240.

The credit cannot reduce income tax below zero. The credit produces an effective zero-tax threshold of LSL 61,200 because 20% of LSL 61,200 equals LSL 12,240.

## Non-resident schedule

- annual chargeable income: 25%;
- resident personal credit: not applied.

The caller selects the legally applicable schedule. TaxCraft does not infer residence or collect evidence of residence.

## Output

The package returns:

- annual chargeable income;
- gross individual income tax;
- available personal credit;
- personal credit applied;
- net individual income tax;
- source-linked calculation lines;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not calculate or determine:

- gross income, chargeable income, expenses, deductions or allowances;
- employment-benefit or fringe-benefit valuations;
- severance, redundancy, terminal-benefit or other special payment treatment;
- monthly, weekly, fortnightly or cumulative PAYE withholding;
- withholding tax or provisional tax;
- prior payments, filing balances, penalties, interest or refunds;
- personal-credit eligibility, residence, source or filing obligations.

## Sources and maintenance

The current resident bands, personal credit and non-resident rate are grounded in Revenue Services Lesotho's current income-tax guidance and its published 2026-27 tax table. The help-and-resources index confirms that the 2026-27 table is the current annual publication.

The package uses manual source maintenance. A new tax table, monetary-amount regulation or income-tax amendment must be reviewed before the supported year, bands or credit change.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
