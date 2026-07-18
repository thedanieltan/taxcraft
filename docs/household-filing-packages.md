# Household and filing-status PIT packages

## Ireland Income Tax and Universal Social Charge

The Ireland package calculates PAYE Income Tax and standard-rate Universal Social Charge for calendar years 2024, 2025 and 2026.

## Supported filing schedules

- single PAYE individual;
- married couple or civil partners with one PAYE income;
- married couple or civil partners with two PAYE incomes.

The selected schedule is a calculation fact. TaxCraft does not request names, marital records, PPS numbers or tax documents.

## Income Tax

Household taxable income is charged at 20% through the applicable standard-rate band and at 40% above it.

For 2024:

- single band: EUR 42,000;
- married or civil-partner base band: EUR 51,000;
- maximum second-income increase: EUR 33,000.

For 2025 and 2026:

- single band: EUR 44,000;
- married or civil-partner base band: EUR 53,000;
- maximum second-income increase: EUR 35,000.

For the two-income schedule, the caller supplies the legally applicable lower-earner income used for the band increase. The package caps that increase at the statutory maximum.

## Tax credits

The package applies:

- the single or married personal credit;
- one non-transferable Employee Tax Credit for each qualifying PAYE earner.

For 2024, the single personal and maximum employee credits are EUR 1,875 and the married personal credit is EUR 3,750.

For 2025 and 2026, the corresponding amounts are EUR 2,000 and EUR 4,000.

An Employee Tax Credit is capped at 20% of that individual's qualifying PAYE income when this is lower than the annual maximum. Credits are non-refundable.

## Universal Social Charge

USC is calculated for each individual separately. Income at or below EUR 13,000 is exempt; once income exceeds the threshold, standard USC applies to the full USC income through the year's bands.

The two individual USC results are then added to net household Income Tax. USC bands are not transferred or pooled between spouses or civil partners.

## Output

The result separately reports:

- household taxable income and standard-rate band;
- gross Income Tax;
- personal and employee credits available and applied;
- net Income Tax;
- each individual's USC income and USC;
- total USC;
- combined Income Tax and USC.

## Exclusions

The package does not calculate or decide:

- taxable income, pension relief or USC-income derivation;
- earned-income, age, child, home-carer, rent or other credits;
- reduced USC rates, USC surcharge or exempt-income classification;
- Pay Related Social Insurance;
- separate-assessment elections, marginal relief or filing status;
- withholding reconciliation, refunds or preliminary tax.

## Sources

The maintained models use official Revenue Commissioners rate-band, credit, Employee Tax Credit, USC-rate and USC-exemption guidance.
