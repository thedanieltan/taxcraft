import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);

export const SIMPLE_PROGRESSIVE_WAVE_8_JURISDICTIONS = Object.freeze([
  {
    code: "FJ",
    name: "Fiji individual income tax",
    currency: "FJD",
    taxYearBasis: "calendar-year",
    kind: "resident-and-non-resident-chargeable-income",
    supported: [
      "annual individual income tax on caller-confirmed chargeable income",
      "resident and non-resident individual schedules",
      "the integrated high-income rates effective from 1 January 2024",
      "calendar years 2024 through 2026",
    ],
    unsupported: [
      "chargeable-income and deduction derivation",
      "residence, source and temporary-resident determinations",
      "PAYE withholding, annual reconciliation, prior payments and refunds",
      "foreign-tax credits and treaty relief",
      "business-return filing and category-specific income treatment",
    ],
    assumptions: [
      "The caller supplied annual chargeable income after all applicable deductions.",
      "The caller selected the legally applicable resident or non-resident schedule without providing identity data.",
      "The result excludes PAYE reconciliation, foreign-tax credits and filing balances.",
    ],
    sources: [
      {
        sourceId: "fj.frcs.paye-structure-2024",
        publisher: "Fiji Revenue and Customs Service",
        publisherType: "tax-authority",
        title: "New Pay As You Earn structure effective 1 January 2024",
        url: "https://frcs.org.fj/public-notice/customer-service-new-pay-as-you-earn-paye-structure/",
        jurisdiction: "FJ",
        retrievedAt: "2026-07-19",
      },
      {
        sourceId: "fj.frcs.personal-income-tax-current",
        publisher: "Fiji Revenue and Customs Service",
        publisherType: "tax-authority",
        title: "Personal Income Tax — Salary and Wage Earners",
        url: "https://frcs.org.fj/our-services/taxation/individuals/personal-income-tax/",
        jurisdiction: "FJ",
        retrievedAt: "2026-07-19",
      },
      {
        sourceId: "fj.frcs.income-tax-legislation-2025",
        publisher: "Fiji Revenue and Customs Service",
        publisherType: "tax-authority",
        title: "Income Tax Act 2015 and current tax legislation",
        url: "https://frcs.org.fj/our-services/frcs-laws-legislations/tax-legislations/",
        jurisdiction: "FJ",
        retrievedAt: "2026-07-19",
      },
    ],
  },
]);

export const simpleProgressiveWave8Packages = Object.freeze([
  createFijiPackage(SIMPLE_PROGRESSIVE_WAVE_8_JURISDICTIONS[0]),
]);

function createFijiPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Fiji individual-income-tax scope",
        description: "The caller confirms the amount is annual chargeable income governed by the selected individual schedule.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      individualTaxSchedule: {
        type: "string",
        title: "Individual tax schedule",
        description: "Select the legally applicable resident or non-resident schedule without providing identity details.",
        enum: ["resident", "non-resident"],
        "x-taxcraft-kind": "plain",
      },
      annualChargeableIncomeMinor: {
        type: "integer",
        title: "Annual chargeable income",
        description: "Caller-confirmed annual chargeable income in Fijian dollars.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "FJD",
      },
    },
  };

  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears: TAX_YEARS.map((year) => ({
        taxYear: String(year),
        modelVersion: `fj-${year}-v1`,
        status: year === 2026 ? "current" : "historical-supported",
        order: year,
      })),
      pit: {
        contractVersion: "taxcraft.pit-country-package.v1",
        taxUnit: "individual",
        taxYearBasis: definition.taxYearBasis,
        currencyCodes: [definition.currency],
        incomeSchedules: [definition.kind],
        taxLayers: {
          national: true,
          subnational: false,
          local: false,
          subdivisionRequired: false,
        },
        factsSchema,
        rounding: [{ stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 }],
        maintenance: { mode: "manual", sourceWatch: false },
      },
    },
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), model(definition, year)])),
  });
}

function model(definition, year) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const bands = facts.individualTaxSchedule === "resident"
        ? residentBands()
        : nonResidentBands();
      const result = calculateProgressiveBands({
        taxableMinor: facts.annualChargeableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `fj.pit.${year}.${facts.individualTaxSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${facts.individualTaxSchedule} income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `fj.pit.${year}.${facts.individualTaxSchedule}.zero-income`,
          label: "Income tax on zero chargeable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          annualChargeableIncomeMinor: facts.annualChargeableIncomeMinor,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...definition.assumptions],
        coverage: coverage(definition),
      };
    },
  };
}

function residentBands() {
  return [
    { upperBoundMinor: 3_000_000, rateBasisPoints: 0 },
    { upperBoundMinor: 5_000_000, rateBasisPoints: 1_800 },
    { upperBoundMinor: 27_000_000, rateBasisPoints: 2_000 },
    { upperBoundMinor: 30_000_000, rateBasisPoints: 3_300 },
    { upperBoundMinor: 35_000_000, rateBasisPoints: 3_400 },
    { upperBoundMinor: 40_000_000, rateBasisPoints: 3_500 },
    { upperBoundMinor: 45_000_000, rateBasisPoints: 3_600 },
    { upperBoundMinor: 50_000_000, rateBasisPoints: 3_700 },
    { upperBoundMinor: 100_000_000, rateBasisPoints: 3_800 },
    { upperBoundMinor: null, rateBasisPoints: 3_900 },
  ];
}

function nonResidentBands() {
  return [
    { upperBoundMinor: 27_000_000, rateBasisPoints: 2_000 },
    { upperBoundMinor: 30_000_000, rateBasisPoints: 3_300 },
    { upperBoundMinor: 35_000_000, rateBasisPoints: 3_400 },
    { upperBoundMinor: 40_000_000, rateBasisPoints: 3_500 },
    { upperBoundMinor: 45_000_000, rateBasisPoints: 3_600 },
    { upperBoundMinor: 50_000_000, rateBasisPoints: 3_700 },
    { upperBoundMinor: 100_000_000, rateBasisPoints: 3_800 },
    { upperBoundMinor: null, rateBasisPoints: 3_900 },
  ];
}

function coverage(definition) {
  return {
    supported: [...definition.supported],
    unsupported: [...definition.unsupported],
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
