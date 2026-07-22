# Progressive-reliefs packages — wave 26

## Jersey

TaxCraft implements Jersey's year-of-assessment 2026 independent individual income tax using the statutory lower-of-two calculation.

### Supported calculation

The calculator compares:

- the standard calculation: 20% of income liable to Jersey tax after allowable expenses and approved pension contributions;
- the marginal-relief calculation: 26% of that post-deduction income above the caller-confirmed total exemption threshold.

The lower amount is returned as income tax. The difference between standard tax and the selected liability is exposed as the marginal income deduction.

The base 2026 low-income threshold is GBP 21,250. The caller may provide a higher total threshold where legally available additions apply.

### Required facts

- `scopeConfirmed`: confirms that the 2026 independent individual calculation applies;
- `liableIncomeAfterDeductionsPounds`: caller-confirmed liable income after expenses and approved pension contributions, in whole pounds;
- `totalExemptionThresholdPounds`: caller-confirmed total threshold, including any legally available additions, in whole pounds and not below GBP 21,250.

Whole-pound inputs ensure both the 20% and 26% calculations produce exact penny amounts without inventing an assessment-rounding rule.

### Explicit exclusions

The package does not calculate:

- gross income, expenses, pension limits or liable-income derivation;
- eligibility for child, additional-child, childcare, compensatory or other threshold additions;
- benefit-in-kind deductions or relief apportionment;
- long-term care and social-security contributions;
- non-resident exemptions or relief;
- ITIS effective rates, withholding, prior payments or assessment reconciliation;
- residence, source, income classification or filing obligations.

### Primary sources

- Revenue Jersey, 2026 tax allowances and reliefs;
- Revenue Jersey, marginal income deduction explained;
- Revenue Jersey, 2026 budget tax summary;
- Revenue Jersey, calculating your yearly tax assessment.

### Acceptance fixtures

The deterministic suite covers the base exemption threshold, marginal-relief liability, the exact crossover into the standard calculation, caller-confirmed threshold additions, source attribution, API discovery, schema exposure, sub-threshold rejection, exclusions, unsupported years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
