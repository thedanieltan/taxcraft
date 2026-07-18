import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze(["2024", "2025", "2026"]);
const BANDS = Object.freeze([
  { upperBoundMinor: 15_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 30_000_000, rateBasisPoints: 500 },
  { upperBoundMinor: 50_000_000, rateBasisPoints: 1000 },
  { upperBoundMinor: 75_000_000, rateBasisPoints: 1500 },
  { upperBoundMinor: 100_000_000, rateBasisPoints: 2000 },
  { upperBoundMinor: 200_000_000, rateBasisPoints: 2500 },
  { upperBoundMinor: 400_000_000, rateBasisPoints: 3000 },
  { upperBoundMinor: null, rateBasisPoints: 3500 },
]);

const DEFINITION = Object.freeze({
  code: "TH",
  name: "Thailand ordinary personal income tax",
  currency: "THB",
  supported: [
    "ordinary progressive personal income tax on caller-confirmed taxable income",
    "0%, 5%, 10%, 15%, 20%, 25%, 30% and 35% annual bands",
    "calendar years 2024 through 2026",
  ],
  unsupported: [
    "taxable-income, deduction and allowance derivation",
    "the 0.5% minimum-tax comparison for specified income categories",
    "separately taxed or excluded income schedules",
    "withholding credits, half-year payments, prior payments and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after applicable deductions and allowances.",
    "The ordinary progressive schedule applies and no separate minimum-tax comparison is required.",
    "Separately taxed income and withholding reconciliation are excluded.",
  ],
  sources: [
    {
      sourceId: "th.rd.personal-income-tax-rates",
      publisher: "Thailand Revenue Department",
      publisherType: "tax-authority",
      title: "Thailand — Personal Income Tax",
      url: "https://www.rd.go.th/english/52471.html",
      jurisdiction: "TH",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "th.rd.personal-income-tax-guide",
      publisher: "Thailand Revenue Department",
      publisherType: "tax-authority",
      title: "Personal Income Tax",
      url: "https://www.rd.go.th/english/6045.html",
      jurisdiction: "TH",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "th.rd.personal-income-tax-forms-2026",
      publisher: "Thailand Revenue Department",
      publisherType: "tax-authority",
      title: "Personal Income Tax 2026",
      url: "https://www.rd.go.th/english/68443.html",
      jurisdiction: "TH",
      retrievedAt: "2026-07-18",
    },
  ],
});

export const SIMPLE_PROGRESSIVE_WAVE_7_JURISDICTIONS = Object.freeze([DEFINITION]);
export const simpleProgressiveWave7Packages = Object.freeze([createThailandPackage()]);

function createThailandPackage() {
  return definePitCountryPackage({
    manifest: {
      jurisdiction: DEFINITION.code,
      name: DEFINITION.name,
      storesUserPII: false,
      advisory: false,
      taxYears: TAX_YEARS.map((taxYear) => ({
        taxYear,
        modelVersion: `th-${taxYear}-v1`,
        status: taxYear === "2026" ? "current" : "historical-supported",
        order: Number(taxYear),
      })),
      pit: {
        contractVersion: "taxcraft.pit-country-package.v1",
        taxUnit: "individual",
        taxYearBasis: "calendar-year",
        currencyCodes: [DEFINITION.currency],
        incomeSchedules: ["annual-taxable-income"],
        taxLayers: {
          national: true,
          subnational: false,
          local: false,
          subdivisionRequired: false,
        },
        factsSchema: {
          type: "object",
          additionalProperties: false,
          required: ["scopeConfirmed", "taxableIncomeMinor"],
          properties: {
            scopeConfirmed: {
              type: "boolean",
              title: "Confirmed Thailand ordinary PIT scope",
              description: "The caller confirms the amount is taxable income governed by the ordinary progressive schedule and the separate minimum-tax comparison is not required.",
              const: true,
              "x-taxcraft-kind": "confirmed-status",
            },
            taxableIncomeMinor: {
              type: "integer",
              title: "Annual taxable income",
              description: "Caller-confirmed annual taxable income in THB after deductions and allowances.",
              minimum: 0,
              "x-taxcraft-kind": "money-minor",
              "x-taxcraft-currency": "THB",
            },
          },
        },
        rounding: [{ stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 }],
        maintenance: { mode: "manual", sourceWatch: false },
      },
    },
    sources: DEFINITION.sources,
    models: Object.fromEntries(TAX_YEARS.map((taxYear) => [taxYear, model(taxYear)])),
  });
}

function model(taxYear) {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `th.pit.${taxYear}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} personal income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `th.pit.${taxYear}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          incomeTaxMinor: progressive.taxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
