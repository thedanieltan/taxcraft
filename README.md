# TaxCraft

TaxCraft is an open-source personal income tax calculation engine, API and reference calculator.

It takes structured tax facts, applies a supported country model and returns a deterministic estimate, calculation breakdown, coverage limits and official sources.

TaxCraft does not store user calculation data. It does not provide tax, legal, accounting or financial advice.

## Initial scope

The first maintained country package is Singapore. Each jurisdiction supports no more than three tax years at a time. Older versions are retired from the calculator and API.

## Local checks

```bash
npm ci
npm run check
```

The repository is being built in work packages. The current foundation defines the product boundaries and maintenance rules before calculation logic is added.
