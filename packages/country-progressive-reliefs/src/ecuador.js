import {
  ROUNDING_MODE,
  applyBasisPoints,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2025";
const BRACKETS = Object.freeze([
  { lowerMinor: 0, upperMinor: 1_208_100, baseTaxMinor: 0, rateBasisPoints: 0 },
  { lowerMinor: 1_208_100, upperMinor: 1_538_700, baseTaxMinor: 0, rateBasisPoints: 500 },
  { lowerMinor: 1_538_700, upperMinor: 1_997_800, baseTaxMinor: 16_500, rateBasisPoints: 1_000 },
  { lowerMinor: 1_997_800, upperMinor: 2_642_200, baseTaxMinor: 62_400, rateBasisPoints: 1_200 },
  { lowerMinor: 2_642_200, upperMinor: 3_477_000, baseTaxMinor: 139_800, rateBasisPoints: 1_500 },
  { lowerMinor: 3_477_000, upperMinor: 4_608_900, baseTaxMinor: 265_000, rateBasisPoints: 2_000 },
  { lowerMinor: 4_608_900, upperMinor: 6_135_900, baseTaxMinor: 491_400, rateBasisPoints: 2_500 },
  { lowerMinor: 6_135_900, upperMinor: 8_181_700, baseTaxMinor: 873_100, rateBasisPoints: 3_000 },
  { lowerMinor: 8_181_700, upperMinor: 10_881_000, baseTaxMinor: 1_486_900, rateBasisPoints: 3_500 },
  { lowerMinor: 10_881_000, upperMinor: null, baseTaxMinor: 2_431_600, rateBasisPoints: 3_700 },
]);

const DEFINITION = Object.freeze({
  code: "EC",
  name: "Ecuador general-regime individual income tax",
  currency: "USD",
  supported: [
    "fiscal-year 2025 general-regime individual income tax on caller-confirmed taxable base",
    "official 0%, 5%, 10%, 12%, 15%, 20%, 25%, 30%, 35% and 37% schedule",
    "official fixed tax amounts at each basic-fraction transition",
  ],
  unsupported: [
    "gross-income, exempt-income, cost, expense, deduction and taxable-base derivation",
    "personal-expense tax rebate and family-load calculations",
    "older-adult and disability exemptions or substitute benefits",
    "RIMPE popular-business and entrepreneur schedules",
    "inheritance, legacy, donation and gratuitous-transfer schedules",
    "employment IESS contribution derivation, withholding and annual return reconciliation",
    "Galapagos adjustments, foreign-tax credits, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied the fiscal-year 2025 general-regime taxable base after applicable income and deduction rules.",
    "The result is tax caused before the personal-expense rebate and other tax credits.",
    "The official fixed tax at each basic-fraction transition takes precedence over a reconstructed cumulative-band amount.",
  ],
  sources: [
    {
      sourceId: "ec.sri.general-regime-table-2025",
      publisher: "Internal Revenue Service of Ecuador",
      publisherType: "tax-authority",
      title: "2025 individual income-tax declaration — general-regime table",
      url: "https://www.sri.gob.ec/declaracion-impuesto-a-la-renta-2025",
      jurisdiction: "EC",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "ec.sri.income-tax-general",
      publisher: "Internal Revenue Service of Ecuador",
      publisherType: "tax-authority",
      title: "Income tax — taxable base and individual rates",
      url: "https://www.sri.gob.ec/impuesto-renta",
      jurisdiction: "EC",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "ec.sri.filing-campaign-2025",
      publisher: "Internal Revenue Service of Ecuador",
      publisherType: "tax-authority",
      title: "2025 general-regime individual income-tax filing guidance",
      url: "https://www.sri.gob.ec/detalle-noticias?idnoticia=1268&marquesina=1",
      jurisdiction: "EC",
      retrievedAt: "2026-07-22",
    },
  ],
});

export const ecuadorPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `ec-${TAX_YEAR}-v1`,
      status: "current",
      order: 2025,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["general-regime-taxable-base-before-rebate"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxableBaseMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Ecuador general-regime scope",
            description: "The caller confirms the supplied amount is the fiscal-year 2025 general-regime taxable base before personal-expense rebate and credits.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          taxableBaseMinor: {
            type: "integer",
            title: "Annual taxable base",
            description: "Caller-confirmed fiscal-year 2025 taxable base in US dollars after applicable income and deduction rules.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "USD",
          },
        },
      },
      rounding: [{ stage: "annual-general-regime-tax", mode: "half-up", unitMinor: 1 }],
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
      const bracketIndex = BRACKETS.findIndex(({ upperMinor }) => upperMinor === null || facts.taxableBaseMinor < upperMinor);
      const bracket = BRACKETS[bracketIndex];
      const excessMinor = Math.max(0, facts.taxableBaseMinor - bracket.lowerMinor);
      const excessTaxMinor = applyBasisPoints(excessMinor, bracket.rateBasisPoints, ROUNDING_MODE.HALF_UP);
      const incomeTaxMinor = bracket.baseTaxMinor + excessTaxMinor;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);

      return {
        currency: DEFINITION.currency,
        totals: {
          taxableBaseMinor: facts.taxableBaseMinor,
          bracketIndex,
          bracketLowerMinor: bracket.lowerMinor,
          ...(bracket.upperMinor === null ? {} : { bracketUpperMinor: bracket.upperMinor }),
          basicFractionTaxMinor: bracket.baseTaxMinor,
          excessTaxMinor,
          incomeTaxMinor,
        },
        lines: [{
          ruleId: `ec.pit.${TAX_YEAR}.general-regime-bracket-${bracketIndex + 1}`,
          label: `${formatRate(bracket.rateBasisPoints)} tax on excess over the basic fraction`,
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
