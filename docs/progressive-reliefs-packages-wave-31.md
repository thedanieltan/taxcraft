# Progressive-reliefs packages — wave 31

## Egypt

TaxCraft implements Egypt's Article 8 individual income-tax matrix for calendar year 2026 on caller-confirmed annual net taxable income.

### Supported calculation

Article 8 does not use one continuous scale for every taxpayer. The available lower bands depend on total annual net income:

- up to EGP 600,000: 0% through EGP 40,000, then 10%, 15%, 20%, 22.5% and 25%;
- above EGP 600,000 through EGP 700,000: the 0% band is removed;
- above EGP 700,000 through EGP 800,000: the 0% and 10% bands are removed;
- above EGP 800,000 through EGP 900,000: the 0%, 10% and 15% bands are removed;
- above EGP 900,000 through EGP 1,200,000: income through EGP 400,000 is taxed at 22.5%, with the excess at 25%;
- above EGP 1,200,000: income through EGP 1,200,000 is taxed at 25%, with the excess at 27.5%.

Within the first matrix column, the rate transitions are EGP 40,000, 55,000, 70,000, 200,000 and 400,000. The law requires total annual net income to be rounded down to the nearest EGP 10 before the tax calculation. TaxCraft stores amounts in piastres and applies that floor before selecting and calculating the matrix column.

### Required facts

- `scopeConfirmed`: confirms that the ordinary Article 8 matrix applies;
- `netTaxableIncomeMinor`: caller-confirmed annual net taxable income after all legally applicable exemptions and deductions.

The supplied amount is also used to select the applicable Article 8 total-income column.

### Explicit exclusions

The package does not calculate:

- gross income, salary, business profit, expenses, deductions or net-taxable-income derivation;
- the EGP 20,000 salary personal exemption, social-insurance deductions or private-insurance deductions;
- payroll withholding, monthly apportionment, annual payroll reconciliation or employer administration;
- small-project turnover regimes, capital gains, dividends, real-estate or other separate and final-rate income;
- tax incentives, credits, foreign-tax or treaty relief, prior payments, penalties, interest or refunds;
- residence, source, income classification or filing-obligation determinations.

### Primary sources

- Egyptian Tax Authority, Law No. 7 of 2024 replacing Article 8 of the Income Tax Law;
- Egyptian Tax Authority, current 2026 payroll-tax FAQ confirming the EGP 20,000 salary personal exemption and the EGP 40,000 zero-rate band;
- Egyptian Tax Authority, official income-tax laws register.

### Acceptance fixtures

The deterministic suite covers every ordinary rate transition, both sides of each total-income column boundary, the statutory EGP 10 floor, source attribution, API discovery, schema exposure, exclusions, unsupported tax years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
