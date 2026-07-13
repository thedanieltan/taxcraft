# Security policy

## Supported version

TaxCraft supports the current default branch. Retired tax years are outside the supported runtime and are not maintained.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting through the repository Security tab when available.

Do not place exploit details, secrets, taxpayer information or calculation payloads in a public issue. When private reporting is unavailable, open a minimal public issue stating that a private security contact is required, without disclosing the vulnerability.

Security reports may include:

- remote code execution or dependency compromise;
- unintended persistence or logging of calculation inputs;
- acceptance of identity-bearing fields;
- source-validation or autonomous-merge bypasses;
- cross-site scripting or unsafe browser behavior;
- unauthorized repository or workflow writes.

Incorrect tax parameters without a security impact should use the tax-rule correction issue form instead.

## Response boundary

TaxCraft is maintained as an open-source project. Acknowledgement and remediation timing depend on severity and maintainer availability. Confirmed vulnerabilities will be fixed in the current codebase; unsupported historical tax years will not be restored solely for a security correction.
