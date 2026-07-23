import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const TAX_CLASSES = Object.freeze(["1", "1a", "2"]);
const INCOME_ROUNDING_MINOR = 5_000;
const TAX_ROUNDING_MINOR = 100;
const MINIMUM_TAX_MINOR = 1_200;
const CLASS_1A_CAP_START_MINOR = 5_180_400;
const CLASS_1A_TRANSFORM_OFFSET_MINOR = 1_984_500;

const BASE_BANDS = Object.freeze([
  { upperBoundMinor: 1_323_000, rateBasisPoints: 0 },
  { upperBoundMinor: 1_543_500, rateBasisPoints: 800 },
  { upperBoundMinor: 1_764_000, rateBasisPoints: 900 },
  { upperBoundMinor: 1_984_500, rateBasisPoints: 1_000 },
  { upperBoundMinor: 2_205_000, rateBasisPoints: 1_100 },
  { upperBoundMinor: 2_425_500, rateBasisPoints: 1_200 },
  { upperBoundMinor: 2_655_000, rateBasisPoints: 1_400 },
  { upperBoundMinor: 2_884_500, rateBasisPoints: 1_600 },
  { upperBoundMinor: 3_114_000, rateBasisPoints: 1_800 },
  { upperBoundMinor: 3_343_500, rateBasisPoints: 2_000 },
  { upperBoundMinor: 3_573_000, rateBasisPoints: 2_200 },
  { upperBoundMinor: 3_802_500, rateBasisPoints: 2_400 },
  { upperBoundMinor: 4_032_000, rateBasisPoints: 2_600 },
  { upperBoundMinor: 4_261_500, rateBasisPoints: 2_800 },
  { upperBoundMinor: 4_491_000, rateBasisPoints: 3_000 },
  { upperBoundMinor: 4_720_500, rateBasisPoints: 3_200 },
  { upperBoundMinor: 4_950_000, rateBasisPoints: 3_400 },
  { upperBoundMinor: 5_179_500, rateBasisPoints: 3_600 },
  { upperBoundMinor: 5_409_000, rateBasisPoints: 3_800 },
  { upperBoundMinor: 11_745_000, rateBasisPoints: 3_900 },
  { upperBoundMinor: 17_616_000, rateBasisPoints: 4_000 },
  { upperBoundMinor: 23_487_000, rateBasisPoints: 4_100 },
  { upperBoundMinor: null, rateBasisPoints: 4_200 },
]);

const CLASS_1A_CAPPED_BANDS = Object.freeze([
  { upperBoundMinor: 11_745_000, rateBasisPoints: 3_900 },
  { upperBoundMinor: 17_616_000, rateBasisPoints: 4_000 },
  { upperBoundMinor: 23_487_000, rateBasisPoints: 4_100 },
  { upperBoundMinor: null, rateBasisPoints: 4_200 },
]);

