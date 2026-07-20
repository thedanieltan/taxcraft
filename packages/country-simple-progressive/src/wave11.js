import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);

export const SIMPLE_PROGRESSIVE_WAVE_11_JURISDICTIONS = Object.freeze([
  {
    code: "KH",
    name: "Cambodia natural-person income tax",
    currency: "KHR",
    taxYearBasis: "calendar-year",
    kind: "resident-monthly-salary-non-resident-monthly-salary-or-resident-annual-income",
    supported: [
      "resident monthly taxable salary",
      "non-resident monthly taxable salary",
      "resident annual natural-person taxable income",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "taxable-salary, taxable-income, allowance and deduction derivation",
      "residence, source, employee and filing-obligation determinations",
      "employer withholding administration, payment, reconciliation, prior payments and refunds",
      "fringe-benefit tax and non-salary withholding taxes",
      "non-resident annual taxable-income calculations",
      "enterprise, legal-person and other business tax calculations"
    ],
    assumptions: [
      "The caller supplied the taxable salary or annual taxable-income amount after applying all legally available exclusions, allowances and deductions.",
      "The caller selected the legally applicable schedule without providing identity data.",
      "The result excludes withholding administration, payments, reconciliation, fringe-benefit tax and filing balances."
    ],
    sources: [
      {
        sourceId: "kh.gdt.monthly-salary-annual-income-bands-2024",
        publisher: "General Department of Taxation, Cambodia",
        publisherType: "tax-authority",
        title: "Sub-Decree on the Monthly Taxable Salary and the Table of Annual Taxable Income",
        url: "https://www.tax.gov.kh/en/article?key=ivits44779316122749",
        jurisdiction: "KH",
        retrievedAt: "2026-07-20"
      },
      {
        sourceId: "kh.gdt.tax-on-salary-prakas-2024",
        publisher: "General Department of Taxation, Cambodia",
        publisherType: "tax-authority",
        title: "Prakas on Tax on Salary",
        url: "https://www.tax.gov.kh/en/article?key=ZVSX420039360002117",
        jurisdiction: "KH",
        retrievedAt: "2026-07-20"
      }
    ]
  }
]);

export const simpleProgressiveWave11Packages = Object.freeze([
  createCambodiaPackage(SIMPLE_PROGRESSIVE_WAVE_11_JURISDICTIONS[0]),
]);

function createCambodiaPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "taxSchedule", "taxableIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Cambodia natural-person income-tax scope",
        description: "The caller confirms the amount is governed by the selected resident salary, non-resident salary or resident annual-income schedule.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      taxSchedule: {
        type: "string",
        title: "Natural-person tax schedule",
        description: "Select the legally applicable schedule without providing identity or residence evidence.",
        enum: [
          "resident-monthly-salary",
          "non-resident-monthly-salary",
          "resident-annual-taxable-income",
        ],
        "x-taxcraft-kind": "plain",
      },
      taxableIncomeMinor: {
        type: "integer",
        title: "Taxable amount for the selected schedule",
        description: "Caller-confirmed monthly taxable salary or annual taxable income in Cambodian riel.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "KHR",
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
        modelVersion: `kh-${year}-v1`,
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

function model(definition, taxYear) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const bands = bandsForSchedule(facts.taxSchedule);
      const result = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = sourceIdsForSchedule(definition, facts.taxSchedule);
      const lines = result.bands.map((band) => ({
        ruleId: `kh.pit.${taxYear}.${facts.taxSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${formatSchedule(facts.taxSchedule)} band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `kh.pit.${taxYear}.${facts.taxSchedule}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...definition.assumptions],
        coverage: coverage(definition),
      };
    },
  };
}

function bandsForSchedule(taxSchedule) {
  if (taxSchedule === "non-resident-monthly-salary") {
    return [{ upperBoundMinor: null, rateBasisPoints: 2_000 }];
  }
  if (taxSchedule === "resident-annual-taxable-income") {
    return [
      { upperBoundMinor: 1_800_000_000, rateBasisPoints: 0 },
      { upperBoundMinor: 2_400_000_000, rateBasisPoints: 500 },
      { upperBoundMinor: 10_200_000_000, rateBasisPoints: 1_000 },
      { upperBoundMinor: 15_000_000_000, rateBasisPoints: 1_500 },
      { upperBoundMinor: null, rateBasisPoints: 2_000 },
    ];
  }
  return [
    { upperBoundMinor: 150_000_000, rateBasisPoints: 0 },
    { upperBoundMinor: 200_000_000, rateBasisPoints: 500 },
    { upperBoundMinor: 850_000_000, rateBasisPoints: 1_000 },
    { upperBoundMinor: 1_250_000_000, rateBasisPoints: 1_500 },
    { upperBoundMinor: null, rateBasisPoints: 2_000 },
  ];
}

function sourceIdsForSchedule(definition, taxSchedule) {
  if (taxSchedule === "resident-annual-taxable-income") {
    return [definition.sources[0].sourceId];
  }
  if (taxSchedule === "non-resident-monthly-salary") {
    return [definition.sources[1].sourceId];
  }
  return definition.sources.map(({ sourceId }) => sourceId);
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

function formatSchedule(taxSchedule) {
  return taxSchedule.replaceAll("-", " ");
}
