# Global PIT rule map

`catalog/pit-rule-map.json` is the machine-readable implementation plan for personal income tax calculators.

It is implemented in JSON and validated with Node.js because TaxCraft already uses a Node.js 22 ESM toolchain. No second runtime is introduced for catalogue maintenance.

## Coverage

The rule map aligns one-to-one with the 249 ISO 3166-1 entries in `catalog/pit-jurisdictions.json`.

As of 18 July 2026:

- 2 jurisdictions are backed by implemented TaxCraft packages;
- 161 additional jurisdictions are source-indexed: 145 from PwC Worldwide Tax Summaries and 16 additional full chapters from the EY Worldwide Personal Tax and Immigration Guide;
- 86 jurisdictions remain visible for source discovery.

Every entry remains present even when its tax structure has not yet been sourced.

## Classification

The rule map separates three states:

- `implemented` — a maintained TaxCraft package exists;
- `source-indexed` — a current global summary identifies the territory and a provisional calculation family;
- `source-discovery` — the jurisdiction remains in the backlog but no source is indexed yet.

A source-indexed calculation family is an implementation-planning classification. It is not a substitute for the official rules, enacted tax-year parameters or country-package tests.

## Calculation order

`implementationWave` is inherited from `catalog/pit-calculation-families.json`.

The sequence starts with:

1. jurisdictions with no ordinary national PIT;
2. flat-rate systems;
3. simple progressive systems;
4. progressively more composite systems.

Complexity controls order only. It does not remove any jurisdiction from the programme.

## Provenance

`catalog/pit-rule-sources.json` records the evidence sources used by the map.

The PwC quick chart is used as a broad discovery and sequencing index. The EY guide expands coverage only where it contains a full personal-tax chapter; entries listed only in its contacts section remain in source discovery. Calculator parameters must continue to come from official legislation, tax authorities or equivalent primary publications when each country package is implemented.

## Validation

Run:

```bash
npm run check:catalog
```

The Node.js validators confirm that:

- the rule map covers the complete jurisdiction register;
- every code and calculation family is valid;
- implementation waves agree with the family catalogue;
- evidence references resolve;
- Singapore and the United Kingdom remain the only implemented mappings;
- provisional source-indexed records are not presented as verified calculator packages.
