import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const STATE_BANDS = Object.freeze([
  { upperBoundMinor: 2_200_000, baseTaxMinor: 0, rateBasisPoints: 1_264 },
  { upperBoundMinor: 3_260_000, baseTaxMinor: 278_080, rateBasisPoints: 1_900 },
  { upperBoundMinor: 4_010_000, baseTaxMinor: 479_480, rateBasisPoints: 3_025 },
  { upperBoundMinor: 5_210_000, baseTaxMinor: 706_355, rateBasisPoints: 3_325 },
  { upperBoundMinor: null, baseTaxMinor: 1_105_355, rateBasisPoints: 3_750 },
]);
const LOWER_BOUNDS_MINOR = Object.freeze([0, 2_200_000, 3_260_000, 4_010_000, 5_210_000]);

const DEFINITION = Object.freeze({
  code: "FI",
  name: "Finland 2026 state and municipal earned-income tax",
  currency: "EUR",
  supported: [
    "calendar-year 2026 state income tax on caller-confirmed taxable earned income",
    "12.64%, 19.00%, 30.25%, 33.25% and 37.50% state income-tax bands",
    "caller-confirmed municipal taxable earned income and municipal income-tax rate",
    "separate national and municipal tax reporting",
    "cent-level deterministic calculation and line-total reconciliation",
  ],
  unsupported: [
    "gross-income, net-earned-income, deduction and taxable-income derivation",
    "earned-income deduction, basic allowance, work-income credit and other tax-credit calculations",
    "church tax, public broadcasting tax, health-care contribution and daily-allowance contribution",
    "pension, unemployment and other employee insurance contributions",
    "capital income, pension income, benefits, business income and foreign income",
    "municipality identification, municipal-rate lookup, residence and treaty determinations",
    "withholding, prepayments, refunds, penalties, interest and assessment reconciliation",
  ],
  assumptions: [
    "The caller supplied the final taxable earned-income base for state taxation after all legally applicable deductions.",
    "The caller supplied the final taxable earned-income base for municipal taxation after all legally applicable deductions.",
    "The caller supplied the applicable municipal income-tax rate in basis points, where 800 means 8.00%.",
    "No church tax, broadcasting tax, contribution, credit or other tax layer is included.",
  ],
  sources: [
    {
      sourceId: "fi.vero.state-earned-income-scale-2026",
      publisher: "Finnish Tax Administration",
      publisherType: "tax-authority",
      title: "State income tax scale for earned income — 2026",
      url: "https://www.vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/tulot/ansiotulot/",
      jurisdiction: "FI",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "fi.vero.tax-bases-2026",
      publisher: "Finnish Tax Administration",
      publisherType: "tax-authority",
      title: "Tax bases for earned income — 2026",
      url: "https://www.vero.fi/en/individuals/tax-cards-and-tax-returns/tax_card/tax-rate-and-income-ceiling/tax-bases/",
      jurisdiction: "FI",
      retrievedAt: "2026-07-24",
    },
  ],
});

export const finlandPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `fi-${TAX_YEAR}-state-municipal-earned-income-v1`,
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
            title: "Confirmed Finland 2026 earned-income scope",
            description: "The caller confirms the supplied taxable bases and municipal rate fit the supported 2026 earned-income calculation.",
            "x-taxcraft-kind": "confirmed-status",
          },
          stateTaxableEarnedIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "State taxable earned income",
            description: "Caller-confirmed taxable earned income for state taxation in euro cents after legally applicable deductions.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
          municipalTaxableEarnedIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Municipal taxable earned income",
            description: "Caller-confirmed taxable earned income for municipal taxation in euro cents after legally applicable deductions.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
          municipalTaxRateBasisPoints: {
            type: "integer",
            minimum: 0,
            maximum: 2_000,
            title: "Municipal income-tax rate",
            description: "Caller-confirmed municipal rate in basis points; 800 means 8.00%.",
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
      const stateIncomeTaxMinor = calculateStateIncomeTax(facts.stateTaxableEarnedIncomeMinor);
      const municipalIncomeTaxMinor = applyRate(
        facts.municipalTaxableEarnedIncomeMinor,
        facts.municipalTaxRateBasisPoints,
      );
      const totalIncomeTaxMinor = stateIncomeTaxMinor + municipalIncomeTaxMinor;

      return {
        currency: DEFINITION.currency,
        totals: {
          stateTaxableEarnedIncomeMinor: facts.stateTaxableEarnedIncomeMinor,
          stateIncomeTaxMinor,
          municipalTaxableEarnedIncomeMinor: facts.municipalTaxableEarnedIncomeMinor,
          municipalTaxRateBasisPoints: facts.municipalTaxRateBasisPoints,
          municipalIncomeTaxMinor,
          totalIncomeTaxMinor,
        },
        lines: [
          {
            ruleId: `fi.pit.${TAX_YEAR}.state-earned-income-tax`,
            label: "State income tax on taxable earned income",
            amountMinor: stateIncomeTaxMinor,
            sourceIds: ["fi.vero.state-earned-income-scale-2026"],
          },
          {
            ruleId: `fi.pit.${TAX_YEAR}.municipal-earned-income-tax`,
            label: "Municipal income tax on taxable earned income",
            amountMinor: municipalIncomeTaxMinor,
            sourceIds: ["fi.vero.tax-bases-2026"],
          },
        ],
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function calculateStateIncomeTax(taxableIncomeMinor) {
  for (let index = 0; index < STATE_BANDS.length; index += 1) {
    const band = STATE_BANDS[index];
    if (band.upperBoundMinor === null || taxableIncomeMinor <= band.upperBoundMinor) {
      const excessMinor = taxableIncomeMinor - LOWER_BOUNDS_MINOR[index];
      return band.baseTaxMinor + applyRate(excessMinor, band.rateBasisPoints);
    }
  }
  throw new Error("Finland state tax band resolution failed.");
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
