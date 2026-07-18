# No-PIT jurisdiction packages

TaxCraft's first no-PIT implementation wave contains eight independently manifested country packages in `@taxcraft/country-no-pit`:

- United Arab Emirates (`AE`)
- Bahrain (`BH`)
- Bermuda (`BM`)
- Brunei Darussalam (`BN`)
- Cayman Islands (`KY`)
- Monaco (`MC`)
- Oman (`OM`)
- Qatar (`QA`)

Each package supports calendar years 2024, 2025 and 2026. The 2026 model is current; 2024 and 2025 remain historical-supported.

## Meaning of a zero result

A zero result means that the package calculates zero personal income tax for the caller-confirmed income scope. It does not mean the person or employer has no other obligations.

The packages explicitly exclude, as applicable:

- payroll taxes and employer levies;
- social insurance, pension and health contributions;
- business, corporate and permanent-establishment income;
- withholding and indirect taxes;
- licensing, work-permit and regulatory charges;
- foreign-source and treaty obligations;
- residency and legal income-classification decisions.

The caller must confirm the package scope through the manifest-generated input before TaxCraft calculates.

## Jurisdiction boundaries

### United Arab Emirates

Covers caller-confirmed wage or salary income outside the natural-person business-activity scope. It does not determine corporate-tax registration, business turnover thresholds or social contributions.

### Bahrain

Covers ordinary individual personal income. Social insurance, employer obligations and sector-specific taxes remain outside the package.

### Bermuda

Covers personal income tax only. Bermuda payroll tax and social insurance are separate obligations and are not represented by the zero PIT result.

### Brunei Darussalam

Covers individual personal income rather than company income. Company taxation and mandatory contributions are excluded.

### Cayman Islands

Covers individual personal income under the jurisdiction's no-direct-tax structure. Work-permit fees, pension, health insurance, customs duties and stamp duties are excluded.

### Monaco

Covers Monaco residents outside the French-national bilateral convention exception. The package does not determine residence, treaty status or tax exposure in France or another jurisdiction.

### Oman

Covers calendar years 2024 through 2026 before the announced Personal Income Tax Law commencement on 1 January 2028. TaxCraft does not expose a zero-PIT model for 2028 or later.

### Qatar

Covers caller-confirmed salary and wage income. Business, permanent-establishment and other taxable Qatar-source income are excluded.

## Sources and maintenance

Every package cites a jurisdiction-specific tax authority, finance ministry or official government publication. Secondary global summaries remain planning evidence and are not used as calculator parameters.

The packages declare manual source maintenance. A source change does not alter an accepted model until the official rule, scope and effective date are reviewed and deterministic fixtures are updated.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This work package adds repository, API and manifest-driven calculator support. Deployment and production acceptance remain part of the later global release work package.
