const POUND = 100;
const SOURCE_ID = "gb-hmrc-income-tax-rates-2024-2027";

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

export const UK_MODEL_DATA = Object.freeze({
  schemaVersion: 1,
  jurisdiction: "GB",
  taxYears: [
    {
      taxYear: "2024-25",
      modelVersion: "1.0.0",
      status: "historical-supported",
      order: 2024,
      ...COMMON
    },
    {
      taxYear: "2025-26",
      modelVersion: "1.0.0",
      status: "historical-supported",
      order: 2025,
      ...COMMON
    },
    {
      taxYear: "2026-27",
      modelVersion: "1.0.0",
      status: "current",
      order: 2026,
      ...COMMON
    }
  ]
});

export const UK_RATE_SOURCE_ID = SOURCE_ID;
