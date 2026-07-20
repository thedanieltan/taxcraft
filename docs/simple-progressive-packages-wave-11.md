# Simple-progressive packages — wave 11

## Cambodia

TaxCraft implements selected Cambodia natural-person income-tax schedules for calendar years 2024, 2025 and 2026. The 2026 model is current; 2024 and 2025 remain historical-supported.

The package exposes three separate schedules:

- resident monthly taxable salary;
- non-resident monthly taxable salary;
- resident annual natural-person taxable income.

A non-resident annual taxable-income calculator is not inferred from these sources and remains unsupported.

## Inputs

- confirmation that the requested calculation is within the implemented Cambodia scope;
- the legally applicable tax schedule;
- caller-confirmed taxable salary or annual taxable income in Cambodian riel.

The calculator does not request a name, tax identification number, address, employer, nationality, residence evidence or supporting document.

## Resident monthly taxable salary

- KHR 0 to 1,500,000: 0%;
- amount above KHR 1,500,000 to 2,000,000: 5%;
- amount above KHR 2,000,000 to 8,500,000: 10%;
- amount above KHR 8,500,000 to 12,500,000: 15%;
- amount above KHR 12,500,000: 20%.

## Non-resident monthly taxable salary

- total taxable salary: 20%.

The package does not apply resident zero bands to the non-resident salary schedule.

## Resident annual natural-person taxable income

- KHR 0 to 18,000,000: 0%;
- amount above KHR 18,000,000 to 24,000,000: 5%;
- amount above KHR 24,000,000 to 102,000,000: 10%;
- amount above KHR 102,000,000 to 150,000,000: 15%;
- amount above KHR 150,000,000: 20%.

## Output

The package returns:

- taxable amount for the selected schedule;
- tax attributed to each applicable band;
- total income tax;
- schedule-specific official source references;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not derive taxable salary, taxable income, allowances, deductions or dependant relief. It does not determine residence, source, employee status or filing obligations.

It also excludes:

- employer withholding administration, payments and reconciliation;
- prior payments, refunds and filing balances;
- fringe-benefit tax;
- non-salary withholding taxes;
- non-resident annual taxable-income calculations;
- enterprise, legal-person and other business tax calculations.

## Sources and maintenance

The resident monthly and annual bands are grounded in the General Department of Taxation's 2024 sub-decree on monthly taxable salary and annual taxable income. The salary Prakas supports the salary-tax rules and separate non-resident treatment.

The package uses manual source maintenance. A source change does not alter an accepted model until the rule, scope and effective date are reviewed and deterministic boundary fixtures are updated.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
