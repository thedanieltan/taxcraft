# No-PIT jurisdiction packages — wave 3

TaxCraft's third no-PIT implementation wave adds independently manifested packages for:

- the Bahamas (`BS`);
- Kuwait (`KW`).

Each package supports calendar years 2024, 2025 and 2026. The 2026 model is current; 2024 and 2025 remain historical-supported.

This wave completes the source-indexed no-PIT family. Jurisdictions still classified for no-PIT verification remain in source discovery until their primary-source exit criteria are satisfied.

## Meaning of a zero result

A zero result means zero personal income tax only within the caller-confirmed package scope. It does not mean the person, employer or business has no tax, contribution, filing, withholding or regulatory obligations.

The caller must explicitly confirm the implemented scope. TaxCraft does not collect identity data or determine residence, source, legal status or income classification.

## The Bahamas

The Bahamas package covers caller-confirmed individual personal income.

It explicitly excludes:

- value-added tax, customs and excise duties;
- real property tax, stamp tax and other transaction taxes;
- business licence obligations;
- the Domestic Minimum Top-Up Tax applicable to in-scope multinational entities;
- National Insurance contributions and employer obligations.

The official government evidence records the absence of personal-income-tax returns and the policy not to introduce personal income taxes while separately administering consumption, property, business and multinational-enterprise taxes.

## Kuwait

The Kuwait package covers employment remuneration of a natural person outside the income-tax scope for a corporate body carrying on trade or business in Kuwait.

It explicitly excludes:

- income of an incorporated or corporate body carrying on trade or business;
- corporate contract, service, property, permanent-office and other taxable income;
- Zakat and national labour-support obligations;
- multinational-entity tax obligations;
- social security, payroll and employer obligations.

The Ministry of Finance law imposes annual income tax on corporate bodies carrying on trade or business in Kuwait. The package does not extrapolate this into a business-income or entity calculator and does not determine whether an activity is attributable to a corporate body.

## Sources and maintenance

The Bahamas package cites official budget and parliamentary policy statements from the Office of the Prime Minister. The Kuwait package cites the Ministry of Finance's English translation of the amended Kuwait Income Tax Decree and Executive Bylaw.

The packages use manual source maintenance. A change does not alter an accepted model until the rule, scope and effective date are reviewed and deterministic fixtures are updated.

## Delivery state

Repository implementation, public deployment and live acceptance are separate states. This wave adds repository, API and manifest-driven calculator support. Deployment and production acceptance remain separate work.
