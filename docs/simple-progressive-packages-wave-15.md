# Simple-progressive PIT packages — wave 15

## Scope

Wave 15 adds calendar-year 2026 deterministic PIT models for China, Taiwan and Mexico.

Each model accepts a caller-confirmed taxable base. It does not derive taxable income from identity, household, payroll or expense data.

## China

The China package applies the resident comprehensive-income schedule to annual taxable comprehensive income after the RMB 60,000 basic deduction and all other legally applicable deductions:

- 3% through RMB 36,000;
- 10% from RMB 36,000 through RMB 144,000;
- 20% from RMB 144,000 through RMB 300,000;
- 25% from RMB 300,000 through RMB 420,000;
- 30% from RMB 420,000 through RMB 660,000;
- 35% from RMB 660,000 through RMB 960,000;
- 45% above RMB 960,000.

For RMB 500,000 of annual taxable comprehensive income, the package calculates RMB 97,080.00.

## Taiwan

The Taiwan package applies the official 2026 resident progressive schedule to net taxable income:

- 5% through TWD 610,000;
- 12% from TWD 610,000 through TWD 1,380,000;
- 20% from TWD 1,380,000 through TWD 2,770,000;
- 30% from TWD 2,770,000 through TWD 5,190,000;
- 40% above TWD 5,190,000.

For TWD 3,000,000 of net taxable income, the package calculates TWD 469,900.00.

## Mexico

The Mexico package implements the official 2026 annual tariff under Articles 97 and 152 using each row's lower limit, fixed quota and marginal rate. The eleven rates range from 1.92% to 35%.

For MXN 1,500,000 of annual taxable income, the package selects tariff row 9 and calculates MXN 379,294.49.

## Exclusions

The packages do not determine:

- gross income or taxable-income derivation;
- deductions, exemptions, credits or alternative tax systems;
- category-specific or non-resident schedules;
- residence, source, treaty or filing obligations;
- withholding, prepayments, refunds, penalties or annual reconciliation.

## Privacy and acceptance

All schemas are closed and reject identity-bearing fields. The packages store no user PII and provide deterministic, source-linked results.

Implementation acceptance requires complete repository checks, the hardened container build and the stateless service smoke test on the exact pull-request head. Deployment and live acceptance remain separate states.
