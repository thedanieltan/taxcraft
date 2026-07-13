# Release policy

TaxCraft follows the default branch as the current open-source implementation. A merge is not a claim that every tax case is covered; coverage is stated by each country model.

## Tax-year models

Each maintained jurisdiction exposes at most three assessment-year or tax-year models:

- one current model;
- up to two supported historical models.

A newly admitted year starts at model version `1.0.0`. A corrected rule within the same tax year increments that model's patch version. Retired years are removed from the runtime and source watch, and are not silently substituted with another year's rules.

## Package and API compatibility

Public contracts use explicit versions. Breaking contract changes require a new contract version rather than changing an existing schema in place.

Country-model data may change when an official source changes, a clear defect is corrected or a new supported year is admitted. Every material change must retain source linkage and deterministic fixtures.

## Deployment status

Implementation acceptance and live deployment acceptance are separate. CI proves the repository and container behave as tested. A hosted service is only considered live after its deployment-specific health and smoke checks pass.

## Rollback

A failed deployment rolls back to the previous accepted container or commit. A defective tax-model merge is reverted; the project does not patch production data outside version control.
