import {
  ROUNDING_MODE,
  applyTaxCredit,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze(["2023", "2024", "2025"]);
const BANDS = Object.freeze([
  { upperBoundMinor: 500_000, rateBasisPoints: 0 },
  { upperBoundMinor: 2_000_000, rateBasisPoints: 100 },
  { upperBoundMinor: 3_500_000, rateBasisPoints: 300 },
  { upperBoundMinor: 5_000_000, rateBasisPoints: 600 },
  { upperBoundMinor: 7_000_000, rateBasisPoints: 1100 },
  { upperBoundMinor: 10_000_000, rateBasisPoints: 1900 },
  { upperBoundMinor: 40_000_000, rateBasisPoints: 2500 },
  { upperBoundMinor: 60_000_000, rateBasisPoints: 2600 },
  { upperBoundMinor: 200_000_000, rateBasisPoints: 2800 },
  { upperBoundMinor: null, rateBasisPoints: 3000 },
]);
const INDIVIDUAL_REBATE_MINOR = 40_000;
const REBATE_INCOME_LIMIT_MINOR = 3_500_000;

const DEFINITION = Object.freeze({
  code: "MY",
  name: "Malaysia resident individual income tax",
  currency: "MYR",
  supported: [
    "resident individual income tax on caller-confirmed chargeable income",
    "the statutory progressive schedule for assessment years 2023 through 2025",
    "the RM400 separate-assessment individual rebate where chargeable income does not exceed RM35,000",
  ],
  unsupported: [
    "chargeable-income and tax-relief derivation",
    "joint assessment, spouse aggregation and spouse rebate",
    "zakat, fitrah and departure-levy rebates",
    "non-resident schedules, special income rates and foreign-tax credits",
    "monthly tax deductions, prior payments, refunds and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied chargeable income after all applicable reliefs and deductions.",
    "The caller selected the legally applicable separate-assessment individual rebate schedule without providing identity data.",
    "Only the standard RM400 individual rebate is applied; joint-assessment and other rebates are excluded.",
  ],
  sources: [
    {
      sourceId: "my.hasil.individual-tax-rates-2023-2025",
      publisher: "Lembaga Hasil Dalam Negeri Malaysia",
      publisherType: "tax-authority",
      title: "Tax Rate — Assessment Year 2023, 2024 and 2025",
      url: "https://www.hasil.gov.my/en/individual/individual-life-cycle/income-declaration/tax-rate/",
      jurisdiction: "MY",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "my.hasil.individual-rebates",
      publisher: "Lembaga Hasil Dalam Negeri Malaysia",
      publisherType: "tax-authority",
      title: "Rebates",
      url: "https://www.hasil.gov.my/en/individual/individual-life-cycle/income-declaration/rebates/",
      jurisdiction: "MY",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "my.hasil.when-taxable",
      publisher: "Lembaga Hasil Dalam Negeri Malaysia",
      publisherType: "tax-authority",
      title: "When is Taxable?",
      url: "https://www.hasil.gov.my/en/individual/introduction-individual-income-tax/when-is-taxable/",
      jurisdiction: "MY",
      retrievedAt: "2026-07-18",
    },
  ],
});

export const malaysiaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((taxYear) => ({
      taxYear,
      modelVersion: `my-${taxYear}-v1`,
      status: taxYear === "2025" ? "current" : "historical-supported",
      order: Number(taxYear),
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "year-of-assessment",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["resident-chargeable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "individualRebateSchedule", "chargeableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Malaysia resident individual-tax scope",
            description: "The caller confirms the amount is chargeable income governed by the resident individual table.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          individualRebateSchedule: {
            type: "string",
            title: "Individual rebate schedule",
            description: "Select whether the legally applicable separate-assessment RM400 individual rebate is claimed.",
            enum: ["none", "individual"],
            "x-taxcraft-kind": "plain",
          },
          chargeableIncomeMinor: {
            type: "integer",
            title: "Chargeable income",
            description: "Caller-confirmed chargeable income in MYR after applicable reliefs and deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "MYR",
          },
        },
      },
      rounding: [
        { stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 },
        { stage: "individual-rebate", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map((taxYear) => [taxYear, model(taxYear)])),
});

function model(taxYear) {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      if (facts.individualRebateSchedule === "individual" && facts.chargeableIncomeMinor > REBATE_INCOME_LIMIT_MINOR) {
        return {
          ok: false,
          issues: [{
            code: "facts.inconsistent",
            path: "$.individualRebateSchedule",
            message: "The RM400 individual rebate is unavailable when chargeable income exceeds RM35,000.",
          }],
        };
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.chargeableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const availableRebateMinor = facts.individualRebateSchedule === "individual"
        ? INDIVIDUAL_REBATE_MINOR
        : 0;
      const rebate = applyTaxCredit({
        taxMinor: progressive.taxMinor,
        creditMinor: availableRebateMinor,
        refundable: false,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `my.pit.${taxYear}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} resident income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `my.pit.${taxYear}.zero-income`,
          label: "Income tax on zero chargeable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      if (rebate.appliedCreditMinor > 0) {
        lines.push({
          ruleId: `my.pit.${taxYear}.individual-rebate`,
          label: "Separate-assessment individual rebate applied",
          amountMinor: -rebate.appliedCreditMinor,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          chargeableIncomeMinor: facts.chargeableIncomeMinor,
          grossIncomeTaxMinor: progressive.taxMinor,
          availableIndividualRebateMinor: availableRebateMinor,
          individualRebateAppliedMinor: rebate.appliedCreditMinor,
          incomeTaxMinor: rebate.taxAfterCreditMinor,
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
