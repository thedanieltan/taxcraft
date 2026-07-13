const DOLLAR = 100;

export const RESIDENT_BRACKETS = Object.freeze([
  { widthMinor: 20_000 * DOLLAR, rateBasisPoints: 0 },
  { widthMinor: 10_000 * DOLLAR, rateBasisPoints: 200 },
  { widthMinor: 10_000 * DOLLAR, rateBasisPoints: 350 },
  { widthMinor: 40_000 * DOLLAR, rateBasisPoints: 700 },
  { widthMinor: 40_000 * DOLLAR, rateBasisPoints: 1_150 },
  { widthMinor: 40_000 * DOLLAR, rateBasisPoints: 1_500 },
  { widthMinor: 40_000 * DOLLAR, rateBasisPoints: 1_800 },
  { widthMinor: 40_000 * DOLLAR, rateBasisPoints: 1_900 },
  { widthMinor: 40_000 * DOLLAR, rateBasisPoints: 1_950 },
  { widthMinor: 40_000 * DOLLAR, rateBasisPoints: 2_000 },
  { widthMinor: 180_000 * DOLLAR, rateBasisPoints: 2_200 },
  { widthMinor: 500_000 * DOLLAR, rateBasisPoints: 2_300 },
  { widthMinor: null, rateBasisPoints: 2_400 }
]);

export const GENERAL_REBATES = Object.freeze({
  YA2024: { percentage: 50, capMinor: 200 * DOLLAR },
  YA2025: { percentage: 60, capMinor: 200 * DOLLAR },
  YA2026: null
});
