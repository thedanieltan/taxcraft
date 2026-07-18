# Progressive PIT packages with reliefs — wave 3

## Malaysia resident individual income tax

The Malaysia package calculates resident individual income tax for assessment years 2023, 2024 and 2025 from caller-confirmed chargeable income.

## Input contract

The caller supplies:

- confirmation that the resident individual tax table applies;
- chargeable income after applicable reliefs and deductions;
- whether the legally applicable separate-assessment RM400 individual rebate is claimed.

TaxCraft does not request names, identity numbers, marital status, spouse details or tax documents.

## Progressive schedule

The maintained schedule is:

- 0% through MYR 5,000;
- 1% through MYR 20,000;
- 3% through MYR 35,000;
- 6% through MYR 50,000;
- 11% through MYR 70,000;
- 19% through MYR 100,000;
- 25% through MYR 400,000;
- 26% through MYR 600,000;
- 28% through MYR 2,000,000;
- 30% above MYR 2,000,000.

## Individual rebate

The package can apply the MYR 400 separate-assessment individual rebate when chargeable income does not exceed MYR 35,000.

The rebate is non-refundable. It can reduce gross income tax to zero but cannot create a refund. A request to apply the rebate above the income ceiling is rejected as inconsistent rather than silently ignored.

## Output

The result reports:

- chargeable income;
- gross income tax before rebate;
- individual rebate available;
- individual rebate applied;
- net income tax.

## Exclusions

The package does not calculate or decide:

- chargeable income, deductions or tax-relief eligibility;
- joint assessment or spouse aggregation;
- spouse rebate, zakat, fitrah or departure-levy rebates;
- non-resident schedules or special income rates;
- monthly tax deductions, prior payments, refunds or filing obligations.

## Sources

The maintained model uses the Inland Revenue Board of Malaysia's official individual tax-rate, rebate and taxable-threshold guidance.
