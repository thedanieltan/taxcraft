import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const AUSTRALIA_MODELS = Object.freeze({
  "2024-25": [
    [1_820_000, 0],
    [4_500_000, 1600],
    [13_500_000, 3000],
    [19_000_000, 3700],
    [null, 4500],
  ],
  "2025-26": [
    [1_820_000, 0],
    [4_500_000, 1600],
    [13_500_000, 3000],
    [19_000_000, 3700],
    [null, 4500],
  ],
  "2026-27": [
    [1_820_000, 0],
    [4_500_000, 1500],
    [13_500_000, 3000],
    [19_000_000, 3700],
    [null, 4500],
  ],
});

const PHILIPPINES_MODELS = Object.freeze({
  "2024": [
    [25_000_000, 0],
    [40_000_000, 1500],
    [80_000_000, 2000],
    [200_000_000, 2500],
    [800_000_000, 3000],
    [null, 3500],
  ],
  "2025": [
    [25_000_000, 0],
    [40_000_000, 1500],
    [80_000_000, 2000],
    [200_000_000, 2500],
    [800_000_000, 3000],
    [null, 3500],
  ],
  "2026": [
    [25_000_000, 0],
    [40_000_000, 1500],
    [80_000_000, 2000],
    [200_000_000, 2500],
    [800_000_000, 3000],
    [null, 3500],
  ],
});

export const SIMPLE_PROGRESSIVE_WAVE_6_JURISDICTIONS = Object.freeze([
  {
    code: "AU",
    name: "Australia resident individual income tax",
    currency: "AUD",
    taxYearBasis: "tax-year",
    taxYears: Object.keys(AUSTRALIA_MODELS),
    currentTaxYear: "2026-27",
    models: AUSTRALIA_MODELS,
    supported: [
      "annual resident individual income tax on caller-confirmed taxable income",
      "2024-25 and 2025-26 resident rates with a 16% first taxable band",
      "2026-27 resident rates with a 15% first taxable band",
      "tax years 2024-25 through 2026-27",
    ],
    unsupported: [
      "taxable-income and deduction derivation",
      "Medicare levy, Medicare levy surcharge and low-income thresholds",
      "tax offsets, rebates, study-loan repayments and withholding reconciliation",
      "foreign-resident and working-holiday-maker schedules",
      "residence, source and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied annual taxable income after applicable deductions.",
      "The ordinary Australian resident individual schedule applies.",
      "The result excludes the Medicare levy, offsets and other separate liabilities.",
    ],
    sources: [
      {
        sourceId: "au.treasury.cost-of-living-tax-cuts-2024",
        publisher: "Australian Treasury",
        publisherType: "government-agency",
        title: "Tax cuts to help with the cost of living",
        url: "https://treasury.gov.au/tax-cuts",
        jurisdiction: "AU",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "au.treasury.new-tax-cuts-2026-27",
        publisher: "Australian Treasury Ministers",
        publisherType: "government-agency",
        title: "New cost of living tax cuts under Labor",
        url: "https://ministers.treasury.gov.au/ministers/jim-chalmers-2022/media-releases/new-cost-living-tax-cuts-under-labor",
        jurisdiction: "AU",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "au.ato.payg-tables-2025",
        publisher: "Australian Taxation Office",
        publisherType: "tax-authority",
        title: "2025 Pay as you go withholding tax tables",
        url: "https://softwaredevelopers.ato.gov.au/2025-pay-you-go-payg-withholding-tax-tables",
        jurisdiction: "AU",
        retrievedAt: "2026-07-18",
      },
    ],
  },
  {
    code: "PH",
    name: "Philippines graduated individual income tax",
    currency: "PHP",
    taxYearBasis: "calendar-year",
    taxYears: Object.keys(PHILIPPINES_MODELS),
    currentTaxYear: "2026",
    models: PHILIPPINES_MODELS,
    supported: [
      "annual graduated income tax on caller-confirmed taxable income",
      "the statutory schedule effective from 1 January 2023 onwards",
      "calendar years 2024 through 2026",
    ],
    unsupported: [
      "taxable-income and deduction derivation",
      "the optional 8% gross-sales or gross-receipts regime",
      "minimum-wage exemptions and category-specific exempt compensation",
      "passive-income final taxes, capital-gains taxes and foreign-tax credits",
      "withholding reconciliation, residence, source and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied annual taxable income governed by the ordinary graduated schedule.",
      "The result excludes the optional 8% regime, final taxes and withholding reconciliation.",
    ],
    sources: [
      {
        sourceId: "ph.lawphil.train-act-individual-rates",
        publisher: "Lawphil Project",
        publisherType: "government-agency",
        title: "Republic Act No. 10963 — Tax Reform for Acceleration and Inclusion",
        url: "https://lawphil.net/statutes/repacts/ra2017/ra_10963_2017.html",
        jurisdiction: "PH",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "ph.bir.withholding-tax-calculator",
        publisher: "Bureau of Internal Revenue",
        publisherType: "tax-authority",
        title: "Withholding Tax Calculator for Employees Earning Purely Compensation Income",
        url: "https://web-services.bir.gov.ph/tax_calculator/wt_calculator.html",
        jurisdiction: "PH",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "ph.bir.tax-code",
        publisher: "Bureau of Internal Revenue",
        publisherType: "tax-authority",
        title: "National Internal Revenue Code, as amended",
        url: "https://www.bir.gov.ph/tax-code",
        jurisdiction: "PH",
        retrievedAt: "2026-07-18",
      },
    ],
  },
]);

export const simpleProgressiveWave6Packages = Object.freeze(
  SIMPLE_PROGRESSIVE_WAVE_6_JURISDICTIONS.map(createPackage),
);

function createPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "taxableIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: `Confirmed ${definition.code} ordinary individual-income-tax scope`,
        description: "The caller confirms the amount is annual taxable income governed by this package's ordinary individual schedule.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      taxableIncomeMinor: {
        type: "integer",
        title: "Annual taxable income",
        description: `Caller-confirmed annual taxable income in ${definition.currency}.`,
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": definition.currency,
      },
    },
  };

  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears: definition.taxYears.map((taxYear, index) => ({
        taxYear,
        modelVersion: `${definition.code.toLowerCase()}-${taxYear}-v1`,
        status: taxYear === definition.currentTaxYear ? "current" : "historical-supported",
        order: index + 1,
      })),
      pit: {
        contractVersion: "taxcraft.pit-country-package.v1",
        taxUnit: "individual",
        taxYearBasis: definition.taxYearBasis,
        currencyCodes: [definition.currency],
        incomeSchedules: ["annual-taxable-income"],
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
    models: Object.fromEntries(definition.taxYears.map((taxYear) => [taxYear, model(definition, taxYear)])),
  });
}

function model(definition, taxYear) {
  const bands = definition.models[taxYear].map(([upperBoundMinor, rateBasisPoints]) => ({
    upperBoundMinor,
    rateBasisPoints,
  }));

  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `${definition.code.toLowerCase()}.pit.${taxYear}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} individual income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `${definition.code.toLowerCase()}.pit.${taxYear}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          incomeTaxMinor: progressive.taxMinor,
        },
        lines,
        assumptions: [...definition.assumptions],
        coverage: coverage(definition),
      };
    },
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
