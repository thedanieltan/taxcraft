# Progressive-reliefs packages — wave 5

## Indonesia

TaxCraft implements resident individual income tax for calendar years 2024, 2025 and 2026.

### Inputs

The package accepts:

- caller confirmation that the ordinary resident annual PIT scope applies;
- a statutory non-taxable-income (PTKP) schedule selector;
- annual net income after deductions other than PTKP.

The schedule selector covers:

- individual taxpayers with zero to three dependants;
- married taxpayers with zero to three dependants;
- married taxpayers using the combined-spousal-income PTKP amount with zero to three dependants.

The selector is a calculation fact. TaxCraft does not request names, identity numbers, marital-status records or dependent details.

### Calculation

The package:

1. subtracts the selected PTKP amount from annual net income;
2. floors taxable income to the nearest IDR 1,000;
3. applies the ordinary progressive bands:
   - 5% through IDR 60 million;
   - 15% through IDR 250 million;
   - 25% through IDR 500 million;
   - 30% through IDR 5 billion;
   - 35% above IDR 5 billion.

### Exclusions

The package does not determine:

- annual net income or deductible expenses;
- legal eligibility for a PTKP schedule;
- residence, source or dependent classification;
- separate-spouse elections or allocation of combined income;
- final-tax, deemed-profit, micro-enterprise or other category-specific regimes;
- withholding credits, instalments, prior payments, refunds or filing balances.

### Sources

The package is grounded in official material from Indonesia's Directorate General of Taxes, including its individual-income-tax calculation guidance and the Tax Harmonisation Law framework.

Implementation, deployment and live acceptance remain separate states.
