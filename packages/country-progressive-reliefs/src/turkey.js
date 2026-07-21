import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const GENERAL_BANDS = Object.freeze([
  { upperBoundMinor: 19_000_000, rateBasisPoints: 1_500 },
  { upperBoundMinor: 40_000_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: 100_000_000, rateBasisPoints: 2_700 },
  { upperBoundMinor: 530_000_000, rateBasisPoints: 3_500 },
  { upperBoundMinor: null, rateBasisPoints: 4_000 },
]);
const WAGE_BANDS = Object.freeze([
  { upperBoundMinor: 19_000_000, rateBasisPoints: 1_500 },
  { upperBoundMinor: 40_000_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: 150_000_000, rateBasisPoints: 2_700 },
  { upperBoundMinor: 530_000_000, rateBasisPoints: 3_500 },
  { upperBoundMinor: null, rateBasisPoints: 4_000 },
]);

const DEFINITION = Object.freeze({
  code: "TR",
  name: "Türkiye annual individual income tax",
  currency: "TRY",
  supported: [
    "calendar-year 2026 general annual income-tax schedule",
    "calendar-year 2026 wage-income annual schedule",
    "15%, 20%, 27%, 35% and 40% statutory bands",
  ],
  unsupported: [
    "gross-income, expense, exemption, deduction and taxable-base derivation",
    "minimum-wage exemption and other wage exemptions",
    "disability allowance, insurance deductions, education and health deductions, donations and sponsorship deductions",
    "capital, rental, securities, agricultural, occasional and other category-specific income rules",
    "social-security contributions, withholding, advance tax and annual return reconciliation",
    "foreign-tax credit, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after all legally applicable exemptions and deductions.",
    "The caller selected the correct general or wage-income schedule.",
    "No withholding, tax credit or prior payment is netted against the calculated tariff tax.",
  ],
  sources: [
    {
      sourceId: "tr.gib.income-tax-tariff-2026",
      publisher: "Revenue Administration of Türkiye",
      publisherType: "tax-authority",
      title: "Income-tax tariff for 2026",
      url: "https://www.gib.gov.tr/yardim-kaynaklar/yararli-bilgiler/gelir-vergisi-tarifesi",
      jurisdiction: "TR",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "tr.gib.income-tax-law-article-103-2026",
      publisher: "Revenue Administration of Türkiye",
      publisherType: "legislation",
      title: "Income Tax Law article 103 — 2026 tariff",
      url: "https://istanbul.gib.gov.tr/mevzuat/kanun/433",
      jurisdiction: "TR",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "tr.gib.wage-income-2026",
      publisher: "Revenue Administration of Türkiye",
      publisherType: "tax-authority",
      title: "Wage income — 2026 income-tax schedule",
      url: "https://gib.gov.tr/vergi-konulari/1_bireysel/11_ucret_geliri/11",
      jurisdiction: "TR",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const turkeyPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `tr-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["general", "wage"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "incomeSchedule", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Türkiye annual tariff scope",
            description: "The caller confirms the supplied amount is annual taxable income governed by the selected 2026 tariff.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          incomeSchedule: {
            type: "string",
            title: "Income schedule",
            enum: ["general", "wage"],
            "x-taxcraft-kind": "enum",
          },
          taxableIncomeMinor: {
            type: "integer",
            title: "Annual taxable income",
            description: "Caller-confirmed annual taxable income in Turkish lira after applicable exemptions and deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "TRY",
          },
        },
      },
      rounding: [{ stage: "annual-income-tax", mode: "half-up", unitMinor: 1 }],
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
      const bands = facts.incomeSchedule === "wage" ? WAGE_BANDS : GENERAL_BANDS;
      const result = calculateProgressiveBands({ taxableMinor: facts.taxableIncomeMinor, bands, rounding: ROUNDING_MODE.HALF_UP });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `tr.pit.${TAX_YEAR}.${facts.incomeSchedule}-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${facts.incomeSchedule} income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `tr.pit.${TAX_YEAR}.${facts.incomeSchedule}-zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          firstThresholdMinor: 19_000_000,
          secondThresholdMinor: 40_000_000,
          thirdThresholdMinor: facts.incomeSchedule === "wage" ? 150_000_000 : 100_000_000,
          fourthThresholdMinor: 530_000_000,
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
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
