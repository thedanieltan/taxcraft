# Simple-progressive packages — wave 9

## Botswana

TaxCraft implements Botswana resident and non-resident individual income tax for the maintained tax years:

- 2024-25;
- 2025-26;
- 2026-27.

The tax year runs from 1 July to 30 June. The calculator applies the Botswana Unified Revenue Service individual tables described as effective for 2011/12 and subsequent years.

### Inputs

- confirmation that the requested calculation is within the implemented individual-income-tax scope;
- the legally applicable resident or non-resident schedule;
- caller-confirmed annual taxable income in Botswana pula.

### Resident schedule

- first BWP 36,000: 0%;
- next BWP 36,000: 5%;
- next BWP 36,000: 12.5%;
- next BWP 36,000: 18.75%;
- excess above BWP 144,000: 25%.

### Non-resident schedule

- first BWP 72,000: 5%;
- next BWP 36,000: 12.5%;
- next BWP 36,000: 18.75%;
- excess above BWP 144,000: 25%.

### Output

The package returns:

- annual taxable income;
- tax attributed to each progressive band;
- total individual income tax;
- cited official sources;
- explicit assumptions and unsupported scope.

### Exclusions

The package does not determine taxable income, residence, source, filing obligations, deductions or eligibility. It also excludes PAYE reconciliation, prior payments, refunds, trusts, estates, and the separate tax table for net aggregate gains.

### Sources

The implementation is grounded in Botswana Unified Revenue Service material covering the individual rate tables for subsequent years and the July-to-June income-tax year.
