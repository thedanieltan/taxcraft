# Shared PIT calculation primitives

TaxCraft country packages use deterministic arithmetic primitives exported by `@taxcraft/country-sdk`.

The implementation uses Node.js 22 ECMAScript modules and integer minor-unit amounts. Intermediate multiplication and division use `BigInt`; public results remain safe JavaScript integers so they continue to satisfy TaxCraft contracts and serialize as ordinary JSON numbers.

## Rounding

Every operation that may divide requires an explicit or declared rounding mode:

- `floor`
- `ceiling`
- `truncate`
- `half-up`
- `half-even`

Country packages select the statutory convention. The primitive layer does not impose one global tax-rounding rule.

## Arithmetic primitives

The SDK exports:

- `roundRatio` — signed rational rounding;
- `applyRate` and `applyBasisPoints` — exact rational-rate application;
- `calculateProgressiveBands` — progressive schedules with reconciled band results;
- `deductFloorZero` — capped deduction from an amount;
- `calculateSteppedTaper` — discrete allowance or relief reduction;
- `applyCappedRate` — percentage or basis-point rebate subject to a cap;
- `applyTaxCredit` — refundable or non-refundable credit;
- `compareTaxAmounts` — deterministic ordinary-versus-alternative tax selection;
- `sumTaxLayers` — national, regional and local tax aggregation;
- `calculateTaxSchedules` — category-specific income schedules;
- `calculateQuotientTax` — household or quotient-based calculation;
- `prorateAmount` and `annualizeAmount` — period conversion under declared rounding.

## Example

```js
import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  deductFloorZero,
} from "@taxcraft/country-sdk";

const taxable = deductFloorZero({
  amountMinor: confirmedIncomeMinor,
  deductionMinor: confirmedStandardDeductionMinor,
});

const result = calculateProgressiveBands({
  taxableMinor: taxable.amountAfterDeductionMinor,
  rounding: ROUNDING_MODE.FLOOR,
  bands: [
    { upperBoundMinor: 2_000_000, rateBasisPoints: 0 },
    { upperBoundMinor: 5_000_000, rateBasisPoints: 1_000 },
    { upperBoundMinor: null, rateBasisPoints: 2_000 },
  ],
});
```

Country packages remain responsible for source-linked tax-year models, supported facts, result lines, assumptions, exclusions and official fixtures.

## Boundaries

The primitive layer performs arithmetic only. It does not determine:

- tax residency or territorial status;
- whether income is taxable;
- deduction, allowance, credit or rebate eligibility;
- filing status or household membership;
- which regional or local regime applies;
- tax, legal, accounting or financial advice.

Those facts must be confirmed by the caller or explicitly bounded by the country package.

## Existing package reconciliation

The Singapore package uses shared progressive bands and capped-rate rebate arithmetic with half-up rounding. The United Kingdom package uses shared progressive bands with floor rounding and the shared stepped taper for the Personal Allowance.

Existing Singapore and United Kingdom country fixtures remain the behavioural-equivalence gate for this migration.
