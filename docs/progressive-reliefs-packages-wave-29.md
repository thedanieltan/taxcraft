# Progressive-reliefs packages — wave 29

## Macao

TaxCraft implements Macao's ordinary professional-tax schedule for economic year 2026.

### Supported calculation

The calculator starts from caller-confirmed annual professional income after non-taxable items but before the standard exemption. It then applies:

- the 2026 standard exemption of MOP 144,000;
- 7% on the first MOP 20,000 above the exemption;
- 8% on the next MOP 20,000;
- 9% on the next MOP 40,000;
- 10% on the next MOP 80,000;
- 11% on the next MOP 120,000;
- 12% on the remaining amount;
- the 2026 budget deduction equal to 30% of assessed professional tax.

The progressive band result is rounded upward to a whole pataca to form the gross assessment. The 30% budget deduction is then calculated, and the final tax due is rounded upward to a whole pataca.

### Required facts

- `scopeConfirmed`: confirms that the ordinary professional-tax schedule and standard exemption apply;
- `annualProfessionalIncomeMinor`: caller-confirmed annual professional income after non-taxable items but before the standard MOP 144,000 exemption.

### Explicit exclusions

The package does not calculate:

- gross remuneration, non-taxable income, expenses or professional-income derivation;
- the enhanced exemption for a taxpayer over age 65 or with qualifying permanent disability;
- self-employed accounting profit or professional licence charges;
- withholding-period calculations, employer remittance, annual reconciliation or refunds;
- the separate 60% refund of professional tax paid for economic year 2024;
- foreign-tax relief, prior payments, penalties or interest;
- residence, source, taxpayer-group classification or filing obligations.

### Primary sources

- Macao Official Gazette, Law No. 13/2025, 2026 budget professional-tax exemption and deduction;
- Macao Official Gazette, Law No. 2/78/M, Professional Tax Regulation articles 7 and 8;
- Macao Financial Services Bureau, professional-tax rates and calculation overview.

### Acceptance fixtures

The deterministic suite covers zero income, the MOP 144,000 exemption boundary, all six progressive bands, the 30% budget deduction, whole-pataca upward rounding, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
