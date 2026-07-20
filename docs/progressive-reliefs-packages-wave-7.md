# Progressive-reliefs packages — wave 7

## Mauritius

TaxCraft implements Mauritius annual individual income tax and the Fair Share Contribution for income years 2025-26, 2026-27 and 2027-28.

The 2026-27 model is current. The 2025-26 model remains historical-supported, while 2027-28 is an enacted candidate year because the Fair Share Contribution applies through 30 June 2028.

## Inputs

- confirmation that the request is within the implemented Mauritius annual individual-tax scope;
- caller-confirmed annual chargeable income;
- caller-confirmed Fair Share Contribution Income Threshold;
- caller-confirmed Fair Share leviable income.

The calculator does not request a name, tax account number, national identity number, address, employer, citizenship, residence evidence, dividend payer or supporting document.

## Annual individual income tax

- first MUR 500,000 of chargeable income: 0%;
- next MUR 500,000: 10%;
- remainder: 20%.

Chargeable income must already reflect all applicable deductions, exemptions, reliefs and allowances. The package does not determine whether an individual is entitled to dependent deductions or other reliefs.

## Fair Share Contribution

An individual whose statutory Fair Share Contribution Income Threshold exceeds MUR 12 million is liable to an additional contribution of 15% on leviable income above MUR 12 million.

The package keeps the two statutory amounts separate:

- threshold income includes net income and included resident dividends;
- leviable income includes chargeable income and included resident dividends.

The caller must derive both amounts using the statutory inclusions and exclusions. TaxCraft validates that leviable income is not below chargeable income and that threshold income is not below leviable income.

Where threshold income does not exceed MUR 12 million, the Fair Share Contribution is zero. Where threshold income exceeds MUR 12 million but leviable income does not, the contribution also remains zero rather than being inferred from another amount.

## Output

The package returns:

- annual chargeable income;
- individual income tax;
- Fair Share threshold income;
- Fair Share leviable income;
- Fair Share Contribution;
- combined income tax and contribution;
- source-linked calculation lines;
- explicit assumptions and unsupported scope.

## Exclusions

The package does not derive gross income, net income, chargeable income, dividends or leviable income. It does not determine residence, source, exemptions, filing obligations or relief eligibility.

It also excludes:

- dependent deductions, interest relief, medical insurance relief and other allowances;
- cumulative PAYE calculations and pay-period withholding;
- employer remittance and director or board-member elections;
- social contributions and CSG or Revenue Minimum Garantie allowances;
- presumptive tax, tax deduction at source, penalties and interest;
- prior payments, filing balances and refunds.

## Sources and maintenance

The income-tax bands and PAYE scope are grounded in the Mauritius Revenue Authority PAYE guidance. The Fair Share Contribution threshold, rate, effective period, threshold-income definition and leviable-income definition are grounded in the MRA Fair Share Contribution guidance.

The package uses manual source maintenance. Changes to rates, thresholds, statutory definitions or the enacted end date require review and deterministic fixture updates before a model changes.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. It does not by itself claim public deployment or production acceptance.
