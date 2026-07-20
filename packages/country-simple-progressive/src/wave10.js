import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);

export const SIMPLE_PROGRESSIVE_WAVE_10_JURISDICTIONS = Object.freeze([
  {
    code: "TL",
    name: "Timor-Leste natural-person income tax",
    currency: "USD",
    taxYearBasis: "calendar-year",
    kind: "resident-and-non-resident-wage-or-annual-income",
    supported: [
      "monthly resident and non-resident wage income tax",
      "annual resident and non-resident natural-person income tax",
      "calendar years 2024 through 2026"
    ],
    unsupported: [
      "taxable-income, deductible-expenditure and wage-base derivation",
      "residence, source and filing-obligation determinations",
      "employer withholding, monthly payment, annual reconciliation, installments and refunds",
      "withholding tax on rent, royalties, prizes, services and other prescribed payments",
      "legal-person, petroleum, mineral and other business tax calculations"
    ],
    assumptions: [
      "The caller supplied the taxable wage or annual taxable-income amount for the selected period.",
      "The caller selected the legally applicable resident or non-resident schedule without providing identity data.",
      "The result is the tax for the selected schedule and excludes withholding administration, payments, reconciliation and filing balances."
    ],
    sources: [
      {
        sourceId: "tl.attl.wage-income-tax",
        publisher: "Autoridade Tributária Timor-Leste",
        publisherType: "tax-authority",
        title: "Wage Income Tax",
        url: "https://attl.gov.tl/wage-income-tax/",
        jurisdiction: "TL",
        retrievedAt: "2026-07-20"
      },
      {
        sourceId: "tl.attl.annual-income-tax-guidelines",
        publisher: "Autoridade Tributária Timor-Leste",
        publisherType: "tax-authority",
        title: "Annual Income Tax Return Guidelines",
        url: "https://attl.gov.tl/annual-income-tax-return-guidelines/",
        jurisdiction: "TL",
        retrievedAt: "2026-07-20"
      }
    ]
  }
]);

export const simpleProgressiveWave10Packages = Object.freeze([
  createTimorLestePackage(SIMPLE_PROGRESSIVE_WAVE_10_JURISDICTIONS[0]),
]);

function createTimorLestePackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "incomeSchedule", "individualTaxSchedule", "taxableIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Timor-Leste natural-person income-tax scope",
        description: "The caller confirms the amount is governed by the selected monthly wage or annual natural-person schedule.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      incomeSchedule: {
        type: "string",
        title: "Income schedule",
        description: "Select monthly wage income or annual natural-person taxable income.",
        enum: ["monthly-wage", "annual-taxable-income"],
        "x-taxcraft-kind": "plain",
      },
      individualTaxSchedule: {
        type: "string",
        title: "Individual tax schedule",
        description: "Select the legally applicable resident or non-resident schedule without providing identity details.",
        enum: ["resident", "non-resident"],
        "x-taxcraft-kind": "plain",
      },
      taxableIncomeMinor: {
        type: "integer",
        title: "Taxable income for the selected period",
        description: "Caller-confirmed monthly wage or annual taxable income in US dollars.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "USD",
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
        modelVersion: `tl-${year}-v1`,
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
      const bands = taxBands(facts.incomeSchedule, facts.individualTaxSchedule);
      const result = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `tl.pit.${taxYear}.${facts.incomeSchedule}.${facts.individualTaxSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${facts.individualTaxSchedule} ${facts.incomeSchedule} band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `tl.pit.${taxYear}.${facts.incomeSchedule}.${facts.individualTaxSchedule}.zero-income`,
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

function taxBands(incomeSchedule, individualTaxSchedule) {
  if (individualTaxSchedule === "non-resident") {
    return [{ upperBoundMinor: null, rateBasisPoints: 1_000 }];
  }
  const zeroBandMinor = incomeSchedule === "monthly-wage" ? 50_000 : 600_000;
  return [
    { upperBoundMinor: zeroBandMinor, rateBasisPoints: 0 },
    { upperBoundMinor: null, rateBasisPoints: 1_000 },
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
