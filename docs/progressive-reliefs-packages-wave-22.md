# Progressive-reliefs packages — wave 22

## Türkiye

TaxCraft implements Türkiye's calendar-year 2026 annual income-tax tariffs for caller-confirmed taxable income.

### Supported schedules

The calculator supports separate `general` and `wage` schedules. Both apply 15%, 20%, 27%, 35% and 40% rates. The wage schedule extends the 27% band to TRY 1,500,000, while the general schedule extends it to TRY 1,000,000. Both schedules move to 40% above TRY 5,300,000.

### Required facts

- `scopeConfirmed`;
- `incomeSchedule`: `general` or `wage`;
- `taxableIncomeMinor`: annual taxable income after applicable exemptions and deductions.

### Explicit exclusions

TaxCraft does not derive taxable income, minimum-wage or other exemptions, disability and insurance deductions, donations, category-specific income, social-security contributions, withholding, payments on account, residence or filing obligations.

### Primary sources

- Revenue Administration of Türkiye, 2026 income-tax tariff;
- Income Tax Law article 103 with the 2026 amounts;
- Revenue Administration wage-income guidance for 2026.

## Peru

TaxCraft implements Peru's calendar-year 2026 annual cumulative scale for caller-confirmed net taxable work and qualifying foreign-source income.

### Supported calculation

Using the official 2026 UIT of PEN 5,500, the calculator applies:

- 8% through 5 UIT;
- 14% from 5 through 20 UIT;
- 17% from 20 through 35 UIT;
- 20% from 35 through 45 UIT;
- 30% above 45 UIT.

### Required facts

- `scopeConfirmed`;
- `netTaxableWorkIncomeMinor`: net taxable work and qualifying foreign-source income after applicable deductions.

### Explicit exclusions

TaxCraft does not derive fourth- or fifth-category income, the 20% professional deduction, seven-UIT or additional three-UIT deductions, foreign-income classification, capital or business income, withholding, payments on account, residence or filing obligations.

### Primary sources

- SUNAT annual work-income rates;
- SUNAT 2026 UIT table, citing Supreme Decree No. 301-2025-EF;
- Government of Peru/SUNAT fifth-category calculation guidance.

## Acceptance fixtures

The deterministic suites cover every threshold, Turkey's separate general and wage transitions, Peru's 2026 UIT conversion, top-band calculations, source attribution, API discovery, schema exposure, exclusions, unsupported tax years and identity-bearing fact rejection.

Implementation acceptance, deployment and live acceptance remain separate states.
