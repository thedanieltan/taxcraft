import {
  ROUNDING_MODE,
  applyTaxCredit,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const MODELS = Object.freeze({
  "2025": {
    bands: [
      [23_710_000, 1800],
      [37_050_000, 2600],
      [51_280_000, 3100],
      [67_300_000, 3600],
      [85_790_000, 3900],
      [181_700_000, 4100],
      [null, 4500],
    ],
    rebates: {
      primary: 1_723_500,
      secondary: 944_400,
      tertiary: 314_500,
    },
  },
  "2026": {
    bands: [
      [23_710_000, 1800],
      [37_050_000, 2600],
      [51_280_000, 3100],
      [67_300_000, 3600],
      [85_790_000, 3900],
      [181_700_000, 4100],
      [null, 4500],
    ],
    rebates: {
      primary: 1_723_500,
      secondary: 944_400,
      tertiary: 314_500,
    },
  },
  "2027": {
    bands: [
      [24_510_000, 1800],
      [38_310_000, 2600],
      [53_020_000, 3100],
      [69_580_000, 3600],
      [88_700_000, 3900],
      [187_860_000, 4100],
      [null, 4500],
    ],
    rebates: {
      primary: 1_782_000,
      secondary: 976_500,
      tertiary: 324_900,
    },
  },
});

const TAX_YEARS = Object.freeze(Object.keys(MODELS));
const DEFINITION = Object.freeze({
  code: "ZA",
  name: "South Africa individual income tax",
  currency: "ZAR",
  supported: [
    "annual individual income tax on caller-confirmed taxable income",
    "18%, 26%, 31%, 36%, 39%, 41% and 45% progressive bands",
    "primary, secondary and tertiary rebate schedules",
    "South African tax years 2025 through 2027",
  ],
  unsupported: [
    "taxable-income and deduction derivation",
    "medical scheme fees and additional medical expense tax credits",
    "retirement contribution deductions, interest exemptions and capital-gain inclusion",
    "PAYE reconciliation, prior payments and provisional tax",
    "rebate eligibility, residence, source and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after applicable deductions and exemptions.",
    "The caller selected the legally applicable rebate schedule without providing age or identity data.",
    "Only the primary, secondary and tertiary rebates are applied; medical and other tax credits are excluded.",
  ],
  sources: [
    {
      sourceId: "za.sars.individual-tax-rates",
      publisher: "South African Revenue Service",
      publisherType: "tax-authority",
      title: "Rates of Tax for Individuals",
      url: "https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/",
      jurisdiction: "ZA",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "za.sars.budget-2026-faq",
      publisher: "South African Revenue Service",
      publisherType: "tax-authority",
      title: "Budget 2026 Frequently Asked Questions",
      url: "https://www.sars.gov.za/about/sars-tax-and-customs-system/budget/budget-2026-frequently-asked-questions/",
      jurisdiction: "ZA",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "za.sars.employer-deduction-tables-2027",
      publisher: "South African Revenue Service",
      publisherType: "tax-authority",
      title: "Guide for Employers in Respect of Tax Deduction Tables",
      url: "https://www.sars.gov.za/guide-for-employers-in-respect-of-tax-deduction-tables/",
      jurisdiction: "ZA",
      retrievedAt: "2026-07-18",
    },
  ],
});

export const southAfricaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((taxYear) => ({
      taxYear,
      modelVersion: `za-${taxYear}-v1`,
      status: taxYear === "2027" ? "current" : "historical-supported",
      order: Number(taxYear),
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "tax-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["annual-taxable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "rebateSchedule", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed South Africa individual-income-tax scope",
            description: "The caller confirms the amount is annual taxable income governed by the individual table.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          rebateSchedule: {
            type: "string",
            title: "Individual rebate schedule",
            description: "Select the legally applicable cumulative rebate schedule without providing age or identity details.",
            enum: ["primary", "primary-secondary", "primary-secondary-tertiary"],
            "x-taxcraft-kind": "plain",
          },
          taxableIncomeMinor: {
            type: "integer",
            title: "Annual taxable income",
            description: "Caller-confirmed annual taxable income in ZAR after applicable deductions and exemptions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "ZAR",
          },
        },
      },
      rounding: [
        { stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 },
        { stage: "individual-rebates", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map((taxYear) => [taxYear, model(taxYear)])),
});

function model(taxYear) {
  const parameters = MODELS[taxYear];
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const bands = parameters.bands.map(([upperBoundMinor, rateBasisPoints]) => ({
        upperBoundMinor,
        rateBasisPoints,
      }));
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const availableRebateMinor = rebateForSchedule(parameters.rebates, facts.rebateSchedule);
      const rebate = applyTaxCredit({
        taxMinor: progressive.taxMinor,
        creditMinor: availableRebateMinor,
        refundable: false,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `za.pit.${taxYear}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} individual income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `za.pit.${taxYear}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      if (rebate.appliedCreditMinor > 0) {
        lines.push({
          ruleId: `za.pit.${taxYear}.${facts.rebateSchedule}-rebates`,
          label: "Individual tax rebates applied",
          amountMinor: -rebate.appliedCreditMinor,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          grossIncomeTaxMinor: progressive.taxMinor,
          availableRebateMinor,
          rebateAppliedMinor: rebate.appliedCreditMinor,
          incomeTaxMinor: rebate.taxAfterCreditMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function rebateForSchedule(rebates, schedule) {
  if (schedule === "primary") return rebates.primary;
  if (schedule === "primary-secondary") return rebates.primary + rebates.secondary;
  return rebates.primary + rebates.secondary + rebates.tertiary;
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
