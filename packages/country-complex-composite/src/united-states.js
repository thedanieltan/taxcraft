import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const FILING_STATUSES = Object.freeze([
  "single",
  "married-filing-jointly",
  "married-filing-separately",
  "head-of-household",
]);

const BANDS_BY_FILING_STATUS = Object.freeze({
  single: Object.freeze([
    { upperBoundMinor: 1_240_000, rateBasisPoints: 1_000 },
    { upperBoundMinor: 5_040_000, rateBasisPoints: 1_200 },
    { upperBoundMinor: 10_570_000, rateBasisPoints: 2_200 },
    { upperBoundMinor: 20_177_500, rateBasisPoints: 2_400 },
    { upperBoundMinor: 25_622_500, rateBasisPoints: 3_200 },
    { upperBoundMinor: 64_060_000, rateBasisPoints: 3_500 },
    { upperBoundMinor: null, rateBasisPoints: 3_700 },
  ]),
  "married-filing-jointly": Object.freeze([
    { upperBoundMinor: 2_480_000, rateBasisPoints: 1_000 },
    { upperBoundMinor: 10_080_000, rateBasisPoints: 1_200 },
    { upperBoundMinor: 21_140_000, rateBasisPoints: 2_200 },
    { upperBoundMinor: 40_355_000, rateBasisPoints: 2_400 },
    { upperBoundMinor: 51_245_000, rateBasisPoints: 3_200 },
    { upperBoundMinor: 76_870_000, rateBasisPoints: 3_500 },
    { upperBoundMinor: null, rateBasisPoints: 3_700 },
  ]),
  "married-filing-separately": Object.freeze([
    { upperBoundMinor: 1_240_000, rateBasisPoints: 1_000 },
    { upperBoundMinor: 5_040_000, rateBasisPoints: 1_200 },
    { upperBoundMinor: 10_570_000, rateBasisPoints: 2_200 },
    { upperBoundMinor: 20_177_500, rateBasisPoints: 2_400 },
    { upperBoundMinor: 25_622_500, rateBasisPoints: 3_200 },
    { upperBoundMinor: 38_435_000, rateBasisPoints: 3_500 },
    { upperBoundMinor: null, rateBasisPoints: 3_700 },
  ]),
  "head-of-household": Object.freeze([
    { upperBoundMinor: 1_770_000, rateBasisPoints: 1_000 },
    { upperBoundMinor: 6_745_000, rateBasisPoints: 1_200 },
    { upperBoundMinor: 10_570_000, rateBasisPoints: 2_200 },
    { upperBoundMinor: 20_175_000, rateBasisPoints: 2_400 },
    { upperBoundMinor: 25_620_000, rateBasisPoints: 3_200 },
    { upperBoundMinor: 64_060_000, rateBasisPoints: 3_500 },
    { upperBoundMinor: null, rateBasisPoints: 3_700 },
  ]),
});

const DEFINITION = Object.freeze({
  code: "US",
  name: "United States 2026 federal ordinary-income tax",
  currency: "USD",
  supported: [
    "tax year 2026 federal ordinary-income rate schedules",
    "single, married filing jointly, married filing separately and head-of-household filing statuses",
    "10%, 12%, 22%, 24%, 32%, 35% and 37% marginal rates",
    "whole-dollar taxable-income flooring before rate-schedule calculation",
  ],
  unsupported: [
    "gross income, adjusted gross income, deduction and taxable-income derivation",
    "filing-status, dependent, residency, citizenship and return-filing eligibility",
    "qualified dividends, capital gains and other preferential-rate schedules",
    "alternative minimum tax, net investment income tax and additional Medicare tax",
    "child, dependent, earned-income, foreign-tax and other credits",
    "self-employment tax, payroll taxes, withholding, estimated payments and prior payments",
    "state, District of Columbia, territory and local income taxes",
    "estate, trust, expatriation, gift and estate tax calculations",
    "penalties, interest, refunds, treaty positions and return reconciliation",
  ],
  assumptions: [
    "The caller supplied federal taxable income after all legally applicable adjustments and deductions.",
    "The caller selected the legally applicable filing status without supplying identity or relationship evidence.",
    "All supplied taxable income is subject to the ordinary federal rate schedule and not a preferential or separate schedule.",
    "The result is federal regular income tax before credits, additional taxes, withholding and prior payments.",
  ],
  sources: [
    {
      sourceId: "us.irs.rev-proc-2025-32.section-4-01",
      publisher: "Internal Revenue Service",
      publisherType: "tax-authority",
      title: "Revenue Procedure 2025-32 — 2026 tax rate tables",
      url: "https://www.irs.gov/irb/2025-45_IRB",
      jurisdiction: "US",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "us.irs.inflation-adjustments-2026",
      publisher: "Internal Revenue Service",
      publisherType: "tax-authority",
      title: "Inflation-adjusted tax items for tax year 2026",
      url: "https://www.irs.gov/newsroom/inflation-adjusted-tax-items-by-tax-year",
      jurisdiction: "US",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const unitedStatesPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `us-${TAX_YEAR}-federal-ordinary-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: FILING_STATUSES,
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "filingStatus", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed United States federal ordinary-income scope",
            description: "The caller confirms that the filing status and federal taxable income are legally applicable to the ordinary-rate calculation.",
            "x-taxcraft-kind": "confirmed-status",
          },
          filingStatus: {
            type: "string",
            enum: FILING_STATUSES,
            title: "Federal filing status",
            description: "Caller-confirmed filing status for the 2026 federal ordinary-income rate schedule.",
            "x-taxcraft-kind": "enum",
          },
          taxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Federal taxable income",
            description: "Federal taxable income in US cents after applicable adjustments and deductions.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "USD",
          },
        },
      },
      rounding: [
        { stage: "taxable-income", mode: "floor", unitMinor: 100 },
        { stage: "federal-ordinary-income-tax", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: { [TAX_YEAR]: model() },
});

function model() {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const taxableIncomeUsedMinor = Math.floor(facts.taxableIncomeMinor / 100) * 100;
      const result = calculateProgressiveBands({
        taxableMinor: taxableIncomeUsedMinor,
        bands: BANDS_BY_FILING_STATUS[facts.filingStatus],
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `us.pit.${TAX_YEAR}.${facts.filingStatus}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} federal ordinary-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `us.pit.${TAX_YEAR}.${facts.filingStatus}.zero-income`,
          label: "Zero federal ordinary income tax",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          taxableIncomeUsedMinor,
          incomeTaxMinor: result.taxMinor,
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
  return `${rateBasisPoints / 100}%`;
}
