# Progressive-reliefs packages — wave 13

## Liberia

TaxCraft implements Liberia's annual employee personal income-tax schedule for calendar year 2026.

Only 2026 is exposed. Historical years are not backfilled without accepted year-specific evidence.

## Input

The package requires:

- confirmation that the request is within the employee personal income-tax scope;
- caller-confirmed annual gross taxable employee income in Liberian dollars.

The taxable amount must already reflect any legally available exemption for qualifying non-cash benefits. The calculator does not request a name, tax identification number, address, employer, employment contract, benefit records or supporting documents.

## Annual employee PIT schedule

- first LRD 70,000: 0%;
- amount above LRD 70,000 through LRD 200,000: 5%;
- amount above LRD 200,000 through LRD 800,000: 15%;
- amount above LRD 800,000: 25%.

The marginal calculation reproduces the Revenue Authority's published fixed-tax transitions:

- at LRD 200,000, accumulated tax is LRD 6,500;
- at LRD 800,000, accumulated tax is LRD 96,500.

## Employee-only boundary

The Revenue Authority separately identifies contractor payments subject to a 10% flat withholding rate. That contractor schedule is not applied to employee remuneration and is outside this package.

The authority also identifies an annual exemption for qualifying non-cash employee benefits. TaxCraft does not value those benefits or determine whether the exemption applies. The caller must supply gross taxable employee income after that treatment.

## Output

The package returns:

- annual gross taxable employee income;
- tax attributed to each employee PIT band;
- total annual employee personal income tax;
- the official employee PIT source reference;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not calculate or determine:

- cash or non-cash employment-benefit valuation;
- the qualifying non-cash-benefit exemption;
- contractor withholding;
- board fees, services, rent, interest, dividends, royalties or other withholding schedules;
- business, presumptive, corporate, mining or petroleum income tax;
- monthly payroll withholding, employer remittance or annual reconciliation;
- gross-taxable-income derivation, residence, source, exemption or filing obligations;
- penalties, interest, prior payments or refunds.

## Sources and maintenance

The employee PIT bands, contractor boundary and non-cash-benefit treatment are grounded in the Liberia Revenue Authority's live domestic-tax education publication. The March 2026 Revenue Code amendment notice was reviewed as current-law context and does not publish a replacement employee PIT table.

Calculation lines cite only the employee PIT publication. The 2026 amendment notice remains package-level continuity evidence and is not presented as the source of the employee rates.

The package uses manual source maintenance. A new rate table, Revenue Code amendment or Revenue Authority clarification must be reviewed before the supported year or scope changes.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
