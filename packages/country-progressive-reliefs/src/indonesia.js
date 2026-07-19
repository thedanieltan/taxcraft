import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze(["2024", "2025", "2026"]);
const THOUSAND_IDR_MINOR = 1_000;

const PTKP_BY_SCHEDULE = Object.freeze({
  "individual-0": 54_000_000,
  "individual-1": 58_500_000,
  "individual-2": 63_000_000,
  "individual-3": 67_500_000,
  "married-0": 58_500_000,
  "married-1": 63_000_000,
  "married-2": 67_500_000,
  "married-3": 72_000_000,
  "married-combined-income-0": 112_500_000,
  "married-combined-income-1": 117_000_000,
  "married-combined-income-2": 121_500_000,
  "married-combined-income-3": 126_000_000,
});

const DEFINITION = Object.freeze({
  code: "ID",
  name: "Indonesia resident individual income tax",
  currency: "IDR",
  supported: [
    "annual resident individual income tax from caller-confirmed annual net income",
    "statutory non-taxable-income schedules for an individual, married taxpayer and combined spousal income with zero to three dependants",
    "taxable income rounded down to the nearest IDR 1,000",
    "5%, 15%, 25%, 30% and 35% progressive rates",
    "calendar years 2024 through 2026",
  ],
  unsupported: [
    "annual net-income, deductible-expense and employment-cost derivation",
    "legal eligibility for a PTKP schedule, residence, source or dependent classification",
    "separate-spouse elections and allocation of combined household income",
    "final-tax, deemed-profit, micro-enterprise and category-specific regimes",
    "withholding credits, instalments, prior payments, refunds and filing reconciliation",
  ],
  assumptions: [
    "The caller supplied annual net income after all legally applicable deductions other than PTKP.",
    "The caller selected the legally applicable PTKP schedule without providing identity data.",
    "The result excludes final-tax regimes, withholding reconciliation and legal eligibility decisions.",
  ],
  sources: [
    {
      sourceId: "id.djp.individual-income-tax-calculation",
      publisher: "Direktorat Jenderal Pajak",
      publisherType: "tax-authority",
      title: "Mekanisme Penghitungan Pajak Penghasilan Orang Pribadi",
      url: "https://www.pajak.go.id/id/mekanisme-penghitungan-pajak-penghasilan-orang-pribadi",
      jurisdiction: "ID",
      retrievedAt: "2026-07-19",
    },
    {
      sourceId: "id.djp.tax-harmonisation-law-7-2021",
      publisher: "Direktorat Jenderal Pajak",
      publisherType: "tax-authority",
      title: "Undang-Undang Nomor 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan",
      url: "https://pajak.go.id/index.php/en/node/74838",
      jurisdiction: "ID",
      retrievedAt: "2026-07-19",
    },
    {
      sourceId: "id.djp.current-article-17-rates",
      publisher: "Direktorat Jenderal Pajak",
      publisherType: "tax-authority",
      title: "Pajak dan Kebangkitan Nasional — current Article 17 individual rates",
      url: "https://stats.pajak.go.id/id/artikel/pajak-dan-kebangkitan-nasional",
      jurisdiction: "ID",
      retrievedAt: "2026-07-19",
    },
  ],
});

export const indonesiaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((taxYear) => ({
      taxYear,
      modelVersion: `id-${taxYear}-v1`,
      status: taxYear === "2026" ? "current" : "historical-supported",
      order: Number(taxYear),
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["resident-annual-net-income-with-ptkp"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "nonTaxableIncomeSchedule", "annualNetIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Indonesia resident PIT scope",
            description: "The caller confirms the supplied amount is annual net income governed by the ordinary resident individual schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          nonTaxableIncomeSchedule: {
            type: "string",
            title: "Statutory non-taxable-income schedule",
            description: "Select the legally applicable PTKP schedule without providing marital-status, dependent or identity data.",
            enum: Object.keys(PTKP_BY_SCHEDULE),
            "x-taxcraft-kind": "plain",
          },
          annualNetIncomeMinor: {
            type: "integer",
            title: "Annual net income",
            description: "Caller-confirmed annual net income in IDR after deductions other than PTKP.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "IDR",
          },
        },
      },
      rounding: [
        { stage: "taxable-income", mode: "floor", unitMinor: THOUSAND_IDR_MINOR },
        { stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map((taxYear) => [taxYear, model(taxYear)])),
});

function model(taxYear) {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const nonTaxableIncomeMinor = PTKP_BY_SCHEDULE[facts.nonTaxableIncomeSchedule];
      const taxableIncomeBeforeRoundingMinor = Math.max(
        0,
        facts.annualNetIncomeMinor - nonTaxableIncomeMinor,
      );
      const taxableIncomeMinor = Math.floor(
        taxableIncomeBeforeRoundingMinor / THOUSAND_IDR_MINOR,
      ) * THOUSAND_IDR_MINOR;
      const progressive = calculateProgressiveBands({
        taxableMinor: taxableIncomeMinor,
        bands: [
          { upperBoundMinor: 60_000_000, rateBasisPoints: 500 },
          { upperBoundMinor: 250_000_000, rateBasisPoints: 1_500 },
          { upperBoundMinor: 500_000_000, rateBasisPoints: 2_500 },
          { upperBoundMinor: 5_000_000_000, rateBasisPoints: 3_000 },
          { upperBoundMinor: null, rateBasisPoints: 3_500 },
        ],
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `id.pit.${taxYear}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} resident income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `id.pit.${taxYear}.zero-taxable-income`,
          label: "No taxable income after the selected PTKP schedule",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          annualNetIncomeMinor: facts.annualNetIncomeMinor,
          nonTaxableIncomeMinor,
          taxableIncomeBeforeRoundingMinor,
          taxableIncomeMinor,
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
  return `${rateBasisPoints / 100}%`;
}
