# Progressive-reliefs packages — wave 8

## Sri Lanka

TaxCraft implements Sri Lanka's standard individual taxable-income schedule for years of assessment 2024-25, 2025-26 and 2026-27.

The 2024-25 and 2025-26 models remain historical-supported. The 2026-27 model is current and carries forward the published 2025-26 standard individual bands because the June 2026 amendment notice changes capital-gains and administrative provisions without publishing a replacement standard individual table.

## Input

The package requires:

- confirmation that the request is within the standard individual taxable-income scope;
- caller-confirmed taxable income in Sri Lankan rupees.

Taxable income must already reflect all legally available personal, rental, solar-panel and other reliefs, deductions, exclusions and adjustments. The calculator does not request a name, tax identification number, address, employer, citizenship, residence evidence or supporting document.

## Year of assessment 2024-25

- first LKR 500,000: 6%;
- next LKR 500,000: 12%;
- next LKR 500,000: 18%;
- next LKR 500,000: 24%;
- next LKR 500,000: 30%;
- balance: 36%.

The published personal relief is not embedded in these bands. The caller must deduct any legally available relief before supplying taxable income.

## Years of assessment 2025-26 and 2026-27

- first LKR 1,000,000: 6%;
- next LKR 500,000: 18%;
- next LKR 500,000: 24%;
- next LKR 500,000: 30%;
- balance: 36%.

The 2026 amendment notice explicitly operates in the 2026-27 assessment year and revises capital-gains and administrative provisions. TaxCraft does not treat that notice as authority to alter the standard individual bands where no replacement standard table is published.

## Output

The package returns:

- taxable income;
- tax attributed to each applicable band;
- total standard individual income tax;
- assessment-year-specific official source references;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not calculate or determine:

- personal, rental, solar-panel or other reliefs;
- gains from realization of investment assets, including the 15% individual capital-gains rate effective 3 June 2026;
- concessionary or normal-rate terminal benefits;
- betting, gaming, liquor or tobacco business income subject to special rates;
- Advance Personal Income Tax withholding or payroll-period calculations;
- withholding tax, advance income tax or quarterly installments;
- filing balances, penalties, interest, prior payments or refunds;
- residence, citizenship, source, exemption or filing obligations.

## Sources and maintenance

The 2024-25 and 2025-26 bands come from their respective Inland Revenue Department tax charts. The current 2026-27 scope additionally cites the June 2026 amendment notice and the still-published 2025-26 APIT tables as continuity evidence.

The package uses manual source maintenance. A new standard-rate table, legislative amendment or IRD clarification must be reviewed before the current model changes. Capital-gains changes do not automatically alter this standard-income schedule.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
