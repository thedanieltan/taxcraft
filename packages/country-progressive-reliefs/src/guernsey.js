import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const STANDARD_RATE_BASIS_POINTS = 2_200;
const BANDS = Object.freeze([
  { upperBoundMinor: null, rateBasisPoints: STANDARD_RATE_BASIS_POINTS },
]);

const DEFINITION = Object.freeze({
  code: "GG",
  name: "Guernsey individual standard-rate income tax",
  currency: "GBP",
  supported: [
    "year-of-charge 2026 individual income tax at the enacted 22% standard rate",
    "caller-confirmed chargeable income after all applicable allowances, deductions and reliefs",
  ],
  unsupported: [
    "gross-income, deduction, allowance, relief and chargeable-income derivation",
    "personal, dependant, mortgage-interest, pension and other allowance eligibility",
    "standard-charge elections, tax caps and limits on qualifying or non-qualifying income",
    "Alderney-specific limits, non-resident treatment and temporary-residence rules",
    "social-insurance contributions, ETI withholding, instalments and assessment reconciliation",
    "foreign-tax credit, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied chargeable income after all legally applicable allowances, deductions and reliefs.",
    "The individual standard-rate method applies and no standard-charge election or tax cap is claimed.",
    "The supplied amount is governed by the Guernsey 2026 year-of-charge rules.",
  ],
  sources: [
    {
      sourceId: "gg.states.standard-rate-2025-2026",
      publisher: "States of Deliberation of Guernsey",
      publisherType: "legislature",
      title: "Annual Budget for 2025 — individual standard rate for Years of Charge 2025 and 2026",
      url: "https://statesvoting-records.gov.gg/Propositions/Details/1713",
      jurisdiction: "GG",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "gg.states.allowances-year-of-charge-2026",
      publisher: "States of Deliberation of Guernsey",
      publisherType: "legislature",
      title: "Annual Budget for 2026 — allowances for the Year of Charge 2026",
      url: "https://statesvoting-records.gov.gg/Propositions/Details/2432",
      jurisdiction: "GG",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "gg.states.standard-charge-2026",
      publisher: "States of Deliberation of Guernsey",
      publisherType: "legislature",
      title: "Annual Budget for 2026 — standard charge",
      url: "https://statesvoting-records.gov.gg/Propositions/Details/2412",
      jurisdiction: "GG",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const guernseyPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `gg-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["individual-standard-rate-chargeable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "chargeableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Guernsey standard-rate scope",
            description: "The caller confirms that the ordinary individual standard-rate method applies to the supplied chargeable income.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          chargeableIncomeMinor: {
            type: "integer",
            title: "Chargeable income",
            description: "Caller-confirmed chargeable income in pounds sterling after applicable allowances, deductions and reliefs.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "GBP",
          },
        },
      },
      rounding: [{ stage: "standard-rate-income-tax", mode: "half-up", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: {
    [TAX_YEAR]: model(),
  },
});

function model() {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const result = calculateProgressiveBands({
        taxableMinor: facts.chargeableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      return {
        currency: DEFINITION.currency,
        totals: {
          chargeableIncomeMinor: facts.chargeableIncomeMinor,
          incomeTaxMinor: result.taxMinor,
        },
        lines: [{
          ruleId: `gg.pit.${TAX_YEAR}.individual-standard-rate`,
          label: "22% individual standard rate",
          amountMinor: result.taxMinor,
          sourceIds,
        }],
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
