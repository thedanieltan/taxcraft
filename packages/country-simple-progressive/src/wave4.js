import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);

export const SIMPLE_PROGRESSIVE_WAVE_4_JURISDICTIONS = Object.freeze([
  {
    code: "UG",
    name: "Uganda individual income tax",
    currency: "UGX",
    taxYearBasis: "year-of-income",
    kind: "resident-schedule",
    supported: [
      "annual individual income tax on caller-confirmed chargeable income",
      "resident and non-resident schedules",
      "additional 10% rate on chargeable income above UGX 120,000,000",
      "years of income 2024 through 2026",
    ],
    unsupported: [
      "chargeable-income and deduction derivation",
      "PAYE reconciliation, withholding and prior tax payments",
      "rental, business and category-specific tax regimes",
      "residence, source and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied annual chargeable income after allowable deductions.",
      "The caller selected the legally applicable resident or non-resident schedule without providing identity data.",
      "The result excludes withholding reconciliation and category-specific taxes.",
    ],
    sources: [
      {
        sourceId: "ug.ura.individual-income-tax-rates",
        publisher: "Uganda Revenue Authority",
        publisherType: "tax-authority",
        title: "Domestic Taxes FAQs — individual income tax and PAYE rates",
        url: "https://ura.go.ug/en/dt-faqs/",
        jurisdiction: "UG",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "ug.ura.taxation-handbook-2024-25",
        publisher: "Uganda Revenue Authority",
        publisherType: "tax-authority",
        title: "Taxation Handbook 7th Edition 2024-25",
        url: "https://ura.go.ug/en/download/taxation-handbook-7th-edition/",
        jurisdiction: "UG",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "ug.ura.taxation-handbook-2025-26",
        publisher: "Uganda Revenue Authority",
        publisherType: "tax-authority",
        title: "Taxation Handbook 8th Edition 2025-26",
        url: "https://ura.go.ug/en/download/taxation-handbook-8th-edition-2025-26/",
        jurisdiction: "UG",
        retrievedAt: "2026-07-18",
      },
    ],
  },
  {
    code: "GT",
    name: "Guatemala employment income tax",
    currency: "GTQ",
    taxYearBasis: "calendar-year",
    kind: "taxable-employment-income",
    supported: [
      "annual employment income tax on caller-confirmed taxable employment income",
      "5% on the first GTQ 300,000 and 7% on the excess",
      "calendar years 2024 through 2026",
    ],
    unsupported: [
      "employment-income and deduction derivation",
      "personal-expense, VAT, donation, insurance and social-contribution eligibility",
      "employer withholding reconciliation and refunds",
      "residence, source and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied taxable employment income after all applicable deductions.",
      "The result excludes employer withholding reconciliation, credits and refunds.",
    ],
    sources: [
      {
        sourceId: "gt.sat.income-tax-law-decree-10-2012",
        publisher: "Superintendencia de Administración Tributaria",
        publisherType: "tax-authority",
        title: "Decree 10-2012 — Tax Update Law, Book I Income Tax",
        url: "https://portal.sat.gob.gt/portal/leyes-reglamentos-los-impuestos/",
        jurisdiction: "GT",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "gt.sat.employee-income-tax-calculator",
        publisher: "Superintendencia de Administración Tributaria",
        publisherType: "tax-authority",
        title: "Cálculo ISR Asalariados",
        url: "https://portal.sat.gob.gt/portal/calculo-isr-asalariados/",
        jurisdiction: "GT",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "gt.sat.employee-deductions-faq",
        publisher: "Superintendencia de Administración Tributaria",
        publisherType: "tax-authority",
        title: "Cumplimiento Tributario — ISR employment deductions",
        url: "https://portal.sat.gob.gt/portal/preguntas-frecuentes/cumplimiento-tributario/",
        jurisdiction: "GT",
        retrievedAt: "2026-07-18",
      },
    ],
  },
]);

export const simpleProgressiveWave4Packages = Object.freeze([
  createUgandaPackage(SIMPLE_PROGRESSIVE_WAVE_4_JURISDICTIONS[0]),
  createGuatemalaPackage(SIMPLE_PROGRESSIVE_WAVE_4_JURISDICTIONS[1]),
]);

