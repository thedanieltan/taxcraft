# Global personal income tax roadmap

## Objective

TaxCraft will maintain a deterministic personal income tax calculator catalogue for every country and tax jurisdiction in its declared scope. Complexity controls implementation order, not inclusion.

The programme keeps TaxCraft stateless and non-advisory. Country packages calculate from structured, caller-confirmed tax facts, return a reconciled breakdown and identify unsupported components.

## Programme state

| Work package | Deliverable | State |
| --- | --- | --- |
| WP-PIT-01 | Canonical global jurisdiction register | Integrated |
| WP-PIT-02 | Global PIT rule map | 161 source-indexed; 86 in discovery |
| WP-PIT-03 | Shared PIT calculation primitives | Integrated |
| WP-PIT-04 | Standard PIT country-package contract | Integrated |
| WP-PIT-05 | Reconcile existing Singapore and United Kingdom packages | Integrated |
| WP-PIT-06 | Coverage catalogue API | Integrated |
| WP-PIT-07 | Manifest-driven global calculator interface | Branch implemented; acceptance pending |
| WP-PIT-08 | No-PIT jurisdiction packages | Planned |
| WP-PIT-09 | Flat-rate jurisdiction packages | Planned |
| WP-PIT-10 | Simple progressive jurisdiction packages | Planned |
| WP-PIT-11 | Progressive systems with deductions, credits and rebates | Planned |
| WP-PIT-12 | Household and filing-status systems | Planned |
| WP-PIT-13 | National, regional and municipal systems | Planned |
| WP-PIT-14 | Multi-schedule income systems | Planned |
| WP-PIT-15 | Complex composite PIT systems | Planned |
| WP-PIT-16 | Global source-maintenance consolidation | Planned |
| WP-PIT-17 | Global deployment and live acceptance | Planned |

## Scope model

`catalog/pit-jurisdictions.json` is the canonical implementation backlog. Its initial scope contains every ISO 3166-1 country or territory. Separate state, provincial, cantonal, regional and municipal tax jurisdictions will be represented as child jurisdiction records when their rule maps are added.

A jurisdiction remains in the catalogue throughout its lifecycle:

- `unmapped`
- `mapped`
- `not-started`
- `in-progress`
- `implemented`
- `deployed`
- `live-accepted`
- `maintenance-blocked`

Mapping status and implementation status are separate. A mapped jurisdiction may remain unimplemented, and an implemented package is not presented as deployed or live accepted.

## Mapping programme

`catalog/pit-rule-map.json` records the computational shape and implementation family before country-package work begins.

The current rule map contains all 249 registered jurisdictions:

- 2 implemented package mappings;
- 161 jurisdictions indexed from current global PIT summaries and assigned provisional calculation families;
- 86 jurisdictions retained explicitly for source discovery.

The global summaries are planning evidence only. The EY guide is used only for jurisdictions with full personal-tax chapters; contact-only listings are excluded. They do not supply calculator parameters. Enacted tax-year values, allowances, credits and examples continue to come from official publications when a package is implemented.

Each progressively enriched mapping records:

- tax-year basis and currency;
- individual, household or optional joint assessment;
- flat, progressive, alternative or category-specific schedules;
- standard deductions, allowances, credits, rebates, tapers and surtaxes;
- national, regional and local layers;
- required income categories and filing-status facts;
- rounding conventions;
- official authority and source locations;
- worked examples or other deterministic validation material.

## Implementation waves

1. No-PIT jurisdictions.
2. Flat-rate and flat-rate-with-allowance systems.
3. Simple progressive systems.
4. Progressive systems with deductions, credits, rebates or phase-outs.
5. Household and filing-status systems.
6. National plus regional or local systems.
7. Multi-schedule income systems.
8. Complex composite systems.

Countries are delivered in calculation-family work packages rather than one pull request per country. A work package includes package manifests, maintained tax-year models, official sources, calculation logic, boundary fixtures, API registration, calculator support and catalogue updates.

## Calculator contract

