# Contributing to TaxCraft

TaxCraft accepts changes to the engine, API, calculator, documentation, tests, automation and country packages that the project already maintains.

TaxCraft does not operate a submission or review programme for external country packages. Build and publish those packages in a separate repository using the public country-package interface.

## Before opening a pull request

Run:

```bash
npm ci
npm run check
```

A change must preserve these boundaries:

- calculations are deterministic;
- user calculation data is not stored;
- identity-bearing fields are rejected;
- outputs remain non-advisory;
- every material tax parameter cites an official source;
- each jurisdiction exposes no more than three tax years;
- unsupported cases fail explicitly rather than being estimated by analogy.

## Tax-rule corrections

Use the tax-rule correction issue form before changing a maintained country package. Include:

- the affected jurisdiction and tax year;
- the exact parameter or rule;
- the current and expected result;
- an official government source;
- a small non-identifying test case.

Do not submit taxpayer names, identity numbers, addresses, documents or real tax returns.

A blog, commercial calculator or accounting-firm summary cannot be the sole source for a production rule when an official source exists.

## Pull requests

Keep one work package in one pull request. Repair failed checks on the same branch. Describe the changed contract, source evidence, coverage limits and tests.

A pull request that changes tax data must update the source linkage and deterministic fixtures in the same change.
