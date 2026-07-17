import assert from "node:assert/strict";
import test from "node:test";
import {
  ROUNDING_MODE,
  annualizeAmount,
  applyBasisPoints,
  applyCappedRate,
  applyTaxCredit,
  calculateProgressiveBands,
  calculateQuotientTax,
  calculateSteppedTaper,
  calculateTaxSchedules,
  compareTaxAmounts,
  deductFloorZero,
  prorateAmount,
  roundRatio,
  sumTaxLayers,
} from "../packages/country-sdk/src/pit-primitives.js";

test("roundRatio implements explicit signed rounding modes", () => {
  assert.equal(roundRatio(5, 2, ROUNDING_MODE.HALF_UP), 3);
  assert.equal(roundRatio(5, 2, ROUNDING_MODE.HALF_EVEN), 2);
  assert.equal(roundRatio(7, 2, ROUNDING_MODE.HALF_EVEN), 4);
  assert.equal(roundRatio(-5, 2, ROUNDING_MODE.FLOOR), -3);
  assert.equal(roundRatio(-5, 2, ROUNDING_MODE.CEILING), -2);
  assert.equal(roundRatio(-5, 2, ROUNDING_MODE.TRUNCATE), -2);
});

test("basis-point arithmetic uses bigint intermediates without an arbitrary amount cap", () => {
  const amount = Number.MAX_SAFE_INTEGER - 1;
  assert.equal(applyBasisPoints(amount, 10_000), amount);
  assert.throws(() => applyBasisPoints(amount, 20_000), /safe integer output/);
});

test("progressive bands reconcile taxable amounts and tax", () => {
  const result = calculateProgressiveBands({
    taxableMinor: 35_000_00,
    rounding: ROUNDING_MODE.FLOOR,
    bands: [
      { upperBoundMinor: 10_000_00, rateBasisPoints: 0 },
      { upperBoundMinor: 30_000_00, rateBasisPoints: 1_000 },
      { upperBoundMinor: null, rateBasisPoints: 2_000 },
    ],
  });
  assert.equal(result.taxMinor, 3_000_00);
  assert.deepEqual(result.bands.map(({ taxableMinor, taxMinor }) => ({ taxableMinor, taxMinor })), [
    { taxableMinor: 10_000_00, taxMinor: 0 },
    { taxableMinor: 20_000_00, taxMinor: 2_000_00 },
    { taxableMinor: 5_000_00, taxMinor: 1_000_00 },
  ]);
  assert.equal(result.bands.reduce((sum, band) => sum + band.taxableMinor, 0), result.taxableMinor);
  assert.equal(result.bands.reduce((sum, band) => sum + band.taxMinor, 0), result.taxMinor);
});

test("progressive bands reject gaps beyond a closed final band", () => {
  assert.throws(() => calculateProgressiveBands({
    taxableMinor: 20_000,
    bands: [{ upperBoundMinor: 10_000, rateBasisPoints: 1_000 }],
  }), /do not cover/);
});

test("stepped taper preserves discrete statutory steps and caps at zero", () => {
  assert.deepEqual(calculateSteppedTaper({
    baseAmountMinor: 12_570_00,
    measureMinor: 100_001_99,
    startsAtMinor: 100_000_00,
    measureStepMinor: 2_00,
    reductionPerStepMinor: 1_00,
  }), {
    baseAmountMinor: 12_570_00,
    excessMinor: 1_99,
    completedSteps: 0,
    reductionMinor: 0,
    amountMinor: 12_570_00,
  });
  assert.equal(calculateSteppedTaper({
    baseAmountMinor: 12_570_00,
    measureMinor: 130_000_00,
    startsAtMinor: 100_000_00,
    measureStepMinor: 2_00,
    reductionPerStepMinor: 1_00,
  }).amountMinor, 0);
});

test("capped rates and tax credits expose applied amounts", () => {
  assert.deepEqual(applyCappedRate({
    amountMinor: 10_000_00,
    rateBasisPoints: 5_000,
    capMinor: 3_000_00,
  }), {
    uncappedAmountMinor: 5_000_00,
    appliedAmountMinor: 3_000_00,
    capMinor: 3_000_00,
  });
  assert.equal(applyTaxCredit({ taxMinor: 1_000, creditMinor: 1_500 }).taxAfterCreditMinor, 0);
  assert.equal(applyTaxCredit({ taxMinor: 1_000, creditMinor: 1_500, refundable: true }).taxAfterCreditMinor, -500);
});

test("alternative comparisons and tax layers remain deterministic", () => {
  assert.deepEqual(compareTaxAmounts({ primaryMinor: 1_000, alternativeMinor: 1_500 }), {
    selected: "alternative",
    selectedMinor: 1_500,
    primaryMinor: 1_000,
    alternativeMinor: 1_500,
  });
  assert.deepEqual(sumTaxLayers([
    { id: "national", amountMinor: 1_000 },
    { id: "regional", amountMinor: 250 },
  ]), {
    totalMinor: 1_250,
    layers: [
      { id: "national", amountMinor: 1_000 },
      { id: "regional", amountMinor: 250 },
    ],
  });
});

test("proration and annualisation use the declared rounding policy", () => {
  assert.equal(prorateAmount({ annualAmountMinor: 1_000, eligibleUnits: 1, totalUnits: 3 }), 333);
  assert.equal(annualizeAmount({ periodAmountMinor: 1_000, periodUnits: 3, annualUnits: 12 }), 4_000);
});

test("deductions, category schedules and household quotients compose deterministically", () => {
  assert.deepEqual(deductFloorZero({ amountMinor: 1_000, deductionMinor: 1_500 }), {
    amountBeforeDeductionMinor: 1_000,
    availableDeductionMinor: 1_500,
    appliedDeductionMinor: 1_000,
    amountAfterDeductionMinor: 0,
  });
  const schedules = calculateTaxSchedules([
    {
      id: "employment",
      taxableMinor: 10_000,
      bands: [{ upperBoundMinor: null, rateBasisPoints: 1_000 }],
    },
    {
      id: "investment",
      taxableMinor: 5_000,
      bands: [{ upperBoundMinor: null, rateBasisPoints: 2_000 }],
    },
  ]);
  assert.equal(schedules.totalTaxMinor, 2_000);
  const quotient = calculateQuotientTax({
    taxableMinor: 100_000,
    quotientNumerator: 2,
    bands: [{ upperBoundMinor: null, rateBasisPoints: 1_000 }],
  });
  assert.equal(quotient.quotientIncomeMinor, 50_000);
  assert.equal(quotient.taxMinor, 10_000);
});
