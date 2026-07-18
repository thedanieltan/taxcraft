# Global personal income tax roadmap

## Objective

TaxCraft is building a deterministic, stateless and non-advisory personal income tax calculator catalogue for every jurisdiction in its declared global scope. Complexity determines implementation order, not inclusion.

## Programme state

| Work package | Deliverable | State |
| --- | --- | --- |
| WP-PIT-01 | Canonical global jurisdiction register | Integrated |
| WP-PIT-02 | Global PIT rule map | 33 implemented; 131 source-indexed; 85 in discovery |
| WP-PIT-03 | Shared calculation primitives | Integrated |
| WP-PIT-04 | Country-package contract | Integrated |
| WP-PIT-05 | Singapore and UK reconciliation | Integrated |
| WP-PIT-06 | Global catalogue API | Integrated |
| WP-PIT-07 | Manifest-driven calculator interface | Integrated |
| WP-PIT-08 | No-PIT packages | Integrated |
| WP-PIT-09 | Flat-rate packages | Waves 1–2 integrated |
| WP-PIT-10 | Simple-progressive packages | Waves 1–3 integrated; waves 4–5 implemented, acceptance pending |
| WP-PIT-11 | Progressive systems with deductions and credits | Wave 1 implemented, acceptance pending |
| WP-PIT-12 | Household and filing-status systems | Planned |
| WP-PIT-13 | Regional and municipal systems | Planned |
| WP-PIT-14 | Multi-schedule systems | Planned |
| WP-PIT-15 | Complex composite systems | Planned |
| WP-PIT-16 | Source-maintenance consolidation | Planned |
| WP-PIT-17 | Global deployment and live acceptance | Planned |

## Current coverage

The runtime catalogue contains all 249 ISO 3166-1 countries and territories:

- 33 implemented calculators;
- 131 source-indexed jurisdictions awaiting implementation;
- 85 jurisdictions awaiting source discovery.

Implementation, deployment and live acceptance remain separate states.

## Implemented calculators

Existing packages cover:

- Singapore and the United Kingdom;
- no-PIT scopes for the United Arab Emirates, Bahrain, Bermuda, Brunei Darussalam, Cayman Islands, Monaco, Oman and Qatar;
- flat-rate scopes for Bulgaria, Estonia, Hungary, Romania, Armenia, Georgia, Moldova, North Macedonia, Ukraine and Uzbekistan;
- simple-progressive scopes for New Zealand, Paraguay, Cyprus, Panama, Honduras, the Dominican Republic, Barbados, Seychelles, Trinidad and Tobago, Uganda, Guatemala and Rwanda;
- progressive-reliefs scope for Kenya.

Country packages expose only rules supported by official sources and caller-confirmed tax facts. Unsupported relief eligibility, social contributions, filing decisions, residence determinations and income classifications remain explicit.

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

- `docs/no-pit-packages.md`
- `docs/flat-rate-packages.md`
- `docs/flat-rate-packages-wave-2.md`
- `docs/simple-progressive-packages.md`
- `docs/simple-progressive-packages-wave-2.md`
- `docs/simple-progressive-packages-wave-3.md`
- `docs/simple-progressive-packages-wave-4.md`
- `docs/simple-progressive-packages-wave-5.md`
- `docs/progressive-reliefs-packages.md`
- `docs/pit-country-package-contract.md`
- `docs/pit-calculation-primitives.md`

## Product boundaries

TaxCraft does not request names, identity numbers, addresses or tax documents. It calculates from structured tax facts and does not infer residence or legal eligibility.

A package marked `implemented` has passed repository acceptance. It is marked `deployed` only when present in a public deployment and `live-accepted` only after production health, privacy and deterministic calculation checks pass.
