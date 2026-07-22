import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";

export const SIMPLE_PROGRESSIVE_WAVE_12_JURISDICTIONS = Object.freeze([
  {
    code: "AD",
    name: "Andorra general-base personal income tax",
    currency: "EUR",
    taxYearBasis: "calendar-year",
    kind: "resident-general-tax-base",
    supported: [
      "calendar-year 2026 resident general tax base",
      "EUR 24,000 exempt threshold",
      "effective 5% band from EUR 24,000 through EUR 40,000",
      "10% rate above EUR 40,000",
    ],
    unsupported: [
      "gross-income, net-income, deduction and general-tax-base derivation",
      "savings tax base, including its separate EUR 3,000 exemption and 10% rate",
      "withholding, instalments, prior payments, filing balances and refunds",
      "economic-activity, capital-gain and category-specific calculations",
      "double-tax relief, deductions from quota and loss carryforwards",
      "residence, source, income classification and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied the resident general tax base after all legally applicable reductions and deductions.",
      "The effective 5% middle band is represented directly rather than as a 50% rebate against the 10% general rate.",
      "Savings-base income and all quota deductions are excluded from the supplied amount and result.",
    ],
    sources: [
      {
        sourceId: "ad.govern.irpf-rates-current",
        publisher: "Government of Andorra",
        publisherType: "tax-authority",
        title: "What percentage will I have to pay?",
        url: "https://www.govern.ad/ca/l/4191537",
        jurisdiction: "AD",
        retrievedAt: "2026-07-22",
      },
      {
        sourceId: "ad.govern.irpf-law-register",
        publisher: "Government of Andorra",
        publisherType: "legislation-register",
        title: "Personal income tax legislation and regulations",
        url: "https://www.govern.ad/ca/ministeris-i-secretaries-d-estat/ministeri-de-finances/convenis-i-normativa/impostos",
        jurisdiction: "AD",
        retrievedAt: "2026-07-22",
      },
      {
        sourceId: "ad.govern.irpf-filing-current",
        publisher: "Government of Andorra",
        publisherType: "tax-authority",
        title: "When must an IRPF return be filed?",
        url: "https://www.govern.ad/ca/l/4191156",
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
      taxYears: [{ taxYear: TAX_YEAR, modelVersion: `ad-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
      pit: {
        contractVersion: "taxcraft.pit-country-package.v1",
        taxUnit: "individual",
        taxYearBasis: definition.taxYearBasis,
        currencyCodes: [definition.currency],
        incomeSchedules: [definition.kind],
        taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
        factsSchema: {
          type: "object",
          additionalProperties: false,
          required: ["scopeConfirmed", "generalTaxBaseMinor"],
          properties: {
            scopeConfirmed: {
              type: "boolean",
              title: "Confirmed Andorra general-base scope",
              description: "The caller confirms the supplied amount is the resident general tax base and excludes the savings tax base.",
              const: true,
              "x-taxcraft-kind": "confirmed-status",
            },
            generalTaxBaseMinor: {
              type: "integer",
              title: "General tax base",
              description: "Caller-confirmed resident general tax base in euro after applicable reductions and deductions.",
              minimum: 0,
              "x-taxcraft-kind": "money-minor",
              "x-taxcraft-currency": "EUR",
            },
          },
        },
        rounding: [{ stage: "general-base-income-tax", mode: "half-up", unitMinor: 1 }],
        maintenance: { mode: "manual", sourceWatch: false },
      },
    },
    sources: definition.sources,
    models: { [TAX_YEAR]: model(definition) },
  });
}

function model(definition) {
  const bands = [
    { upperBoundMinor: 2_400_000, rateBasisPoints: 0 },
    { upperBoundMinor: 4_000_000, rateBasisPoints: 500 },
    { upperBoundMinor: null, rateBasisPoints: 1_000 },
  ];
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) { return { ok: true, facts }; },
    calculate({ facts }) {
      const result = calculateProgressiveBands({ taxableMinor: facts.generalTaxBaseMinor, bands, rounding: ROUNDING_MODE.HALF_UP });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `ad.pit.${TAX_YEAR}.general-base-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} resident general-base band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) lines.push({ ruleId: `ad.pit.${TAX_YEAR}.zero-base`, label: "Income tax on zero general tax base", amountMinor: 0, sourceIds });
      return {
        currency: definition.currency,
        totals: { generalTaxBaseMinor: facts.generalTaxBaseMinor, exemptThresholdMinor: 2_400_000, fullRateThresholdMinor: 4_000_000, incomeTaxMinor: result.taxMinor },
        lines,
        assumptions: [...definition.assumptions],
        coverage: coverage(definition),
      };
    },
  };
}

function coverage(definition) { return { supported: [...definition.supported], unsupported: [...definition.unsupported] }; }
function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
