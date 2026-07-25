import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const STATE_TAX_THRESHOLD_MINOR = 64_300_000;
const STATE_TAX_RATE_BASIS_POINTS = 2_000;

const DEFINITION = Object.freeze({
  code: "SE",
  name: "Sweden 2026 state and municipal earned-income tax",
  currency: "SEK",
  supported: [
    "calendar-year 2026 state income tax on caller-confirmed taxable earned income",
    "20% state income tax above the SEK 643,000 taxable earned-income threshold",
    "caller-confirmed municipal taxable earned income and municipal income-tax rate",
    "separate national and municipal tax reporting",
    "öre-level deterministic calculation and line-total reconciliation",
  ],
  unsupported: [
    "gross-income, assessed-income, basic-allowance and taxable-income derivation",
    "earned-income tax credit, pension tax reduction and other credit calculations",
    "public-service fee, church fee, funeral fee and other municipality-linked charges",
    "employee social-insurance and pension contribution calculations",
    "capital income, pension income, benefits, business income and foreign income",
    "municipality identification, municipal-rate lookup, residence and treaty determinations",
    "withholding, preliminary tax, refunds, penalties, interest and assessment reconciliation",
  ],
  assumptions: [
    "The caller supplied final taxable earned income for state taxation after the basic allowance and all legally applicable deductions.",
    "The caller supplied final taxable earned income for municipal taxation after the basic allowance and all legally applicable deductions.",
    "The caller supplied the applicable combined municipal income-tax rate in basis points, where 3,238 means 32.38%.",
    "No public-service fee, church fee, funeral fee, tax credit or contribution is included.",
  ],
  sources: [
    {
      sourceId: "se.skatteverket.state-income-tax-2026",
      publisher: "Swedish Tax Agency",
      publisherType: "tax-authority",
      title: "State income tax threshold and rate — income year 2026",
      url: "https://www.skatteverket.se/privat/etjansterochblanketter/svarpavanligafragor/inkomstavtjanst/privattjansteinkomsterfaq/narskamanbetalastatliginkomstskattochhurhogarden.5.10010ec103545f243e8000166.html",
      jurisdiction: "SE",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "se.skatteverket.amounts-percentages-2026",
      publisher: "Swedish Tax Agency",
      publisherType: "tax-authority",
      title: "Amounts and percentages — income year 2026",
      url: "https://www.skatteverket.se/privat/skatter/beloppochprocent/2026.4.1522bf3f19aea8075ba21.html",
      jurisdiction: "SE",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "se.skatteverket.salary-taxation",
      publisher: "Swedish Tax Agency",
      publisherType: "tax-authority",
      title: "How salary is taxed and why municipal rates vary",
      url: "https://www.skatteverket.se/privat/skatter/arbeteochinkomst/sabeskattasdinlon.4.54a3d27615036ac09f316ce.html",
      jurisdiction: "SE",
      retrievedAt: "2026-07-24",
    },
  ],
});

export const swedenPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `se-${TAX_YEAR}-state-municipal-earned-income-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["earned-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: true,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "scopeConfirmed",
          "stateTaxableEarnedIncomeMinor",
          "municipalTaxableEarnedIncomeMinor",
          "municipalTaxRateBasisPoints",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Sweden 2026 earned-income scope",
            description: "The caller confirms the supplied taxable bases and municipal rate fit the supported 2026 earned-income calculation.",
            "x-taxcraft-kind": "confirmed-status",
          },
          stateTaxableEarnedIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "State taxable earned income",
            description: "Caller-confirmed taxable earned income for state taxation in öre after the basic allowance and applicable deductions.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "SEK",
          },
          municipalTaxableEarnedIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Municipal taxable earned income",
            description: "Caller-confirmed taxable earned income for municipal taxation in öre after the basic allowance and applicable deductions.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "SEK",
          },
          municipalTaxRateBasisPoints: {
            type: "integer",
            minimum: 0,
            maximum: 4_000,
            title: "Municipal income-tax rate",
            description: "Caller-confirmed municipal rate in basis points; 3,238 means 32.38%.",
            "x-taxcraft-kind": "percentage-basis-points",
          },
        },
      },
      rounding: [
        { stage: "state-income-tax", mode: "floor", unitMinor: 1 },
        { stage: "municipal-income-tax", mode: "floor", unitMinor: 1 },
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
      const stateTaxableExcessMinor = Math.max(
        0,
        facts.stateTaxableEarnedIncomeMinor - STATE_TAX_THRESHOLD_MINOR,
      );
      const stateIncomeTaxMinor = applyRate(
        stateTaxableExcessMinor,
        STATE_TAX_RATE_BASIS_POINTS,
      );
      const municipalIncomeTaxMinor = applyRate(
        facts.municipalTaxableEarnedIncomeMinor,
        facts.municipalTaxRateBasisPoints,
      );
      const totalIncomeTaxMinor = stateIncomeTaxMinor + municipalIncomeTaxMinor;

      return {
        currency: DEFINITION.currency,
        totals: {
          stateTaxableEarnedIncomeMinor: facts.stateTaxableEarnedIncomeMinor,
          stateTaxThresholdMinor: STATE_TAX_THRESHOLD_MINOR,
          stateTaxableExcessMinor,
          stateIncomeTaxMinor,
          municipalTaxableEarnedIncomeMinor: facts.municipalTaxableEarnedIncomeMinor,
          municipalTaxRateBasisPoints: facts.municipalTaxRateBasisPoints,
          municipalIncomeTaxMinor,
          totalIncomeTaxMinor,
        },
        lines: [
          {
            ruleId: `se.pit.${TAX_YEAR}.state-earned-income-tax`,
            label: "State income tax above the taxable earned-income threshold",
            amountMinor: stateIncomeTaxMinor,
            sourceIds: ["se.skatteverket.state-income-tax-2026", "se.skatteverket.amounts-percentages-2026"],
          },
          {
            ruleId: `se.pit.${TAX_YEAR}.municipal-earned-income-tax`,
            label: "Municipal income tax on taxable earned income",
            amountMinor: municipalIncomeTaxMinor,
            sourceIds: ["se.skatteverket.amounts-percentages-2026", "se.skatteverket.salary-taxation"],
          },
        ],
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function applyRate(amountMinor, basisPoints) {
  return Math.floor(amountMinor * basisPoints / 10_000);
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}
