# TaxCraft

TaxCraft is an open-source personal income tax calculation engine, API and reference calculator.

It takes structured tax facts, applies a supported country model and returns a deterministic estimate, calculation breakdown, coverage limits and official sources.

TaxCraft does not store user calculation data. It does not provide tax, legal, accounting or financial advice.

## Supported package

The official service currently supports Singapore resident personal income tax for YA 2024, YA 2025 and YA 2026. The caller supplies confirmed resident status and whole-dollar chargeable income. TaxCraft does not determine residency, derive chargeable income or decide relief eligibility.

Each jurisdiction supports no more than three tax years at a time. Older versions are retired from the calculator and API.

## Run locally

```bash
npm ci
npm run build
npm start
```

Open `http://localhost:3000` to use the reference calculator. The same process serves the stateless API and `GET /openapi.json`.

## Check the repository

```bash
npm run check
```

## Current-source maintenance

A scheduled workflow checks the allowlisted official IRAS rate page. Two separate extractors must agree before a candidate is generated. The workflow then runs the complete repository check, opens a bot pull request and merges the checked candidate. Ambiguous or incomplete changes fail without modifying the calculator.

```bash
npm run watch:sources
```

See `docs/autonomous-maintenance.md` for the admission and lifecycle rules.

The official calculator loads only country packages maintained in this repository. External packages may implement the public SDK in their own repositories; TaxCraft does not review, list or endorse them.
