# Progressive PIT packages with reliefs — wave 4

## Czech Republic annual personal income tax

The Czech package calculates annual personal income tax for calendar years 2024, 2025 and 2026 from caller-confirmed reduced tax base.

## Input contract

The caller supplies:

- confirmation that the ordinary annual 15% and 23% rates apply;
- the reduced tax base after applicable deductions and non-taxable parts;
- whether to apply the standard CZK 30,840 basic taxpayer credit.

TaxCraft does not request names, identity numbers, family information or tax documents.

## Annual higher-rate thresholds

The 23% rate applies to the portion above:

- CZK 1,582,812 for 2024;
- CZK 1,676,052 for 2025;
- CZK 1,762,812 for 2026.

The portion through the applicable threshold is taxed at 15%.

## Statutory rounding sequence

The package preserves the annual calculation sequence:

1. reduce the supplied tax base down to whole hundreds of Czech koruna;
2. calculate the 15% and 23% band tax;
3. round gross tax up to a whole Czech koruna;
4. apply the selected basic taxpayer credit non-refundably.

The result reports the supplied and rounded tax bases, tax before and after whole-koruna rounding, credit available, credit applied and net income tax.

## Exclusions

The package does not calculate or decide:

- tax-base, deduction or non-taxable-part derivation;
- spouse, disability, student, child or other credits and bonuses;
- separate foreign-income tax bases or withholding schedules;
- social-security or health-insurance contributions;
- advance-payment reconciliation, refunds or filing obligations.

## Sources

The maintained models use official Financial Administration of the Czech Republic rate, threshold, credit and tax-system guidance for 2024 through 2026.
