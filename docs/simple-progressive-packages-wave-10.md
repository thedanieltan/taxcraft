# Simple-progressive packages — wave 10

## Timor-Leste

TaxCraft implements Timor-Leste natural-person income tax for calendar years 2024, 2025 and 2026. The 2026 model is current; 2024 and 2025 remain historical-supported.

The package exposes separate monthly wage and annual taxable-income schedules. Each schedule requires the caller to select the legally applicable resident or non-resident treatment.

## Inputs

- confirmation that the requested calculation is within the implemented Timor-Leste natural-person scope;
- monthly wage or annual taxable-income schedule;
- resident or non-resident individual schedule;
- caller-confirmed taxable income for the selected period in US dollars.

The calculator does not request a name, tax identification number, address, employer, nationality or supporting document.

## Monthly wage-income schedule

### Resident individual

- first USD 500 per month: 0%;
- amount above USD 500 per month: 10%.

### Non-resident individual

- total taxable wages: 10% with no zero band.

## Annual natural-person schedule

### Resident individual

- first USD 6,000 per year: 0%;
- amount above USD 6,000 per year: 10%.

### Non-resident individual

- total annual taxable income: 10% with no zero band.

## Output

The package returns:

- taxable income for the selected period;
- tax attributed to each applicable band;
- total natural-person income tax;
- official source references;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not derive taxable wages, taxable income or deductible expenditure. It does not determine residence, source, filing obligations or whether a payment falls within wage income.

It also excludes:

- employer withholding administration and monthly payments;
- annual reconciliation, installments, prior payments and refunds;
- withholding tax on rent, royalties, prizes, services and other prescribed payments;
- legal-person, petroleum, mineral and other business tax calculations.

## Sources and maintenance

The implementation is grounded in Autoridade Tributária Timor-Leste guidance for Wage Income Tax and Annual Income Tax Returns. Both sources are attached to every calculation line because the package exposes both period bases through one input contract.

The package uses manual source maintenance. A source change does not alter an accepted model until the rule, scope and effective date are reviewed and deterministic boundary fixtures are updated.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
