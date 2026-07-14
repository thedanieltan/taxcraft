# Autonomous maintenance

TaxCraft maintains changing tax data through repository workflows rather than manual review queues.

## Source admission

A production change must come from an allowlisted official source.

- Singapore accepts only the IRAS HTTPS host and the resident rate publication.
- The UK package accepts only the GOV.UK HTTPS host and HMRC's current-and-previous-years Income Tax table.

Each jurisdiction has two separate extractors. One reads table structure and the other reads a flattened text representation. Both must return the same structured values.

An update stops when a source is unavailable, redirects outside its allowlist, is not HTML, cannot be parsed, contains proposal or draft language, fails structural validation or produces different extractor results.

## Lifecycle

Each accepted observation is converted into one model per supported assessment year or tax year. Each model has its own:

- parameter schedule;
- official source ID;
- model version;
- lifecycle status;
- year-specific rebates or allowances where supported.

At most three years remain active for each jurisdiction. When a new year is admitted, the oldest is removed from the runtime and written to that jurisdiction's retirement ledger.

Accepted historical values are not re-reviewed merely because an old paragraph disappears. They leave active maintenance when they fall outside the three-year support window.

## Repository workflow

The scheduled workflow:

1. fetches each maintained official source;
2. runs the source-specific extractor pair;
3. validates and renders any candidates;
4. runs `git diff --check` and `npm run check`;
5. creates one bot branch and pull request when files changed;
6. merges the exact checked candidate by squash merge.

No pull request is created when all accepted models are unchanged. A blocked observation leaves every current model untouched and causes the workflow run to fail visibly.

## Local commands

Observe all live sources without writing files:

```bash
npm run watch:sources
```

Write verified candidates:

```bash
npm run watch:sources -- --write
```

The individual watchers remain available for diagnostics:

```bash
node scripts/watch-tax-sources.mjs
node scripts/watch-uk-source.mjs
```

The `--date=YYYY-MM-DD` option is available for deterministic lifecycle tests.
