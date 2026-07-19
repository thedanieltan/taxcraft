import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([
  { taxYear: "2024-25", order: 2025 },
  { taxYear: "2025-26", order: 2026 },
  { taxYear: "2026-27", order: 2027 },
]);

export const SIMPLE_PROGRESSIVE_WAVE_9_JURISDICTIONS = Object.freeze([
  {
    code: "BW",
    name: "Botswana individual income tax",
    currency: "BWP",
    taxYearBasis: "tax-year",
    kind: "resident-and-non-resident-taxable-income",
    supported: [
      "annual individual income tax on caller-confirmed taxable income",
      "resident and non-resident individual schedules",
      "tax years 2024-25 through 2026-27",
    ],
    unsupported: [
      "taxable-income and deduction derivation",
      "residence, source and filing-obligation determinations",
      "PAYE withholding, annual reconciliation, prior payments and refunds",
      "net aggregate gains governed by the separate capital-gains table",
      "trust, estate and category-specific income treatment",
    ],
    assumptions: [
      "The caller supplied annual taxable income after all applicable deductions.",
      "The caller selected the legally applicable resident or non-resident schedule without providing identity data.",
      "The result excludes PAYE reconciliation, capital-gains table calculations and filing balances.",
    ],
    sources: [
      {
        sourceId: "bw.burs.individual-tax-rates-subsequent-years",
        publisher: "Botswana Unified Revenue Service",
        publisherType: "tax-authority",
        title: "Rates of Tax for 2011/2012 and Subsequent Years",
        url: "https://www.burs.org.bw/index.php/my-services/tax-rates?download=67%3Atax-rates&start=60",
        jurisdiction: "BW",
        retrievedAt: "2026-07-20",
      },
      {
        sourceId: "bw.burs.income-tax-year",
        publisher: "Botswana Unified Revenue Service",
        publisherType: "tax-authority",
        title: "Income Tax — tax year and scope",
        url: "https://www.burs.org.bw/index.php/tax/income-tax",
        jurisdiction: "BW",
        retrievedAt: "2026-07-20",
      },
    ],
  },
]);

export const simpleProgressiveWave9Packages = Object.freeze([
  createBotswanaPackage(SIMPLE_PROGRESSIVE_WAVE_9_JURISDICTIONS[0]),
]);

function createBotswanaPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "individualTaxSchedule", "annualTaxableIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Botswana individual-income-tax scope",
        description: "The caller confirms the amount is annual taxable income governed by the selected individual schedule.",
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
      annualTaxableIncomeMinor: {
        type: "integer",
        title: "Annual taxable income",
        description: "Caller-confirmed annual taxable income in Botswana pula.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "BWP",
      },
    },
  };

  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears: TAX_YEARS.map(({ taxYear, order }) => ({
        taxYear,
        modelVersion: `bw-${taxYear}-v1`,
        status: taxYear === "2026-27" ? "current" : "historical-supported",
        order,
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
    models: Object.fromEntries(TAX_YEARS.map(({ taxYear }) => [taxYear, model(definition, taxYear)])),
  });
}

function model(definition, taxYear) {
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
        taxableMinor: facts.annualTaxableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `bw.pit.${taxYear}.${facts.individualTaxSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${facts.individualTaxSchedule} income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `bw.pit.${taxYear}.${facts.individualTaxSchedule}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          annualTaxableIncomeMinor: facts.annualTaxableIncomeMinor,
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
    { upperBoundMinor: 3_600_000, rateBasisPoints: 0 },
    { upperBoundMinor: 7_200_000, rateBasisPoints: 500 },
    { upperBoundMinor: 10_800_000, rateBasisPoints: 1_250 },
    { upperBoundMinor: 14_400_000, rateBasisPoints: 1_875 },
    { upperBoundMinor: null, rateBasisPoints: 2_500 },
  ];
}

function nonResidentBands() {
  return [
    { upperBoundMinor: 7_200_000, rateBasisPoints: 500 },
    { upperBoundMinor: 10_800_000, rateBasisPoints: 1_250 },
    { upperBoundMinor: 14_400_000, rateBasisPoints: 1_875 },
    { upperBoundMinor: null, rateBasisPoints: 2_500 },
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
