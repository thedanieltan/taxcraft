import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";

export const SIMPLE_PROGRESSIVE_WAVE_12_JURISDICTIONS = Object.freeze([
  {
    code: "AD",
    name: "Andorra standard resident general-income tax",
    currency: "EUR",
    taxYearBasis: "calendar-year",
    kind: "standard-resident-general-net-income",
    supported: [
      "calendar-year 2026 standard resident general-income schedule",
      "standard EUR 24,000 personal minimum",
      "effective 0%, 5% and 10% bands produced by the statutory 10% rate and capped 50% general-income bonus",
    ],
    unsupported: [
      "gross-income, expense, integration, compensation and net-income derivation",
      "EUR 30,000 disability minimum and EUR 40,000 spouse-related personal minimum",
      "dependant, mortgage, pension, compensatory-payment and other personal or family reductions",
      "savings-base income, its EUR 3,000 minimum and capital-gain calculations",
      "internal and international double-tax deductions, investment deductions and employment-creation deductions",
      "withholding, instalments, filing balances, prior payments, penalties, interest and refunds",
      "residence, source, income classification and filing-obligation determinations",
    ],
    assumptions: [
      "The caller is an Andorran tax resident and confirmed that the standard resident general-income schedule applies.",
      "The supplied amount is annual general net income before only the standard EUR 24,000 personal minimum and contains no savings-base income.",
      "No enhanced personal minimum, family reduction, other base reduction or tax deduction applies.",
    ],
    sources: [
      {
        sourceId: "ad.govern.irpf-effective-rates",
        publisher: "Government of Andorra",
        publisherType: "government-agency",
        title: "What percentage will I have to pay?",
        url: "https://www.govern.ad/ca/l/4191537",
        jurisdiction: "AD",
        retrievedAt: "2026-07-22",
      },
      {
        sourceId: "ad.govern.irpf-general-rate",
        publisher: "Government of Andorra",
        publisherType: "government-agency",
        title: "What is the IRPF tax rate?",
        url: "https://www.govern.ad/ca/l/4191328",
        jurisdiction: "AD",
        retrievedAt: "2026-07-22",
      },
      {
        sourceId: "ad.govern.irpf-general-income-bonus",
        publisher: "Government of Andorra",
        publisherType: "government-agency",
        title: "Bonus for employment, economic-activity or real-estate-capital income",
        url: "https://www.govern.ad/ca/l/4191336",
        jurisdiction: "AD",
        retrievedAt: "2026-07-22",
      },
    ],
  },
]);

export const simpleProgressiveWave12Packages = Object.freeze([
  createAndorraPackage(SIMPLE_PROGRESSIVE_WAVE_12_JURISDICTIONS[0]),
]);

function createAndorraPackage(definition) {
  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears: [{
        taxYear: TAX_YEAR,
        modelVersion: `ad-${TAX_YEAR}-v1`,
        status: "current",
        order: 2026,
      }],
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
        factsSchema: {
          type: "object",
          additionalProperties: false,
          required: ["scopeConfirmed", "generalNetIncomeMinor"],
          properties: {
            scopeConfirmed: {
              type: "boolean",
              title: "Confirmed Andorra standard resident scope",
              description: "The caller confirms the standard resident general-income schedule and EUR 24,000 personal minimum apply.",
              const: true,
              "x-taxcraft-kind": "confirmed-status",
            },
            generalNetIncomeMinor: {
              type: "integer",
              title: "Annual general net income",
              description: "Caller-confirmed annual general net income before the standard EUR 24,000 personal minimum.",
              minimum: 0,
              "x-taxcraft-kind": "money-minor",
              "x-taxcraft-currency": "EUR",
            },
          },
        },
        rounding: [{ stage: "annual-general-income-tax", mode: "half-up", unitMinor: 1 }],
        maintenance: { mode: "manual", sourceWatch: false },
      },
    },
    sources: definition.sources,
    models: {
      [TAX_YEAR]: model(definition),
    },
  });
}

function model(definition) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const result = calculateProgressiveBands({
        taxableMinor: facts.generalNetIncomeMinor,
        bands: [
          { upperBoundMinor: 2_400_000, rateBasisPoints: 0 },
          { upperBoundMinor: 4_000_000, rateBasisPoints: 500 },
          { upperBoundMinor: null, rateBasisPoints: 1_000 },
        ],
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `ad.pit.${TAX_YEAR}.standard-general-income.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} standard general-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `ad.pit.${TAX_YEAR}.standard-general-income.zero-income`,
          label: "Income tax on zero general net income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          generalNetIncomeMinor: facts.generalNetIncomeMinor,
          standardPersonalMinimumMinor: 2_400_000,
          generalIncomeBonusCapMinor: 80_000,
          incomeTaxMinor: result.taxMinor,
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
