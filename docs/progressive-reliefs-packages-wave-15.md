# Progressive-reliefs packages: wave 15

## Namibia

Jurisdiction code: `NA`

Package: `@taxcraft/country-progressive-reliefs`

Maintained years of assessment: `2025`, `2026`, `2027`

Currency: Namibia dollar (`NAD`)

## Supported calculation

The package calculates individual normal tax on caller-confirmed annual taxable income under Schedule 4:

- taxable income not exceeding N$100,000: no tax;
- N$100,001 to N$150,000: 18% of the excess above N$100,000;
- N$150,001 to N$350,000: N$9,000 plus 25% of the excess above N$150,000;
- N$350,001 to N$550,000: N$59,000 plus 28% of the excess above N$350,000;
- N$550,001 to N$850,000: N$115,000 plus 30% of the excess above N$550,000;
- N$850,001 to N$1,550,000: N$205,000 plus 32% of the excess above N$850,000;
- above N$1,550,000: N$429,000 plus 37% of the excess above N$1,550,000.

The enacted schedule applies to years of assessment commencing on or after 1 March 2024. TaxCraft therefore maintains assessment years 2025 through 2027, with 2027 marked current.

## Excluded scope

The package does not calculate or infer:

- gross-income, exemption, deduction or taxable-income derivation;
- employee-tax withholding or payroll-period calculations;
- provisional tax or return reconciliation;
- pension, retirement-fund, medical, insurance, farming, business or assessed-loss treatment;
- foreign-tax or treaty relief;
- prior payments, penalties, interest or refunds;
- residence, source, taxpayer status or filing obligations.

## Sources

Primary statutory source:

- Government Gazette of the Republic of Namibia, `Income Tax Amendment Act, 2024 (Act No. 4 of 2024)`.

Supporting official sources:

- Ministry of Finance, Namibia, `Tax Policy Unit`;
- Namibia Revenue Agency, `Individual Taxpayer Categories`.

The enacted 2024 amendment is the source of truth for the replacement Schedule 4. A consolidated or annotated copy may lag the amending Act and must not override the enacted schedule unless it incorporates the amendment explicitly.

## Acceptance fixtures

Tests cover:

- zero taxable income;
- every statutory threshold from N$100,000 through N$1,550,000;
- the 37% top band above N$1,550,000;
- all three maintained assessment years;
- package and catalogue registration;
- public input-schema and coverage endpoints;
- statutory source attribution;
- unsupported-year rejection;
- identity-bearing fact rejection.

## Maintenance boundary

The package uses manual source maintenance. Future changes must be grounded in a later Act, Gazette notice or authoritative Namibia Revenue Agency publication that alters the Schedule 4 rates or their effective date. Payroll tables, deductions and eligibility rules remain separate implementation scopes.
