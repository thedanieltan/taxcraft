# Simple-progressive PIT packages — wave 5

This work package adds Rwanda employment income tax to the manifest-driven PIT calculator.

## Input contract

The caller supplies:

- a confirmation that ordinary Rwanda PAYE treatment applies;
- an income period of `monthly` or `annual`;
- taxable employment income for that period in Rwandan francs.

TaxCraft does not derive taxable employment income, identify the employee, determine residence or decide whether secondary-employer or casual-labour treatment applies.

## Annual calculation

The annual schedule is:

- 0% through RWF 720,000;
- 10% through RWF 1,200,000;
- 20% through RWF 2,400,000;
- 30% on the excess.

## Monthly calculation

Monthly mode follows the Rwanda Revenue Authority public calculator method:

1. annualise the entered monthly taxable employment income by multiplying it by 12;
2. apply the annual progressive bands;
3. divide annual tax by 12;
4. round the monthly PAYE amount up to a whole Rwandan franc.

This preserves the authority's rounding behaviour at monthly band transitions.

## Exclusions

The package excludes:

- deduction and taxable-income derivation;
- secondary-employer flat-rate withholding;
- casual-labour treatment;
- prior withholding, refunds and reconciliation;
- social contributions and other payroll deductions;
- residence, source and filing-obligation determinations.

## Sources

The maintained model uses Rwanda Revenue Authority PAYE band guidance, the public PAYE calculator and the employment-tax overview.
