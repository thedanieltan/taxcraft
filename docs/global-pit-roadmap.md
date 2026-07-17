# Global personal income tax roadmap

## Objective

TaxCraft will maintain a deterministic personal income tax calculator catalogue for every country and tax jurisdiction in its declared scope. Complexity controls implementation order, not inclusion.

The programme keeps TaxCraft stateless and non-advisory. Country packages calculate from structured, caller-confirmed tax facts, return a reconciled breakdown and identify unsupported components.

## Programme state

| Work package | Deliverable | State |
| --- | --- | --- |
| WP-PIT-01 | Canonical global jurisdiction register | Implemented |
| WP-PIT-02 | Global PIT rule map | In progress |
| WP-PIT-03 | Shared PIT calculation primitives | Planned |
| WP-PIT-04 | Standard PIT country-package contract | Planned |
| WP-PIT-05 | Reconcile existing Singapore and United Kingdom packages | Planned |
| WP-PIT-06 | Coverage catalogue API | Planned |
| WP-PIT-07 | Manifest-driven global calculator interface | Planned |
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

WP-PIT-02 records the computational shape of each jurisdiction before implementation. Each map will identify:

- tax-year basis and currency;
- individual, household or optional joint assessment;
- flat, progressive, alternative or category-specific schedules;
- standard deductions, allowances, credits, rebates, tapers and surtaxes;
- national, regional and local layers;
- required income categories and filing-status facts;
- rounding conventions;
- official authority and source locations;
- worked examples or other deterministic validation material.

The current register marks Singapore and the United Kingdom as mapped because maintained packages already exist. All other jurisdictions remain explicitly visible as unmapped backlog entries.

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

The global request model will activate only the facts required by the selected package. It may include:

- jurisdiction and tax year;
- confirmed residency scope;
- filing status;
- supported income categories;
- caller-confirmed deductions, allowances and credits;
- canonical subdivision code where regional tax applies.

TaxCraft does not request names, identity numbers, addresses or tax documents. It does not infer residence or legal eligibility from personal circumstances.

## Shared calculation primitives

The programme will extract and test reusable deterministic operations for:

- flat rates;
- progressive bands;
- basic allowances and standard deductions;
- allowance tapers;
- refundable and non-refundable credits;
- capped rebates;
- surtaxes;
- alternative-tax comparisons;
- household quotients;
- category-specific schedules;
- national, regional and local layers;
- currency rounding and annualisation.

Country packages compose these primitives while retaining package-specific coverage, sources and fixtures.

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

The catalogue validator additionally checks identity-code uniqueness, ordering, lifecycle consistency, known calculation families and continued representation of existing packages.

## Source maintenance

Maintained packages continue to use official sources. Automated observations may produce a candidate only when independent extraction paths agree. Ambiguous or incomplete source changes leave accepted models unchanged.

Source automation is added by calculation family and source shape. Initial country implementation is not blocked when reliable source automation has not yet been developed; such packages remain manually maintained and their maintenance state is declared.

## Public experience

The reference calculator will evolve into a catalogue-driven interface:

1. Select jurisdiction.
2. Select supported tax year.
3. Enter the facts declared by that package.
4. Review taxable-income derivation.
5. Review tax by rate, schedule and layer.
6. Review assumptions, exclusions and official sources.

The interface will be generated from package manifests rather than accumulating manually coded country forms.

## Deployment states

Implementation, deployment and live acceptance remain distinct:

- `implemented`: repository checks pass for the package;
- `deployed`: the package is present in a public TaxCraft deployment;
- `live-accepted`: production health, privacy and deterministic calculation checks pass;
- `maintenance-blocked`: an accepted package remains available while a source update is blocked.

The programme proceeds in this order: complete the global register, map every PIT system, implement from the simplest calculation families through the most complex, consolidate maintenance, and complete global live acceptance.
