import {
  ROUNDING_MODE,
  applyTaxCredit,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026-27";
const RESIDENT_BANDS = Object.freeze([
  { upperBoundMinor: 7_776_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: null, rateBasisPoints: 3_000 },
]);
const NON_RESIDENT_BANDS = Object.freeze([
  { upperBoundMinor: null, rateBasisPoints: 2_500 },
]);
const RESIDENT_PERSONAL_CREDIT_MINOR = 1_224_000;

const DEFINITION = Object.freeze({
  code: "LS",
  name: "Lesotho individual income tax",
  currency: "LSL",
  supported: [
    "resident annual chargeable income under the 20% and 30% marginal schedule",
    "non-refundable resident personal tax credit of LSL 12,240",
    "non-resident annual chargeable income at the standard 25% rate",
    "income year 2026-27",
  ],
  unsupported: [
    "chargeable-income, gross-income, expense, deduction and allowance derivation",
    "employment-benefit, fringe-benefit and employer-provided asset valuation",
    "severance, redundancy, terminal-benefit and other special payment treatment",
    "monthly, weekly, fortnightly or cumulative PAYE withholding calculations",
    "withholding tax, provisional tax, prior payments, filing balances, penalties, interest and refunds",
    "personal-credit eligibility, residence, source and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual chargeable income after all legally applicable expenses, deductions, allowances and exclusions.",
    "The caller selected the legally applicable resident or non-resident schedule without providing identity or residence evidence.",
    "The resident personal tax credit is non-refundable and cannot reduce income tax below zero.",
  ],
  sources: [
    {
      sourceId: "ls.rsl.income-tax-2026-27",
      publisher: "Revenue Services Lesotho",
      publisherType: "tax-authority",
      title: "Income Tax",
      url: "https://www.rsl.org.ls/income-tax",
      jurisdiction: "LS",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "ls.rsl.tax-table-2026-27",
      publisher: "Revenue Services Lesotho",
      publisherType: "tax-authority",
      title: "Tax Tables 2026-27",
      url: "https://www.rsl.org.ls/sites/default/files/2026-04/Tax%20Tables%202026-27_0.pdf",
      jurisdiction: "LS",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "ls.rsl.help-resources-2026-27",
      publisher: "Revenue Services Lesotho",
      publisherType: "tax-authority",
      title: "Help and Resources — 2026-2027 Tax Table",
      url: "https://www.rsl.org.ls/help-and-resources/27",
      jurisdiction: "LS",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const lesothoPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `ls-${TAX_YEAR}-v1`,
      status: "current",
      order: 2027,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "income-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["resident-chargeable-income", "non-resident-chargeable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Lesotho annual individual-tax scope",
            description: "The caller confirms that the supplied amount is annual chargeable income governed by the selected individual schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          individualTaxSchedule: {
            type: "string",
            title: "Individual tax schedule",
            description: "Select the legally applicable resident or non-resident schedule without providing identity or residence evidence.",
            enum: ["resident", "non-resident"],
            "x-taxcraft-kind": "plain",
          },
          annualChargeableIncomeMinor: {
            type: "integer",
            title: "Annual chargeable income",
            description: "Caller-confirmed annual chargeable income in loti after applicable expenses, deductions, allowances and exclusions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "LSL",
          },
        },
      },
      rounding: [
        { stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 },
        { stage: "resident-personal-credit", mode: "half-up", unitMinor: 1 },
      ],
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
      const resident = facts.individualTaxSchedule === "resident";
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.annualChargeableIncomeMinor,
        bands: resident ? RESIDENT_BANDS : NON_RESIDENT_BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const credit = applyTaxCredit({
        taxMinor: progressive.taxMinor,
        creditMinor: resident ? RESIDENT_PERSONAL_CREDIT_MINOR : 0,
        refundable: false,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `ls.pit.${TAX_YEAR}.${facts.individualTaxSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${facts.individualTaxSchedule} annual income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `ls.pit.${TAX_YEAR}.${facts.individualTaxSchedule}.zero-income`,
          label: "Income tax on zero chargeable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      if (credit.appliedCreditMinor > 0) {
        lines.push({
          ruleId: `ls.pit.${TAX_YEAR}.resident-personal-credit`,
          label: "Non-refundable resident personal tax credit applied",
          amountMinor: -credit.appliedCreditMinor,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          annualChargeableIncomeMinor: facts.annualChargeableIncomeMinor,
          grossIncomeTaxMinor: progressive.taxMinor,
          availablePersonalCreditMinor: resident ? RESIDENT_PERSONAL_CREDIT_MINOR : 0,
          personalCreditAppliedMinor: credit.appliedCreditMinor,
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
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
