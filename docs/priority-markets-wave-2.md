# Priority-market PIT packages — wave 2

## Scope

This work package adds bounded 2026 PIT calculators for India, Canada, Japan, Spain and Italy. Every calculator accepts caller-confirmed tax bases and explicitly excludes identity, residency and taxable-income derivation.

## India — AY 2026-27

Supported:

- new-regime ordinary rates from nil through 30%;
- old-regime ordinary rates for an individual below age 60;
- resident section 87A rebate of up to INR 60,000 under the new regime when taxable income does not exceed INR 1.2 million;
- resident section 87A rebate of up to INR 12,500 under the supported old regime when taxable income does not exceed INR 500,000;
- 4% health and education cess after rebate.

Surcharge, marginal relief, special-rate income and final statutory rounding remain outside scope.

## Canada — calendar year 2026

Supported:

- federal marginal rates of 14%, 20.5%, 26%, 29% and 33%;
- Ontario marginal rates of 5.05%, 9.15%, 11.16%, 12.16% and 13.16%;
- separate caller-confirmed federal and Ontario taxable-income bases.

Credits, Ontario surtax, Ontario health premium, CPP and EI remain outside scope. Other provinces can be added later using the same federal-plus-province contract.

## Japan — calendar year 2026

Supported:

- national ordinary-income rates from 5% through 45%;
- taxable-income rounding down to JPY 1,000;
- 2.1% special income tax for reconstruction;
- combined-tax rounding down to JPY 100.

Local inhabitant tax, deductions, credits, separate taxation and the high-income minimum-tax addition remain outside scope.

## Spain — calendar year 2026

Supported:

- the state general-base scale from 9.5% through 24.5%;
- subtraction of the state-scale tax attributable to the caller-confirmed personal and family minimum portion.

The autonomous-community component, savings-income tax, deductions and credits remain outside scope.

## Italy — calendar year 2026

Supported:

- national IRPEF rates of 23% through EUR 28,000, 33% through EUR 50,000 and 43% above EUR 50,000;
- caller-confirmed regional and municipal addition bases and rates;
- separate national, regional and municipal result lines.

Location lookup, local exemptions, local progressive schedules, deductions and credits remain outside scope.

## Acceptance boundary

All schemas are closed, store no user PII and return source-linked deterministic lines. Implementation acceptance requires the complete repository checks, hardened container build and stateless service smoke test on the exact pull-request head. Deployment and live acceptance remain separate states.
