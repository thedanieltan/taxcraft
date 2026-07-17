# PIT jurisdiction register

`catalog/pit-jurisdictions.json` is TaxCraft's canonical global personal income tax backlog.

## Initial scope

The register starts with all ISO 3166-1 country and territory codes. This avoids silently excluding territories that administer a distinct tax system or require an explicit no-PIT result.

ISO coverage is the root catalogue, not the final limit. Distinct subnational tax jurisdictions are added as child records when a country requires state, provincial, cantonal, regional or municipal selection.

## Record fields

Each root record contains:

- ISO alpha-2, alpha-3 and numeric identity;
- public name;
- PIT mapping and implementation states;
- calculation family;
- tax-year basis;
- currency codes;
- national, subnational and local layer indicators;
- subdivision-selection requirement;
- supported tax years;
- maintained package identifier;
- current coverage summary.

Unknown tax facts remain `null`, empty or `UNMAPPED`. The register does not guess tax structure from geography or third-party summaries.

The compact `entities` tuples contain alpha-2 code, alpha-3 code, numeric code and name. `defaults` supplies the unmapped backlog state, while `overrides` records mapped or implemented jurisdiction facts.

## Lifecycle

Mapping and implementation are separate:

- `unmapped`: TaxCraft has not completed the jurisdiction's PIT rule inventory;
- `mapped`: the computational shape has been recorded;
- `not-started`: no calculator implementation is underway;
- `in-progress`: package implementation is active;
- `implemented`: repository acceptance has passed;
- `deployed`: a public deployment contains the package;
- `live-accepted`: production acceptance has passed;
- `maintenance-blocked`: the accepted package remains available while source maintenance is blocked.

## Existing packages

Singapore and the United Kingdom are represented as mapped and implemented. Their status is not promoted to deployed or live accepted by the register because those states require separate production evidence.

## Validation

Run:

```bash
npm run check:catalog
```

The validator checks:

- declared and actual scope counts match;
- identity codes are valid, unique and sorted;
- statuses and calculation families are known;
- unmapped records do not claim a calculation family;
- implementation cannot precede mapping;
- implemented packages declare coverage and supported years;
- Singapore and the United Kingdom remain represented.
