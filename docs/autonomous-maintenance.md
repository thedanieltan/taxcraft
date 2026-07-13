# Autonomous maintenance

TaxCraft maintains changing tax data through repository workflows rather than manual review queues.

## Source admission

A production change must come from an allowlisted official source. The Singapore source registry accepts only the IRAS HTTPS host and the published resident rate table.

The source watcher runs two separate extractors:

1. a table-cell extractor;
2. a flattened-text sequence extractor.

Both must return the same schedules and rebates. The update stops when the source is unavailable, redirects outside the allowlist, is not HTML, cannot be parsed, contains proposal or draft language, fails structural validation or produces different extractor results.

## Lifecycle

The accepted source observation is converted into one model per supported assessment year. Each model has its own:

- rate schedule;
- official source ID;
- rebate, when present;
- model version;
- lifecycle status.

At most three assessment years remain active. When the next assessment year is admitted, the oldest is removed from the runtime and written to the retirement ledger.

Accepted historical values are not erased merely because an old paragraph disappears from the live source page.

## Repository workflow

The scheduled workflow:

1. fetches the official source;
2. runs both extractors;
3. validates and renders a candidate;
4. runs `git diff --check` and `npm run check`;
5. creates a bot branch and pull request;
6. merges the exact checked candidate by squash merge.

No pull request is created when the accepted model is unchanged. A blocked or failed observation leaves the current calculator untouched and causes the workflow run to fail visibly.

## Local commands

Observe the live source without writing files:

```bash
npm run watch:sources
```

Write a verified candidate:

```bash
node scripts/watch-tax-sources.mjs --write
```

The `--date=YYYY-MM-DD` option is available for deterministic lifecycle tests.
