const POUND = 100;
const SOURCE_ID = "gb-hmrc-income-tax-rates-current-and-past";

const COMMON = Object.freeze({
  personalAllowanceMinor: 12_570 * POUND,
  allowanceTaperStartMinor: 100_000 * POUND,
  allowanceZeroMinor: 125_140 * POUND,
  basicRateBandMinor: 37_700 * POUND,
  higherRateUpperMinor: 125_140 * POUND,
  basicRateBasisPoints: 2_000,
  higherRateBasisPoints: 4_000,
  additionalRateBasisPoints: 4_500,
  sourceIds: [SOURCE_ID]
});

function model(taxYear, order, status) {
  return {
    taxYear,
    order,
    ...COMMON,
    modelVersion: "1.0.0",
    status
  };
}

export const UK_MODEL_DATA = Object.freeze({
  schemaVersion: 1,
  jurisdiction: "GB",
  taxYears: [
    model("2024-25", 2024, "historical-supported"),
    model("2025-26", 2025, "historical-supported"),
    model("2026-27", 2026, "current")
  ]
});

export const UK_RATE_SOURCE_ID = SOURCE_ID;
