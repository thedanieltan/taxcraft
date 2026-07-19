# Global PIT discovery plan

## Purpose

The base PIT rule map contains a source-discovery inventory for jurisdictions that did not yet have accepted source-index evidence. `catalog/pit-discovery-plan.json` gives every one of those ISO entries a concrete implementation route without promoting unverified tax law into the executable catalogue.

A planning family is **not** an accepted legal classification. A jurisdiction remains source-discovery until the source plan's exit criteria are satisfied or an accepted country package promotes it directly.

## Complete base-backlog coverage

The plan covers all 86 entries in the base `sourceDiscovery` inventory:

| Disposition | Count | Meaning |
| --- | ---: | --- |
| Direct calculator | 45 | A sovereign or autonomous system requiring its own country package |
| Parent-system derivative | 15 | A parent tax system may be reused through an alias, parameter override or territorial package |
| No-PIT verification | 8 | A zero ordinary-PIT candidate requiring explicit official confirmation and levy exclusions |
| No resident population | 7 | An ISO territory requiring population and applicable-employment-scope confirmation rather than an assumed citizen calculator |
| Restricted or disputed source | 10 | Primary-law provenance, administering authority or territorial scope must be resolved before parameters are encoded |
| Already implemented | 1 | Seychelles was promoted from the base discovery inventory by an accepted package |

## Source-plan gates

Each entry references one of six evidence plans:

- **Sovereign primary:** current tax-authority material, controlling legislation and maintained-year applicability.
- **Parent application:** parent-system rules, territorial application law and local deviations.
- **No-PIT verification:** official confirmation of ordinary PIT absence plus payroll, social, solidarity or income-linked levy exclusions.
- **Territorial status:** official population/status evidence and any rules applying to temporary personnel.
- **Restricted primary:** authoritative-language legislation and administering-authority evidence, with professional sources used only to locate or interpret primary law.
- **Accepted package:** synchronization with an already accepted implementation overlay.

## Delivery order

Priority is structural rather than commercial:

1. Parent-system derivatives and no-PIT verification cases, because they can often reuse accepted engines or produce tightly scoped zero-PIT packages.
2. Direct calculators supported by accessible tax-authority material.
3. No-resident territories, where the correct product result may be an explicit non-applicability record rather than a conventional calculator.
4. Restricted or disputed cases, which remain blocked from executable parameters until provenance and administration are clear.

## Integrity controls

`npm run check:catalog` validates that:

- every base source-discovery entry appears exactly once;
- no entry remains structurally `UNMAPPED`;
- every planning family and source plan exists;
- parent-system derivatives name a registered parent jurisdiction;
- no-resident entries use a no-ordinary-PIT planning scope;
- already-implemented entries correspond to accepted implementation overlays;
- disposition summary counts match the individual records.

This plan completes structural routing for all 249 ISO jurisdictions while preserving the distinction between planning, source indexing, implementation, deployment and live acceptance.
