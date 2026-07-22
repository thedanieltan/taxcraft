# Global personal income tax roadmap

## Objective

TaxCraft is building a deterministic, stateless and non-advisory personal income tax calculator catalogue for every jurisdiction in its declared global scope. Complexity determines implementation order, not inclusion.

## Programme state

| Work package | Deliverable | State |
| --- | --- | --- |
| WP-PIT-01 | Canonical global jurisdiction register | Integrated |
| WP-PIT-02 | Global PIT rule map | 82 implemented; 83 source-indexed; 84 active discovery entries; all 249 structurally routed |
| WP-PIT-03 | Shared calculation primitives | Integrated |
| WP-PIT-04 | Country-package contract | Integrated |
| WP-PIT-05 | Singapore and UK reconciliation | Integrated |
| WP-PIT-06 | Global catalogue API | Integrated |
| WP-PIT-07 | Manifest-driven calculator interface | Integrated |
| WP-PIT-08 | No-PIT packages | Waves 1–3 integrated; source-indexed family complete |
| WP-PIT-09 | Flat-rate packages | Waves 1–2 integrated |
| WP-PIT-10 | Simple-progressive packages | Waves 1–13 integrated |
| WP-PIT-11 | Progressive systems with deductions and credits | Waves 1–29 integrated |
| WP-PIT-12 | Household and filing-status systems | Waves 1–6 integrated |
| WP-PIT-13 | Regional and municipal systems | Planned |
| WP-PIT-14 | Multi-schedule systems | Planned |
| WP-PIT-15 | Complex composite systems | Wave 1 integrated |
| WP-PIT-16 | Source-maintenance consolidation | Planned |
| WP-PIT-17 | Global deployment and live acceptance | Planned |

## Current coverage

The runtime catalogue contains all 249 ISO 3166-1 countries and territories:

- 82 implemented calculators;
- 83 source-indexed jurisdictions awaiting implementation;
- 84 jurisdictions awaiting accepted source evidence;
- a validated structural delivery route for every jurisdiction, including all 86 entries in the base discovery inventory.

The base discovery plan contains 44 direct calculators, 15 parent-system derivatives, 8 no-PIT verification cases, 7 no-resident territories, 10 restricted or disputed source cases, and two already accepted promotions: Seychelles and Andorra.

Planning, source indexing, implementation, deployment and live acceptance remain separate states.

## Implemented calculators

Existing packages cover:

- Singapore and the United Kingdom;
- no-PIT scopes for the United Arab Emirates, Bahrain, Bermuda, Brunei Darussalam, Cayman Islands, Monaco, Oman, Qatar, Saudi Arabia, the British Virgin Islands, the Bahamas and Kuwait;
- flat-rate scopes for Bulgaria, Estonia, Hungary, Romania, Armenia, Georgia, Moldova, North Macedonia, Ukraine and Uzbekistan;
- simple-progressive scopes for New Zealand, Paraguay, Cyprus, Panama, Honduras, the Dominican Republic, Barbados, Seychelles, Trinidad and Tobago, Uganda, Guatemala, Rwanda, Australia, the Philippines, Thailand, Fiji, Botswana, Timor-Leste, Cambodia, Andorra and Zambia;
- progressive-reliefs scopes for Kenya, South Africa, Malaysia, the Czech Republic, Indonesia, Ghana, Mauritius, Sri Lanka, Eswatini, Jamaica, Lesotho, Guyana, Liberia, Saint Lucia, Namibia, South Korea, Kazakhstan, Tunisia, Slovenia, Slovakia, Austria, Türkiye, Peru, Colombia, Greece, Jordan, Jersey, Ecuador, Brazil and Macao;
- complex-composite salaries-tax scope for Hong Kong;
- household and filing-status scopes for Ireland, Poland, Malta, Portugal, Germany and the Isle of Man.

