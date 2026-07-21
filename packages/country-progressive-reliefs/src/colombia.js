import {
  ROUNDING_MODE,
  applyBasisPoints,
  definePitCountryPackage,
  roundRatio,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const UVT_COP = 52_374;
const UVT_SCALE = 10_000;

const RANGES = Object.freeze([
  { upperUvt: 1_090, rateBasisPoints: 0, fixedTaxUvt: 0 },
  { upperUvt: 1_700, rateBasisPoints: 1_900, fixedTaxUvt: 0 },
  { upperUvt: 4_100, rateBasisPoints: 2_800, fixedTaxUvt: 116 },
  { upperUvt: 8_670, rateBasisPoints: 3_300, fixedTaxUvt: 788 },
  { upperUvt: 18_970, rateBasisPoints: 3_500, fixedTaxUvt: 2_296 },
  { upperUvt: 31_000, rateBasisPoints: 3_700, fixedTaxUvt: 5_901 },
  { upperUvt: null, rateBasisPoints: 3_900, fixedTaxUvt: 10_352 },
]);

const DEFINITION = Object.freeze({
  code: "CO",
  name: "Colombia resident annual individual income tax",
  currency: "COP",
  supported: [
    "calendar-year 2026 article 241 resident individual income-tax table",
    "0%, 19%, 28%, 33%, 35%, 37% and 39% statutory marginal rates",
    "statutory fixed tax amounts of 116, 788, 2,296, 5,901 and 10,352 UVT",
    "2026 UVT value of COP 52,374",
  ],
  unsupported: [
    "conversion of a peso-denominated taxable base into UVT",
    "gross-income, exempt-income, cost, deduction, cedular and taxable-base derivation",
    "dividend, occasional-gain, non-resident and special-rate schedules",
    "tax credits, withholding, advances, prior payments and return reconciliation",
    "declaration and payment-form rounding to thousands of pesos",
    "foreign-tax relief, treaty relief, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied the final resident taxable base in units of one ten-thousandth of a UVT.",
    "The article 241 general resident schedule applies to the supplied base.",
    "The result is converted to Colombian peso cents using the 2026 UVT before filing-form rounding.",
  ],
  sources: [
    {
      sourceId: "co.law.tax-statute-article-241",
      publisher: "Administrative Department of the Public Function of Colombia",
      publisherType: "legislation",
      title: "Tax Statute article 241 — resident natural-person income-tax table",
      url: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=6533",
      jurisdiction: "CO",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "co.dian.uvt-2026-resolution-238",
      publisher: "Directorate of National Taxes and Customs of Colombia",
      publisherType: "tax-authority",
      title: "Resolution 238 of 2025 — 2026 UVT value",
      url: "https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0238_2025.htm",
      jurisdiction: "CO",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "co.law.tax-statute-article-868",
      publisher: "Directorate of National Taxes and Customs of Colombia",
      publisherType: "legislation",
      title: "Tax Statute article 868 — UVT conversion and approximation",
      url: "https://normograma.dian.gov.co/dian/compilacion/docs/concepto_tributario_dian_0065791_2013.htm",
      jurisdiction: "CO",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const colombiaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `co-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["resident-article-241-general-base"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxableBaseUvtTenThousandths"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Colombia article 241 scope",
            description: "The caller confirms the supplied UVT base is governed by the resident article 241 general schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          taxableBaseUvtTenThousandths: {
            type: "integer",
            title: "Resident taxable base in 1/10,000 UVT",
            description: "Caller-confirmed resident taxable base measured in units of one ten-thousandth of a UVT.",
            minimum: 0,
            "x-taxcraft-kind": "plain",
          },
        },
      },
      rounding: [
        { stage: "statutory-uvt-tax", mode: "half-up", unitMinor: 1 },
        { stage: "uvt-to-cop-cent", mode: "half-up", unitMinor: 1 },
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
      const taxableBase = facts.taxableBaseUvtTenThousandths;
      const rangeIndex = RANGES.findIndex(({ upperUvt }) => upperUvt === null || taxableBase <= upperUvt * UVT_SCALE);
      const range = RANGES[rangeIndex];
      const lowerUvt = rangeIndex === 0 ? 0 : RANGES[rangeIndex - 1].upperUvt;
      const excessUvtTenThousandths = Math.max(0, taxableBase - lowerUvt * UVT_SCALE);
      const marginalTaxUvtTenThousandths = applyBasisPoints(
        excessUvtTenThousandths,
        range.rateBasisPoints,
        ROUNDING_MODE.HALF_UP,
      );
      const taxUvtTenThousandths = range.fixedTaxUvt * UVT_SCALE + marginalTaxUvtTenThousandths;
      const incomeTaxMinor = roundRatio(
        BigInt(taxUvtTenThousandths) * BigInt(UVT_COP) * 100n,
        UVT_SCALE,
        ROUNDING_MODE.HALF_UP,
      );
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableBaseUvtTenThousandths: taxableBase,
          uvtValueCopMinor: UVT_COP * 100,
          taxUvtTenThousandths,
          incomeTaxMinor,
        },
        lines: [{
          ruleId: `co.pit.${TAX_YEAR}.article-241-range-${rangeIndex + 1}`,
          label: `${formatRate(range.rateBasisPoints)} resident article 241 range`,
          amountMinor: incomeTaxMinor,
          sourceIds,
        }],
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