function taxYears(code) {
  return TAX_YEARS.map((year) => ({
    taxYear: String(year),
    modelVersion: `${code.toLowerCase()}-${year}-v1`,
    status: year === 2026 ? "current" : "historical-supported",
    order: year,
  }));
}

function manifest(definition, factsSchema) {
  return {
    jurisdiction: definition.code,
    name: definition.name,
    storesUserPII: false,
    advisory: false,
    taxYears: taxYears(definition.code),
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
  };
}

function createUgandaPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Uganda individual-income-tax scope",
        description: "The caller confirms the amount is annual chargeable income governed by the individual schedule.",
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
        description: "Caller-confirmed annual chargeable income in UGX.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "UGX",
      },
    },
  };

  return definePitCountryPackage({
    manifest: manifest(definition, factsSchema),
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), ugandaModel(definition, year)])),
  });
}

function ugandaModel(definition, year) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const bands = facts.individualTaxSchedule === "resident"
        ? [
          { upperBoundMinor: 2_820_000, rateBasisPoints: 0 },
          { upperBoundMinor: 4_020_000, rateBasisPoints: 1000 },
          { upperBoundMinor: 4_920_000, rateBasisPoints: 2000 },
          { upperBoundMinor: 120_000_000, rateBasisPoints: 3000 },
          { upperBoundMinor: null, rateBasisPoints: 4000 },
        ]
        : [
          { upperBoundMinor: 4_020_000, rateBasisPoints: 1000 },
          { upperBoundMinor: 4_920_000, rateBasisPoints: 2000 },
          { upperBoundMinor: 120_000_000, rateBasisPoints: 3000 },
          { upperBoundMinor: null, rateBasisPoints: 4000 },
        ];
      return progressiveResult({
        definition,
        year,
        taxBaseMinor: facts.annualChargeableIncomeMinor,
        bands,
        totalKey: "annualChargeableIncomeMinor",
        ruleSuffix: facts.individualTaxSchedule,
      });
    },
  };
}

function createGuatemalaPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "annualTaxableEmploymentIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Guatemala taxable employment-income scope",
        description: "The caller confirms the amount is annual taxable employment income after applicable deductions.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      annualTaxableEmploymentIncomeMinor: {
        type: "integer",
        title: "Annual taxable employment income",
        description: "Caller-confirmed annual taxable employment income in GTQ.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "GTQ",
      },
    },
  };

  return definePitCountryPackage({
    manifest: manifest(definition, factsSchema),
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), guatemalaModel(definition, year)])),
  });
}

function guatemalaModel(definition, year) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      return progressiveResult({
        definition,
        year,
        taxBaseMinor: facts.annualTaxableEmploymentIncomeMinor,
        bands: [
          { upperBoundMinor: 30_000_000, rateBasisPoints: 500 },
          { upperBoundMinor: null, rateBasisPoints: 700 },
        ],
        totalKey: "annualTaxableEmploymentIncomeMinor",
        ruleSuffix: "employment",
      });
    },
  };
}

function progressiveResult({ definition, year, taxBaseMinor, bands, totalKey, ruleSuffix }) {
  const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
  const result = calculateProgressiveBands({
    taxableMinor: taxBaseMinor,
    bands,
    rounding: ROUNDING_MODE.HALF_UP,
  });
  const lines = result.bands.map((band) => ({
    ruleId: `${definition.code.toLowerCase()}.pit.${year}.${ruleSuffix}.band-${band.index + 1}`,
    label: `${formatRate(band.rateBasisPoints)} progressive band`,
    amountMinor: band.taxMinor,
    sourceIds,
  }));
  if (lines.length === 0) {
    lines.push({
      ruleId: `${definition.code.toLowerCase()}.pit.${year}.${ruleSuffix}.zero-income`,
      label: "Income tax on zero tax base",
      amountMinor: 0,
      sourceIds,
    });
  }
  return {
    currency: definition.currency,
    totals: {
      [totalKey]: taxBaseMinor,
      incomeTaxMinor: result.taxMinor,
    },
    lines,
    assumptions: [...definition.assumptions],
    coverage: coverage(definition),
  };
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
