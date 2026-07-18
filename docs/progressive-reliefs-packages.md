# Progressive PIT packages with reliefs

## Kenya employment income tax

The Kenya package is the first TaxCraft calculator in the `PROGRESSIVE_RELIEFS` family.

### Input contract

The caller supplies:

- confirmation that ordinary Kenya employment-income-tax treatment applies;
- a monthly or annual income period;
- the legally applicable resident or non-resident individual schedule;
- taxable employment income after allowable deductions.

No identity, tax number, employer record or supporting document is requested.

### Rate schedule

Annual bands:

- 10% on the first KES 288,000;
- 25% on the next KES 100,000;
- 30% on the next KES 5,612,000;
- 32.5% on the next KES 3,600,000;
- 35% on income above KES 9,600,000.

Monthly bands:

- 10% on the first KES 24,000;
- 25% on the next KES 8,333;
- 30% on the next KES 467,667;
- 32.5% on the next KES 300,000;
- 35% on income above KES 800,000.

### Standard personal relief

The package applies the standard personal relief non-refundably for the resident schedule:

- KES 2,400 per month;
- KES 28,800 per year.

The relief is capped at gross income tax. It can reduce tax to zero but cannot create a refund. No standard personal relief is applied under the non-resident schedule.

### Output

The result separately reports:

- taxable employment income;
- gross income tax before relief;
- personal relief available;
- personal relief applied;
- net income tax.

Calculation lines reconcile the progressive-band tax and the negative relief line to net income tax.

### Exclusions

The package does not calculate or decide:

- taxable-income and deduction eligibility;
- insurance relief or disability exemptions;
- Affordable Housing Levy, Social Health Insurance Fund or pension contributions;
- withholding reconciliation, prior payments or refunds;
- residence, source or filing obligations.

### Sources

The maintained model uses Kenya Revenue Authority PAYE and individual-income-tax guidance, the 2024 PAYE amendment notice and the 2025 employer relief and exemption guidance.
