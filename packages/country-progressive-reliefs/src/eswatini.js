import {
  ROUNDING_MODE,
  applyTaxCredit,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2025-26";
const BANDS = Object.freeze([
  { upperBoundMinor: 10_000_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: 15_000_000, rateBasisPoints: 2_500 },
  { upperBoundMinor: 20_000_000, rateBasisPoints: 3_000 },
  { upperBoundMinor: null, rateBasisPoints: 3_300 },
]);
const REBATES = Object.freeze({
  standard: 820_000,
  "over-60": 1_090_000,
});

const DEFINITION = Object.freeze({
  code: "SZ",
  name: "Eswatini individual income tax",
  currency: "SZL",
  supported: [
    "normal annual individual income tax on caller-confirmed taxable income",
    "standard annual rebate of SZL 8,200",
    "additional annual rebate of SZL 2,700 for the over-60 schedule",
    "income year ended 30 June 2026",
  ],
  unsupported: [
    "taxable-income, employment-benefit, deduction and allowance derivation",
    "redundant and retiring-person concessionary tax schedules",
    "graded tax and social or mandatory contributions",
    "monthly, weekly, daily or cumulative PAYE withholding computations",
    "director, casual-worker, bonus, terminal-benefit and other special payment treatment",
    "withholding tax, provisional tax, prior payments, filing balances, penalties, interest and refunds",
    "rebate eligibility, residence, source and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after all legally applicable deductions, allowances and exclusions.",
    "The caller selected the legally applicable standard or over-60 rebate schedule without providing age or identity data.",
    "The individual is taxed under the normal individual schedule and not a redundant or retiring-person concessionary schedule.",
  ],
  sources: [
    {
      sourceId: "sz.ers.individual-rates-and-rebates",
      publisher: "Eswatini Revenue Service",
      publisherType: "tax-authority",
      title: "Income Tax Rates and Thresholds",
      url: "https://www.ers.org.sz/IncomeTax/RatesandThres",
      jurisdiction: "SZ",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "sz.ers.paye-tool-2026",
      publisher: "Eswatini Revenue Service",
      publisherType: "tax-authority",
      title: "Monthly PAYE Tax Computation Tool 2026",
      url: "https://www.ers.org.sz/IncomeForms",
      jurisdiction: "SZ",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "sz.ers.income-tax-legislation",
      publisher: "Eswatini Revenue Service",
      publisherType: "government-agency",
      title: "Income Tax Legislation",
      url: "https://www.ers.org.sz/LegalandPolicy/TaxLegislation",
      jurisdiction: "SZ",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const eswatiniPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `sz-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "income-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["normal-annual-taxable-income"],
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
            title: "Confirmed Eswatini normal individual-tax scope",
            description: "The caller confirms that the supplied amount is annual taxable income governed by the normal individual rate schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          rebateSchedule: {
            type: "string",
            title: "Individual rebate schedule",
            description: "Select the legally applicable standard or over-60 rebate schedule without providing age or identity data.",
            enum: ["standard", "over-60"],
            "x-taxcraft-kind": "plain",
          },
          taxableIncomeMinor: {
            type: "integer",
            title: "Annual taxable income",
            description: "Caller-confirmed annual taxable income in lilangeni after applicable deductions, allowances and exclusions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "SZL",
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
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const availableRebateMinor = REBATES[facts.rebateSchedule];
      const rebate = applyTaxCredit({
        taxMinor: progressive.taxMinor,
        creditMinor: availableRebateMinor,
        refundable: false,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `sz.pit.${TAX_YEAR}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} normal individual income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `sz.pit.${TAX_YEAR}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      if (rebate.appliedCreditMinor > 0) {
        lines.push({
          ruleId: `sz.pit.${TAX_YEAR}.${facts.rebateSchedule}-rebate`,
          label: facts.rebateSchedule === "over-60"
            ? "Standard and additional over-60 rebates applied"
            : "Standard individual rebate applied",
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
