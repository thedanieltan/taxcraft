# Progressive-reliefs packages — wave 28

## Brazil

TaxCraft implements Brazil's annual individual income-tax incidence table for calendar-year 2025, filed in exercise 2026.

### Supported calculation

The calculator applies the Federal Revenue Service's official annual rate-and-deduction table to a caller-confirmed annual tax base:

| Annual tax base | Rate | Official deduction |
| ---: | ---: | ---: |
| Through BRL 28,467.20 | 0% | BRL 0 |
| BRL 28,467.21–33,919.80 | 7.5% | BRL 2,135.04 |
| BRL 33,919.81–45,012.60 | 15% | BRL 4,679.03 |
| BRL 45,012.61–55,976.16 | 22.5% | BRL 8,054.97 |
| Above BRL 55,976.16 | 27.5% | BRL 10,853.78 |

Tax is calculated as the selected rate multiplied by the full annual tax base, less the official deduction for that band. Amounts are represented in centavos and the rate calculation is rounded half-up to the nearest centavo.

The published deduction amounts create cent-level behavior at adjacent band boundaries. TaxCraft preserves the official table rather than smoothing those transitions with reconstructed progressive-band arithmetic.

### Required facts

- `scopeConfirmed`: confirms that the exercise-2026 annual-adjustment table applies;
- `annualTaxBaseMinor`: caller-confirmed calendar-year 2025 annual tax base after legally applicable deductions.

The result is annual tariff tax before credits and tax already paid during the year.

### Explicit exclusions

The package does not calculate:

- gross income, exempt income or annual tax-base derivation;
- social-security, dependant, education, medical, alimony or other deduction eligibility;
- the annual simplified-discount election or its BRL 16,754.34 limit;
- monthly withholding, payroll reconciliation or tax paid during the year;
- capital income, fixed-income products, funds, equities, profit sharing, prizes or foreign remittances;
- tax credits, foreign-tax relief, prior payments, penalties, interest or refunds;
- residence, source, income classification or filing obligations.

### Primary sources

- Federal Revenue Service of Brazil, 2025 taxation tables and annual incidence from exercise 2026;
- Federal Revenue Service of Brazil, individual income-tax tables index;
- Federal Revenue Service of Brazil, explanation of calendar year and filing exercise.

### Acceptance fixtures

The deterministic suite covers zero and exempt bases, both sides of every cent-level band transition, a top-band calculation, source attribution, API discovery, schema exposure, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