Every maintained PIT package declares `manifest.pit` under `taxcraft.pit-country-package.v1`.

The contract declares:

- tax unit and tax-year basis;
- supported currencies and income schedules;
- national, regional and local layers;
- required subdivision selection;
- a closed facts schema;
- rounding stages;
- source-maintenance mode.

The facts schema is executable. It rejects undeclared fields, missing facts, incompatible types, invalid enums, unsafe money values and identity-bearing field names while preserving established country-specific validation semantics. It is also the stable input description for the coverage API and manifest-driven calculator.

TaxCraft does not request names, identity numbers, addresses or tax documents. It does not infer residence or legal eligibility from personal circumstances.

## Shared calculation primitives

`@taxcraft/country-sdk` exports reusable deterministic operations for:

- exact rational rates and basis points;
- progressive bands;
- floor-zero deductions;
- stepped allowance tapers;
- refundable and non-refundable credits;
- capped rebates;
- alternative-tax comparisons;
- household quotients;
- category-specific schedules;
- national, regional and local layers;
- currency rounding, proration and annualisation.

Intermediate multiplication and division use `BigInt`. Public amounts remain safe integer minor units. Rounding is explicit per operation and supports floor, ceiling, truncation, half-up and half-even conventions.

Singapore and United Kingdom arithmetic use these shared primitives. Their existing country fixtures remain the behavioural-equivalence gate.

Country packages compose the primitives while retaining package-specific coverage, sources and fixtures.

## Coverage catalogue API

The build generates a filesystem-free `@taxcraft/catalog` ESM package from the validated JSON catalogues. The API exposes:

- global catalogue status and calculation families;
- all 249 registered jurisdictions;
- per-jurisdiction mapping, evidence and implementation metadata;
- implemented model coverage and official sources;
- executable per-model input schemas;
- a namespaced PIT calculation route.

Registered but unimplemented jurisdictions remain queryable as metadata and return an explicit `not_implemented` result from model-specific routes. Existing `/v1/jurisdictions` and `/v1/calculate` behaviour remains available for compatibility.

## Manifest-driven calculator

The reference interface consumes the global catalogue and package input schemas rather than embedding country-specific forms.

It:

1. lists every registered jurisdiction by implementation state;
2. shows provisional family or discovery metadata when no calculator exists;
3. loads supported tax years for implemented packages;
4. renders booleans, enums, subdivisions, integers and money fields from `factsSchema`;
5. converts major currency-unit entry to integer minor units;
6. submits through the namespaced PIT calculation route;
7. renders package-neutral totals, calculation lines, official sources, coverage and assumptions.

Adding an accepted package with a valid manifest makes its form available without editing the browser application.

## Validation

Every mapped package must retain the existing TaxCraft guarantees:

- deterministic repeated output;
- immutable requests;
- integer minor-unit money values;
- explicit unsupported results;
- PII-field rejection;
- complete source citations;
- reconciled calculation lines and totals;
- declared rounding;
- supported-version lifecycle enforcement.

The catalogue validators additionally check identity-code uniqueness, ordering, lifecycle consistency, rule-map coverage, per-source evidence, known calculation families and continued representation of existing packages.

## Source maintenance

Maintained packages continue to use official sources. Automated observations may produce a candidate only when independent extraction paths agree. Ambiguous or incomplete source changes leave accepted models unchanged.

Source automation is added by calculation family and source shape. Initial country implementation is not blocked when reliable source automation has not yet been developed; such packages remain manually maintained and their maintenance state is declared.

## Deployment states

Implementation, deployment and live acceptance remain distinct:

- `implemented`: repository checks pass for the package;
- `deployed`: the package is present in a public TaxCraft deployment;
- `live-accepted`: production health, privacy and deterministic calculation checks pass;
- `maintenance-blocked`: an accepted package remains available while a source update is blocked.

The programme proceeds in this order: complete the global register, map every PIT system, implement from the simplest calculation families through the most complex, consolidate maintenance, and complete global live acceptance.
