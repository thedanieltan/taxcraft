# Progressive-reliefs packages — wave 10

## Jamaica

TaxCraft implements Jamaica's ordinary individual aggregate-income tax for calendar year 2026.

Only 2026 is exposed. Historical years are not backfilled without accepted year-specific evidence.

## Inputs

- confirmation that the request is within the ordinary individual aggregate-income scope;
- the legally applicable exemption schedule;
- caller-confirmed calendar-year aggregate income in Jamaican dollars.

Aggregate income must already reflect all legally applicable expenses, losses, deductions and exclusions. The calculator does not request a name, taxpayer registration number, national identity number, address, employer, date of birth, pension records or supporting document.

## Standard 2026 threshold and rates

The effective tax-free threshold for the full 2026 calendar year is JMD 1,876,614.

- aggregate income up to the applicable threshold: 0%;
- amount above the threshold through JMD 6,000,000: 25%;
- amount above JMD 6,000,000: 30%.

The threshold increase took effect during 2026. TaxCraft uses the authority's published effective full-calendar-year amount rather than applying the later annualized threshold to all twelve months.

## Exemption schedules

### Standard

- applicable threshold: JMD 1,876,614.

### Pensioner

- standard threshold plus published pensioner exemption;
- applicable threshold: JMD 2,126,654.

### Golden age

- standard threshold plus published age-65 exemption;
- applicable threshold: JMD 2,126,654.

### Pensioner and golden age

- expressly published combined threshold: JMD 2,376,654.

The two separately stated additional exemptions are JMD 250,040 each. Adding both to the standard threshold arithmetically would produce JMD 2,376,694, which differs by JMD 40 from the authority's expressly published combined figure. TaxCraft preserves the published combined threshold and does not silently correct the source.

## Output

The package returns:

- aggregate income;
- the applicable exemption threshold;
- tax attributed to each rate band;
- total ordinary individual income tax;
- source-linked calculation lines;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not calculate or determine:

- statutory income, aggregate income, expenses, losses or deductions;
- pensioner, approved-pension or age-65 eligibility;
- reverse tax credits or other credits;
- disaster-relief honoraria and other source-specific exemptions;
- periodic or cumulative PAYE withholding;
- employer payroll adjustments;
- National Insurance Scheme, National Housing Trust, Education Tax or other payroll contributions;
- estimated tax, quarterly payments or filing balances;
- penalties, interest, prior payments or refunds;
- residence, source or filing obligations.

## Sources and maintenance

The 2026 effective threshold and exemption schedules are grounded in Tax Administration Jamaica's official announcement through the Jamaica Information Service. The 25% and 30% ordinary rates are grounded in the official tax-administration rate explanation. The Ministry of Finance 2026-27 revenue measures were reviewed for continuity and do not publish replacement ordinary individual rates.

The package uses manual source maintenance. A new threshold, rate, exemption clarification or combined-threshold correction must be reviewed before the current model changes.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
