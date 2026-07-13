## Change

Describe the work package and the contract it changes.

## Evidence

For tax-rule changes, list every affected tax year and official source URL. State the exact parameter changes.

## Coverage

State what remains unsupported. Do not broaden coverage implicitly.

## Validation

- [ ] `npm ci`
- [ ] `npm run check`
- [ ] Container smoke test passes through CI
- [ ] No user PII, calculation payloads, secrets or private-project references were added
- [ ] Outputs remain non-advisory
- [ ] Material tax parameters link to official sources
- [ ] The three-tax-year lifecycle remains valid

## Live acceptance

State separately whether a deployed or live-source path was exercised. Do not treat implementation tests as live acceptance.