Country packages expose only rules supported by official sources and caller-confirmed tax facts. Unsupported relief eligibility, social contributions, filing decisions, residence determinations and income classifications remain explicit. Andorra calculates the 2026 standard resident general-income schedule using the EUR 24,000 personal minimum and published effective 0%, 5% and 10% bands while excluding enhanced personal minima, family reductions, savings-base income and tax deductions. Zambia calculates the 2026 ordinary annual individual schedule from caller-confirmed taxable income using the ZMW 61,200 tax-free threshold and 20%, 30% and 37% marginal bands, while excluding taxable-income derivation, statutory contributions, PAYE administration and special tax regimes. Ecuador calculates fiscal-year 2025 general-regime tax from caller-confirmed taxable base using the official fixed tax at every basic-fraction transition, while excluding the personal-expense rebate, RIMPE, special exemptions, inheritance tax and return reconciliation. Brazil calculates exercise-2026 annual-adjustment IRPF from caller-confirmed calendar-year 2025 tax base using the official rate-and-deduction table, while excluding deduction eligibility, the simplified-discount election, monthly withholding, separate investment schedules, credits and prior payments. Macao calculates economic-year 2026 ordinary professional tax from caller-confirmed annual professional income before the MOP 144,000 standard exemption, applies the progressive 7% to 12% bands, the 30% budget deduction and whole-pataca rounding, and excludes enhanced exemptions, withholding administration and the separate 2024 tax-refund programme. Ghana additionally rejects resident income in the unresolved official overlap between its 30% band and 35% threshold. Mauritius calculates from caller-confirmed chargeable, Fair Share threshold and leviable income rather than inferring statutory deductions or dividend classifications. Sri Lanka calculates standard taxable income while keeping relief derivation, capital gains, terminal benefits, special-rate business income and APIT withholding outside scope. Eswatini implements only the current normal individual schedule and excludes redundant or retiring-person concessionary rates and PAYE-period calculations. Jamaica implements only calendar year 2026, preserves the expressly published combined pensioner-and-golden-age threshold, and excludes payroll contributions, credits and PAYE-period calculations. Lesotho implements only income year 2026-27, separates resident and non-resident schedules, and keeps chargeable-income derivation and periodic PAYE mechanics outside scope. Guyana implements only calendar year 2026 on caller-confirmed annual chargeable income and excludes personal, National Insurance, child, insurance, second-job and overtime deduction derivation. Liberia implements only employee personal income tax for calendar year 2026 and excludes contractor withholding, non-cash-benefit valuation and employer periodic withholding mechanics. Saint Lucia calculates only the unambiguous 10%, 15% and 20% bands through XCD 30,000 and rejects the conflicting published upper-band scope. Namibia calculates individual normal tax for assessment years 2025 through 2027 from caller-confirmed annual taxable income under the enacted Schedule 4 bands and excludes taxable-income derivation and employee-tax administration. South Korea calculates 2026 national and standard personal local income tax separately on caller-confirmed resident global-income tax base while excluding local ordinance variations, deductions and credits. Kazakhstan calculates the 2026 general Article 363 schedule on caller-confirmed taxable income using the KZT 4,325 monthly calculation index while excluding deduction derivation and special-category schedules. Tunisia calculates 2026 ordinary IRPP on caller-confirmed annual net taxable income in millimes while excluding the solidarity contribution, minimum tax, deductions and payment mechanics. Slovenia calculates ordinary 2026 annual income tax on caller-confirmed net annual tax base under the official five-band scale while excluding allowance derivation, dependants, social contributions, payroll advances and final-tax income. Slovakia calculates ordinary 2026 section 4(1)(a) income tax on caller-confirmed annual tax base under the official four-band scale while excluding allowance derivation, business-income schedules, contributions and payroll reconciliation. Austria calculates the 2026 ordinary annual tariff tax on caller-confirmed taxable income under the official seven-band schedule while excluding tax credits, special-rate income, social insurance and withholding reconciliation. Türkiye calculates the 2026 general and wage annual tariffs on caller-confirmed taxable income under separate five-band schedules while excluding exemptions, deductions, withholding and category-specific income. Peru calculates the 2026 work-income scale on caller-confirmed net taxable work and qualifying foreign income using the official PEN 5,500 UIT while excluding deduction derivation, capital and business schedules, and return reconciliation. Colombia calculates the 2026 resident article 241 schedule from a caller-confirmed base in 1/10,000 UVT, preserves the statutory fixed UVT offsets and converts the result using the COP 52,374 UVT while excluding peso-base conversion, cedular derivation and filing-form rounding. Greece calculates 2026 employment, pension and business-profit tariffs from caller-confirmed taxable income, age band and eligible dependent-child count, including the non-refundable Article 16 employment and pension reduction and statutory taper while excluding presumptive business income, mixed-schedule allocation and separate investment or property schedules. Jordan calculates the 2026 ordinary natural-person schedule on caller-confirmed taxable income, reports the six-band income tax separately from the 1% national contribution on income above JOD 200,000, and excludes exemption derivation, special-income schedules and return reconciliation. Jersey calculates the lower of the 20% standard method and 26% marginal-relief method from caller-confirmed post-deduction income and total exemption threshold, while excluding relief eligibility, LTC, ITIS and residence determinations. Malta calculates ordinary 2026 tax under seven caller-selected single, married and parent schedules while keeping eligibility, special regimes and social-security contributions outside scope. Portugal calculates 2026 general IRS and the additional solidarity rate for separate or joint assessment, uses the statutory joint divisor of two, and excludes deductions from collection, minimum-existence rules, special-rate income and filing eligibility. Germany calculates the 2026 section 32a tariff for individual assessment and statutory spouse splitting, floors taxable income and final tariff tax to whole euro as required by law, and excludes solidarity surcharge, church tax, child comparison and special-rate income. The Isle of Man calculates 2026-27 resident individual and joint income tax using the published personal allowances, GBP 1-for-GBP 2 allowance taper, 10% standard bands and 21% higher rate, while excluding allowance eligibility, non-resident tax, tax-cap elections and National Insurance.

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
- `docs/simple-progressive-packages-wave-12.md`
- `docs/simple-progressive-packages-wave-13.md`
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
- `docs/progressive-reliefs-packages-wave-13.md`
- `docs/progressive-reliefs-packages-wave-14.md`
- `docs/progressive-reliefs-packages-wave-15.md`
- `docs/progressive-reliefs-packages-wave-16.md`
- `docs/progressive-reliefs-packages-wave-17.md`
- `docs/progressive-reliefs-packages-wave-18.md`
- `docs/progressive-reliefs-packages-wave-19.md`
- `docs/progressive-reliefs-packages-wave-20.md`
- `docs/progressive-reliefs-packages-wave-21.md`
- `docs/progressive-reliefs-packages-wave-22.md`
- `docs/progressive-reliefs-packages-wave-23.md`
- `docs/progressive-reliefs-packages-wave-24.md`
- `docs/progressive-reliefs-packages-wave-25.md`
- `docs/progressive-reliefs-packages-wave-26.md`
- `docs/progressive-reliefs-packages-wave-27.md`
- `docs/progressive-reliefs-packages-wave-28.md`
- `docs/progressive-reliefs-packages-wave-29.md`
- `docs/complex-composite-packages.md`
- `docs/household-filing-packages.md`
- `docs/household-filing-packages-wave-2.md`
- `docs/household-filing-packages-wave-3.md`
- `docs/household-filing-packages-wave-4.md`
- `docs/household-filing-packages-wave-5.md`
- `docs/household-filing-packages-wave-6.md`
- `docs/pit-country-package-contract.md`
- `docs/pit-calculation-primitives.md`

## Product boundaries

TaxCraft does not request names, identity numbers, addresses or tax documents. It calculates from structured tax facts and does not infer residence or legal eligibility.

A package marked `implemented` has passed repository acceptance. It is marked `deployed` only when present in a public deployment and `live-accepted` only after production health, privacy and deterministic calculation checks pass.
