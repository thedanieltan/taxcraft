import {
  ROUNDING_MODE,
  applyTaxCredit,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const MODELS = Object.freeze({
  "2024": { higherRateThresholdMinor: 158_281_200 },
  "2025": { higherRateThresholdMinor: 167_605_200 },
  "2026": { higherRateThresholdMinor: 176_281_200 },
});
const TAX_YEARS = Object.freeze(Object.keys(MODELS));
const BASIC_TAXPAYER_CREDIT_MINOR = 3_084_000;
const WHOLE_HUNDRED_CZK_MINOR = 10_000;
const WHOLE_CZK_MINOR = 100;

const DEFINITION = Object.freeze({
  code: "CZ",
  name: "Czech Republic annual personal income tax",
  currency: "CZK",
  supported: [
    "annual personal income tax on caller-confirmed reduced tax base",
    "15% and 23% annual rates with year-specific higher-rate thresholds",
    "the standard CZK 30,840 basic taxpayer credit",
    "the annual tax-base and gross-tax rounding sequence",
    "calendar years 2024 through 2026",
  ],
  unsupported: [
    "tax-base, deduction and non-taxable-part derivation",
    "spouse, disability, student, child and other credits or bonuses",
    "separate foreign-income tax bases and withholding-tax schedules",
    "social-security and health-insurance contributions",
    "advance-payment reconciliation, prior payments, refunds and filing decisions",
  ],
  assumptions: [
    "The caller supplied the annual reduced tax base after applicable deductions and non-taxable parts.",
    "The caller selected whether to display tax before or after the standard basic taxpayer credit.",
    "All credits other than the basic taxpayer credit are excluded.",
  ],
  sources: [
    {
      sourceId: "cz.fs.pit-rates-2024",
      publisher: "Financial Administration of the Czech Republic",
      publisherType: "tax-authority",
      title: "Current questions and answers for personal income tax in 2024",
      url: "https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/zamestnanci-zamestnavatele/dotazy-a-odpovedi/2024/aktualni-dotazy-a-odpovedi-k-dpz-2023-2024",
      jurisdiction: "CZ",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "cz.fs.pit-rates-2025",
      publisher: "Financial Administration of the Czech Republic",
      publisherType: "tax-authority",
      title: "Current personal income tax questions for tax period 2025",
      url: "https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/dotazy-a-odpovedi/dan-z-prijmu-fyzickych-osob/aktualne-k-dani-z-prijmu-fyzickych-osob-2025",
      jurisdiction: "CZ",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "cz.fs.pit-rates-and-credit-2026",
      publisher: "Financial Administration of the Czech Republic",
      publisherType: "tax-authority",
      title: "Current employee personal income tax questions for 2026",
      url: "https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/zamestnanci-zamestnavatele/dotazy-a-odpovedi/2026/aktualni-dotazy-a-odpovedi-k-dani-z",
      jurisdiction: "CZ",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "cz.fs.tax-system-description",
      publisher: "Financial Administration of the Czech Republic",
      publisherType: "tax-authority",
      title: "Description of the Czech tax system",
      url: "https://financnisprava.gov.cz/cs/dane/danovy-system-cr/popis-systemu",
      jurisdiction: "CZ",
      retrievedAt: "2026-07-18",
    },
  ],
});

export const czechRepublicPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((taxYear) => ({
      taxYear,
      modelVersion: `cz-${taxYear}-v1`,
      status: taxYear === "2026" ? "current" : "historical-supported",
      order: Number(taxYear),
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["annual-reduced-tax-base"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "basicTaxpayerCreditSchedule", "reducedTaxBaseMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Czech annual PIT scope",
            description: "The caller confirms the amount is the annual reduced tax base governed by the ordinary 15% and 23% rates.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          basicTaxpayerCreditSchedule: {
            type: "string",
            title: "Basic taxpayer credit schedule",
            description: "Select whether to apply the standard annual CZK 30,840 taxpayer credit.",
            enum: ["none", "standard"],
            "x-taxcraft-kind": "plain",
          },
          reducedTaxBaseMinor: {
            type: "integer",
            title: "Annual reduced tax base",
            description: "Caller-confirmed annual reduced tax base in CZK before the statutory whole-hundred rounding step.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "CZK",
          },
        },
      },
      rounding: [
        { stage: "annual-reduced-tax-base", mode: "floor", unitMinor: WHOLE_HUNDRED_CZK_MINOR },
        { stage: "annual-gross-income-tax", mode: "ceiling", unitMinor: WHOLE_CZK_MINOR },
        { stage: "basic-taxpayer-credit", mode: "half-up", unitMinor: 1 },
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
      const roundedTaxBaseMinor = Math.floor(facts.reducedTaxBaseMinor / WHOLE_HUNDRED_CZK_MINOR) * WHOLE_HUNDRED_CZK_MINOR;
      const progressive = calculateProgressiveBands({
        taxableMinor: roundedTaxBaseMinor,
        bands: [
          { upperBoundMinor: parameters.higherRateThresholdMinor, rateBasisPoints: 1500 },
          { upperBoundMinor: null, rateBasisPoints: 2300 },
        ],
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const roundedGrossTaxMinor = Math.ceil(progressive.taxMinor / WHOLE_CZK_MINOR) * WHOLE_CZK_MINOR;
      const availableCreditMinor = facts.basicTaxpayerCreditSchedule === "standard"
        ? BASIC_TAXPAYER_CREDIT_MINOR
        : 0;
      const credit = applyTaxCredit({
        taxMinor: roundedGrossTaxMinor,
        creditMinor: availableCreditMinor,
        refundable: false,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `cz.pit.${taxYear}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} personal income-tax band before whole-koruna rounding`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      const roundingAdjustmentMinor = roundedGrossTaxMinor - progressive.taxMinor;
      if (roundingAdjustmentMinor !== 0) {
        lines.push({
          ruleId: `cz.pit.${taxYear}.gross-tax-rounding`,
          label: "Gross tax rounded up to whole Czech koruna",
          amountMinor: roundingAdjustmentMinor,
          sourceIds,
        });
      }
      if (credit.appliedCreditMinor > 0) {
        lines.push({
          ruleId: `cz.pit.${taxYear}.basic-taxpayer-credit`,
          label: "Standard basic taxpayer credit applied",
          amountMinor: -credit.appliedCreditMinor,
          sourceIds,
        });
      }
      if (lines.length === 0) {
        lines.push({
          ruleId: `cz.pit.${taxYear}.zero-income`,
          label: "Income tax on zero reduced tax base",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          reducedTaxBaseMinor: facts.reducedTaxBaseMinor,
          roundedTaxBaseMinor,
          grossIncomeTaxBeforeRoundingMinor: progressive.taxMinor,
          grossIncomeTaxMinor: roundedGrossTaxMinor,
          availableBasicTaxpayerCreditMinor: availableCreditMinor,
          basicTaxpayerCreditAppliedMinor: credit.appliedCreditMinor,
          incomeTaxMinor: credit.taxAfterCreditMinor,
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
  return `${rateBasisPoints / 100}%`;
}
