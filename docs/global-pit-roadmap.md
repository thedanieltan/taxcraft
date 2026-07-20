# Global personal income tax roadmap

## Objective

TaxCraft is building a deterministic, stateless and non-advisory personal income tax calculator catalogue for every jurisdiction in its declared global scope. Complexity determines implementation order, not inclusion.

## Programme state

| Work package | Deliverable | State |
| --- | --- | --- |
| WP-PIT-01 | Canonical global jurisdiction register | Integrated |
| WP-PIT-02 | Global PIT rule map | 58 implemented; 106 source-indexed; 85 active discovery entries; all 249 structurally routed |
| WP-PIT-03 | Shared calculation primitives | Integrated |
| WP-PIT-04 | Country-package contract | Integrated |
| WP-PIT-05 | Singapore and UK reconciliation | Integrated |
| WP-PIT-06 | Global catalogue API | Integrated |
| WP-PIT-07 | Manifest-driven calculator interface | Integrated |
| WP-PIT-08 | No-PIT packages | Waves 1–3 integrated; source-indexed family complete |
| WP-PIT-09 | Flat-rate packages | Waves 1–2 integrated |
| WP-PIT-10 | Simple-progressive packages | Waves 1–11 integrated |
| WP-PIT-11 | Progressive systems with deductions and credits | Waves 1–12 integrated |
| WP-PIT-12 | Household and filing-status systems | Waves 1–2 integrated |
| WP-PIT-13 | Regional and municipal systems | Planned |
| WP-PIT-14 | Multi-schedule systems | Planned |
| WP-PIT-15 | Complex composite systems | Wave 1 integrated |
| WP-PIT-16 | Source-maintenance consolidation | Planned |
| WP-PIT-17 | Global deployment and live acceptance | Planned |

## Current coverage

The runtime catalogue contains all 249 ISO 3166-1 countries and territories:

- 58 implemented calculators;
- 106 source-indexed jurisdictions awaiting implementation;
- 85 jurisdictions awaiting accepted source evidence;
- a validated structural delivery route for every jurisdiction, including all 86 entries in the base discovery inventory.

The base discovery plan contains 45 direct calculators, 15 parent-system derivatives, 8 no-PIT verification cases, 7 no-resident territories, 10 restricted or disputed source cases, and Seychelles as an already accepted promotion.

Planning, source indexing, implementation, deployment and live acceptance remain separate states.

## Implemented calculators

Existing packages cover:

- Singapore and the United Kingdom;
- no-PIT scopes for the United Arab Emirates, Bahrain, Bermuda, Brunei Darussalam, Cayman Islands, Monaco, Oman, Qatar, Saudi Arabia, the British Virgin Islands, the Bahamas and Kuwait;
- flat-rate scopes for Bulgaria, Estonia, Hungary, Romania, Armenia, Georgia, Moldova, North Macedonia, Ukraine and Uzbekistan;
- simple-progressive scopes for New Zealand, Paraguay, Cyprus, Panama, Honduras, the Dominican Republic, Barbados, Seychelles, Trinidad and Tobago, Uganda, Guatemala, Rwanda, Australia, the Philippines, Thailand, Fiji, Botswana, Timor-Leste and Cambodia;
- progressive-reliefs scopes for Kenya, South Africa, Malaysia, the Czech Republic, Indonesia, Ghana, Mauritius, Sri Lanka, Eswatini, Jamaica, Lesotho and Guyana;
- complex-composite salaries-tax scope for Hong Kong;
- household and filing-status scopes for Ireland and Poland.

