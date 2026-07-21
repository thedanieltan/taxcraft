import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const FIRST_THRESHOLD_MINOR = 4_398_332;
const SECOND_THRESHOLD_MINOR = 6_034_921;
const THIRD_THRESHOLD_MINOR = 7_501_032;
const BANDS = Object.freeze([
  { upperBoundMinor: FIRST_THRESHOLD_MINOR, rateBasisPoints: 1_900 },
  { upperBoundMinor: SECOND_THRESHOLD_MINOR, rateBasisPoints: 2_500 },
  { upperBoundMinor: THIRD_THRESHOLD_MINOR, rateBasisPoints: 3_000 },
  { upperBoundMinor: null, rateBasisPoints: 3_500 },
]);

const DEFINITION = Object.freeze({
  code: "SK",
  name: "Slovakia annual individual income tax",
  currency: "EUR",
  supported: [
    "calendar-year 2026 income tax on caller-confirmed tax base under section 4(1)(a)",
    "19%, 25%, 30% and 35% statutory bands",
    "thresholds derived from 154.8, 212.4 and 264 times the EUR 284.13 subsistence minimum valid on 1 January 2026",
  ],
  unsupported: [
    "gross-income, partial-tax-base, expense, deduction and taxable-base derivation",
    "taxpayer, spouse, dependant and other non-taxable allowance calculations",
    "business and self-employment income under section 4(1)(b), including the 15% small-business rate",
    "dividend, capital, rental, special and final-tax schedules",
    "social and health contributions, payroll advances and annual settlement reconciliation",
    "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied the annual tax base after all legally applicable deductions and non-taxable amounts.",
    "The amount is governed by section 4(1)(a), not the separate business-income tax-base schedule.",
    "The statutory thresholds use the EUR 284.13 subsistence minimum valid on 1 January 2026.",
  ],
  sources: [
    {
      sourceId: "sk.fa.individual-income-tax-rates-2026",
      publisher: "Financial Administration of the Slovak Republic",
      publisherType: "tax-authority",
      title: "Calculation of income-tax advances — 2026 tax rates",
      url: "https://podpora.financnasprava.sk/418585-V%C3%BDpo%C4%8Det-preddavkov-na-da%C5%88---sadzba-dane",
      jurisdiction: "SK",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "sk.fa.subsistence-minimum-2026",
      publisher: "Financial Administration of the Slovak Republic",
      publisherType: "tax-authority",
      title: "Subsistence minimum valid on 1 January 2026",
      url: "https://podpora.financnasprava.sk/074458-%C5%BDivotn%C3%A9-minimum-platn%C3%A9-k-112026",
      jurisdiction: "SK",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "sk.law.income-tax-act-2026",
      publisher: "Ministry of Justice of the Slovak Republic",
      publisherType: "legislation",
      title: "Act No. 595/2003 Coll. on Income Tax — version effective from 1 January 2026",
      url: "https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/20260101",
      jurisdiction: "SK",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const slovakiaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `sk-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["section-4-1-a-annual-tax-base"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxBaseMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Slovakia section 4(1)(a) scope",
            description: "The caller confirms the supplied amount is an annual tax base governed by the ordinary section 4(1)(a) schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          taxBaseMinor: {
            type: "integer",
            title: "Annual tax base",
            description: "Caller-confirmed annual tax base in euro after applicable deductions and non-taxable amounts.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [{ stage: "annual-income-tax", mode: "half-up", unitMinor: 1 }],
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
        taxableMinor: facts.taxBaseMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `sk.pit.${TAX_YEAR}.annual-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual tax-base band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `sk.pit.${TAX_YEAR}.zero-base`,
          label: "Income tax on zero tax base",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxBaseMinor: facts.taxBaseMinor,
          firstThresholdMinor: FIRST_THRESHOLD_MINOR,
          secondThresholdMinor: SECOND_THRESHOLD_MINOR,
          thirdThresholdMinor: THIRD_THRESHOLD_MINOR,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
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

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
