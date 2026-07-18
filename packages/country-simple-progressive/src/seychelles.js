import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);

export const SEYCHELLES_DEFINITION = Object.freeze({
  code: "SC",
  name: "Seychelles monthly employment income tax",
  currency: "SCR",
  taxYearBasis: "calendar-year",
  kind: "monthly-employment",
  models: { "2024": {}, "2025": {}, "2026": {} },
  supported: [
    "monthly employment income tax on gross cash emoluments",
    "separate citizen and non-citizen tax schedules",
    "calendar years 2024 through 2026",
  ],
  unsupported: [
    "annual aggregation across employers or fluctuating monthly income",
    "non-monetary benefits tax and special-project 3% income",
    "arrears attribution, exemptions and employer payroll reconciliation",
    "legal-status, residence and employment-status determinations",
  ],
  assumptions: [
    "The caller supplied gross monthly cash emoluments from one employment source.",
    "The applicable employment tax schedule is caller-confirmed without providing identity data.",
    "The result excludes non-monetary benefits tax and special-project income.",
  ],
  sources: [
    {
      sourceId: "sc.src.employment-income-tax-rates",
      publisher: "Seychelles Revenue Commission",
      publisherType: "tax-authority",
      title: "Income and Non-Monetary Benefits Tax — Income Tax Rates",
      url: "https://src.gov.sc/income-and-non-monetary-benefits-tax/",
      jurisdiction: "SC",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "sc.src.payroll-regulations-2024",
      publisher: "Seychelles Revenue Commission",
      publisherType: "tax-authority",
      title: "Income and Non-Monetary Benefits Tax Payroll Regulations 2024",
      url: "https://src.gov.sc/src-highlights-changes-made-to-income-and-non-monetary-benefits-tax-payroll-regulations-2024/",
      jurisdiction: "SC",
      retrievedAt: "2026-07-18",
    },
  ],
});

export const seychellesPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: "SC",
    name: SEYCHELLES_DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((year) => ({
      taxYear: String(year),
      modelVersion: `sc-${year}-v1`,
      status: year === 2026 ? "current" : "historical-supported",
      order: year,
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: ["SCR"],
      incomeSchedules: ["monthly-employment"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "employmentTaxSchedule", "monthlyGrossEmolumentsMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Seychelles employment-income scope",
            description: "The caller confirms the amount is monthly cash emoluments from one employment source.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          employmentTaxSchedule: {
            type: "string",
            title: "Employment tax schedule",
            description: "Select the legally applicable citizen or non-citizen tax schedule without providing identity details.",
            enum: ["citizen", "non-citizen"],
            "x-taxcraft-kind": "plain",
          },
          monthlyGrossEmolumentsMinor: {
            type: "integer",
            title: "Monthly gross cash emoluments",
            description: "Monthly gross cash emoluments from one employment source in SCR.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "SCR",
          },
        },
      },
      rounding: [{ stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: SEYCHELLES_DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), model(year)])),
});

function model(year) {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const bands = facts.employmentTaxSchedule === "citizen"
        ? [
          { upperBoundMinor: 855_550, rateBasisPoints: 0 },
          { upperBoundMinor: 1_000_000, rateBasisPoints: 1500 },
          { upperBoundMinor: 8_333_300, rateBasisPoints: 2000 },
          { upperBoundMinor: null, rateBasisPoints: 3000 },
        ]
        : [
          { upperBoundMinor: 1_000_000, rateBasisPoints: 1500 },
          { upperBoundMinor: 8_333_300, rateBasisPoints: 2000 },
          { upperBoundMinor: null, rateBasisPoints: 3000 },
        ];
      const result = calculateProgressiveBands({
        taxableMinor: facts.monthlyGrossEmolumentsMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = SEYCHELLES_DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `sc.pit.${year}.${facts.employmentTaxSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} monthly employment band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `sc.pit.${year}.${facts.employmentTaxSchedule}.zero-income`,
          label: "Income tax on zero monthly emoluments",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: "SCR",
        totals: {
          monthlyGrossEmolumentsMinor: facts.monthlyGrossEmolumentsMinor,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...SEYCHELLES_DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function coverage() {
  return {
    supported: [...SEYCHELLES_DEFINITION.supported],
    unsupported: [...SEYCHELLES_DEFINITION.unsupported],
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