const DEFINITION = Object.freeze({
  code: "LU",
  name: "Luxembourg resident ordinary income tax",
  currency: "EUR",
  supported: [
    "tax year 2026 resident ordinary assessment under tax classes 1, 1a and 2",
    "Article 118 progressive tariff applicable from tax year 2025",
    "Article 120bis class 1a transformation and statutory marginal-rate caps",
    "Article 121 class 2 income-splitting calculation",
    "Article 126 adjusted-taxable-income flooring to the lower EUR 50 multiple",
    "Article 124 whole-euro tax flooring and EUR 12 minimum-tax rule",
    "7% or 9% contribution to the employment fund",
  ],
  unsupported: [
    "gross income, net-income categories, deductions, allowances and adjusted-taxable-income derivation",
    "tax-class eligibility, residence, collective-assessment and filing-obligation determinations",
    "child tax abatements, single-parent credit and other refundable or non-refundable tax credits",
    "employee, pensioner, self-employed, CO2, overtime, start-up and activity-retention credits or allowances",
    "exempt-income progression, extraordinary-income spreading, half-global-rate and quarter-global-rate calculations",
    "withholding tax, payroll tax cards, social-security and dependency contributions",
    "non-resident minimum rates, treaty relief, foreign-tax credits and special income schedules",
    "prepayments, prior withholding, refunds, penalties, interest and assessment reconciliation",
  ],
  assumptions: [
    "The caller supplied annual adjusted taxable income after all legally applicable deductions and allowances.",
    "The caller selected the legally applicable resident tax class without supplying identity, relationship or household evidence.",
    "The result is ordinary assessed income tax plus the employment-fund contribution before credits, withholding and prior payments.",
  ],
  sources: [
    {
      sourceId: "lu.acd.lir-2026-articles-118-126",
      publisher: "Luxembourg Direct Tax Administration",
      publisherType: "tax-authority",
      title: "Income Tax Law coordinated text effective 1 January 2026 — Articles 118 to 126",
      url: "https://impotsdirects.public.lu/dam-assets/fr/legislation/LIR/texte-coordonn-en-vigueur-au-1er-janvier-2026-ver-08052026.pdf",
      jurisdiction: "LU",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "lu.acd.individual-base-tariff-2025-onwards",
      publisher: "Luxembourg Direct Tax Administration",
      publisherType: "tax-authority",
      title: "Base tariff for natural persons applicable from tax year 2025",
      url: "https://impotsdirects.public.lu/fr/az/t/tarif_pers.html",
      jurisdiction: "LU",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "lu.acd.resident-tax-classes",
      publisher: "Luxembourg Direct Tax Administration",
      publisherType: "tax-authority",
      title: "Tax classes for resident taxpayers",
      url: "https://impotsdirects.public.lu/fr/az/c/class_resid.html",
      jurisdiction: "LU",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "lu.acd.employment-fund-contribution",
      publisher: "Luxembourg Direct Tax Administration",
      publisherType: "tax-authority",
      title: "Employment fund contribution for individual income tax",
      url: "https://impotsdirects.public.lu/fr/az/f/fond_empl.html",
      jurisdiction: "LU",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const luxembourgPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `lu-${TAX_YEAR}-resident-ordinary-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: TAX_CLASSES.map((taxClass) => `tax-class-${taxClass}`),
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxClass", "adjustedTaxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Luxembourg resident ordinary-assessment scope",
            description: "The caller confirms the adjusted taxable income and tax class apply to the supported 2026 resident ordinary assessment.",
            "x-taxcraft-kind": "confirmed-status",
          },
          taxClass: {
            type: "string",
            enum: TAX_CLASSES,
            title: "Resident tax class",
            description: "Caller-confirmed Luxembourg resident tax class 1, 1a or 2.",
            "x-taxcraft-kind": "enum",
          },
          adjustedTaxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Annual adjusted taxable income",
            description: "Caller-confirmed annual adjusted taxable income in euro cents after applicable deductions and allowances.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [
        { stage: "adjusted-taxable-income", mode: "floor", unitMinor: INCOME_ROUNDING_MINOR },
        { stage: "assessed-income-tax", mode: "floor", unitMinor: TAX_ROUNDING_MINOR },
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
      const adjustedTaxableIncomeUsedMinor = floorTo(
        facts.adjustedTaxableIncomeMinor,
        INCOME_ROUNDING_MINOR,
      );
      const tariffTaxRawMinor = calculateTaxClassRawMinor(
        adjustedTaxableIncomeUsedMinor,
        facts.taxClass,
      );
      const tariffTaxRoundedMinor = floorTo(tariffTaxRawMinor, TAX_ROUNDING_MINOR);
      const incomeTaxMinor = tariffTaxRoundedMinor < MINIMUM_TAX_MINOR
        ? 0
        : tariffTaxRoundedMinor;
      const employmentFundRateBasisPoints = employmentFundRate(
        adjustedTaxableIncomeUsedMinor,
        facts.taxClass,
      );
      const employmentFundContributionMinor = incomeTaxMinor
        * employmentFundRateBasisPoints / 10_000;
      const totalIncomeTaxMinor = incomeTaxMinor + employmentFundContributionMinor;

      return {
        currency: DEFINITION.currency,
        totals: {
          adjustedTaxableIncomeMinor: facts.adjustedTaxableIncomeMinor,
          adjustedTaxableIncomeUsedMinor,
          tariffTaxRawMinor,
          tariffTaxRoundedMinor,
          incomeTaxMinor,
          employmentFundRateBasisPoints,
          employmentFundContributionMinor,
          totalIncomeTaxMinor,
        },
        lines: [
          {
            ruleId: `lu.pit.${TAX_YEAR}.class-${facts.taxClass}.ordinary-income-tax`,
            label: `Luxembourg ordinary income tax — class ${facts.taxClass}`,
            amountMinor: incomeTaxMinor,
            sourceIds: [
              "lu.acd.lir-2026-articles-118-126",
              "lu.acd.individual-base-tariff-2025-onwards",
              "lu.acd.resident-tax-classes",
            ],
          },
          {
            ruleId: `lu.pit.${TAX_YEAR}.employment-fund-${employmentFundRateBasisPoints}`,
            label: `Employment fund contribution at ${employmentFundRateBasisPoints / 100}%`,
            amountMinor: employmentFundContributionMinor,
            sourceIds: ["lu.acd.employment-fund-contribution"],
          },
        ],
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function calculateTaxClassRawMinor(adjustedTaxableIncomeMinor, taxClass) {
  if (taxClass === "1") return calculateBaseTariffMinor(adjustedTaxableIncomeMinor);
  if (taxClass === "2") return calculateBaseTariffMinor(adjustedTaxableIncomeMinor / 2) * 2;
  return calculateClass1aMinor(adjustedTaxableIncomeMinor);
}

function calculateClass1aMinor(adjustedTaxableIncomeMinor) {
  if (adjustedTaxableIncomeMinor <= CLASS_1A_CAP_START_MINOR) {
    const transformedIncomeMinor = Math.max(
      0,
      adjustedTaxableIncomeMinor * 5 / 4 - CLASS_1A_TRANSFORM_OFFSET_MINOR,
    );
    return calculateBaseTariffMinor(transformedIncomeMinor);
  }

  let taxMinor = calculateBaseTariffMinor(4_491_000);
  let lowerBoundMinor = CLASS_1A_CAP_START_MINOR;
  for (const band of CLASS_1A_CAPPED_BANDS) {
    const upperBoundMinor = band.upperBoundMinor ?? adjustedTaxableIncomeMinor;
    const taxableSliceMinor = Math.max(
      0,
      Math.min(adjustedTaxableIncomeMinor, upperBoundMinor) - lowerBoundMinor,
    );
    taxMinor += taxableSliceMinor * band.rateBasisPoints / 10_000;
    if (band.upperBoundMinor === null || adjustedTaxableIncomeMinor <= band.upperBoundMinor) break;
    lowerBoundMinor = band.upperBoundMinor;
  }
  return taxMinor;
}

function calculateBaseTariffMinor(taxableIncomeMinor) {
  let taxMinor = 0;
  let lowerBoundMinor = 0;
  for (const band of BASE_BANDS) {
    const upperBoundMinor = band.upperBoundMinor ?? taxableIncomeMinor;
    const taxableSliceMinor = Math.max(
      0,
      Math.min(taxableIncomeMinor, upperBoundMinor) - lowerBoundMinor,
    );
    taxMinor += taxableSliceMinor * band.rateBasisPoints / 10_000;
    if (band.upperBoundMinor === null || taxableIncomeMinor <= band.upperBoundMinor) break;
    lowerBoundMinor = band.upperBoundMinor;
  }
  return taxMinor;
}

function employmentFundRate(adjustedTaxableIncomeMinor, taxClass) {
  const highRateThresholdMinor = taxClass === "2" ? 30_000_000 : 15_000_000;
  return adjustedTaxableIncomeMinor > highRateThresholdMinor ? 900 : 700;
}

function floorTo(value, unit) {
  return Math.floor(value / unit) * unit;
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}