Country packages expose only rules supported by official sources and caller-confirmed tax facts. Unsupported relief eligibility, social contributions, filing decisions, residence determinations and income classifications remain explicit. Ghana additionally rejects resident income in the unresolved official overlap between its 30% band and 35% threshold. Mauritius calculates from caller-confirmed chargeable, Fair Share threshold and leviable income rather than inferring statutory deductions or dividend classifications. Sri Lanka calculates standard taxable income while keeping relief derivation, capital gains, terminal benefits, special-rate business income and APIT withholding outside scope. Eswatini implements only the current normal individual schedule and excludes redundant or retiring-person concessionary rates and PAYE-period calculations. Jamaica implements only calendar year 2026, preserves the expressly published combined pensioner-and-golden-age threshold, and excludes payroll contributions, credits and PAYE-period calculations. Lesotho implements only income year 2026-27, separates resident and non-resident schedules, and keeps chargeable-income derivation and periodic PAYE mechanics outside scope. Guyana implements only calendar year 2026 on caller-confirmed annual chargeable income and excludes personal, National Insurance, child, insurance, second-job and overtime deduction derivation.

## Delivery model

Countries are delivered in calculation-family work packages. Each package includes:

- maintained tax-year models;
- executable input schemas;
- official sources;
- deterministic calculations and breakdowns;
- boundary and privacy tests;
- API and calculator registration;
- catalogue implementation metadata;
- documented exclusions.

Accepted implementation metadata is composed from the ordered files listed in `catalog/pit-implementation-overlays.json`. Later work packages add independent overlays without rewriting earlier package records.

The remaining discovery inventory is governed by `catalog/pit-discovery-plan.json`. Its planning families and source plans determine research order but do not promote unverified law into the executable catalogue.

## Implementation waves

1. No-PIT jurisdictions.
2. Flat-rate and flat-rate-with-allowance systems.
3. Simple progressive systems.
4. Progressive systems with deductions, credits, rebates or phase-outs.
5. Household and filing-status systems.
6. National plus regional or local systems.
7. Multi-schedule income systems.
8. Complex composite systems.

## Package references

- `docs/global-pit-discovery-plan.md`
- `docs/no-pit-packages.md`
- `docs/no-pit-packages-wave-2.md`
- `docs/no-pit-packages-wave-3.md`
- `docs/flat-rate-packages.md`
- `docs/flat-rate-packages-wave-2.md`
- `docs/simple-progressive-packages.md`
- `docs/simple-progressive-packages-wave-2.md`
- `docs/simple-progressive-packages-wave-3.md`
- `docs/simple-progressive-packages-wave-4.md`
- `docs/simple-progressive-packages-wave-5.md`
- `docs/simple-progressive-packages-wave-6.md`
- `docs/simple-progressive-packages-wave-7.md`
- `docs/simple-progressive-packages-wave-8.md`
- `docs/simple-progressive-packages-wave-9.md`
- `docs/simple-progressive-packages-wave-10.md`
- `docs/simple-progressive-packages-wave-11.md`
- `docs/progressive-reliefs-packages.md`
- `docs/progressive-reliefs-packages-wave-2.md`
- `docs/progressive-reliefs-packages-wave-3.md`
- `docs/progressive-reliefs-packages-wave-4.md`
- `docs/progressive-reliefs-packages-wave-5.md`
- `docs/progressive-reliefs-packages-wave-6.md`
- `docs/progressive-reliefs-packages-wave-7.md`
- `docs/progressive-reliefs-packages-wave-8.md`
- `docs/progressive-reliefs-packages-wave-9.md`
- `docs/progressive-reliefs-packages-wave-10.md`
- `docs/progressive-reliefs-packages-wave-11.md`
- `docs/progressive-reliefs-packages-wave-12.md`
- `docs/complex-composite-packages.md`
- `docs/household-filing-packages.md`
- `docs/household-filing-packages-wave-2.md`
- `docs/pit-country-package-contract.md`
- `docs/pit-calculation-primitives.md`

## Product boundaries

TaxCraft does not request names, identity numbers, addresses or tax documents. It calculates from structured tax facts and does not infer residence or legal eligibility.

A package marked `implemented` has passed repository acceptance. It is marked `deployed` only when present in a public deployment and `live-accepted` only after production health, privacy and deterministic calculation checks pass.
