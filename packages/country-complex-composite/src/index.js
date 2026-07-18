import {
  ROUNDING_MODE,
  applyTaxCredit,
  calculateProgressiveBands,
  compareTaxAmounts,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const MODELS = Object.freeze({
  "2023-24": {
    standardBands: [{ upperBoundMinor: null, rateBasisPoints: 1500 }],
    taxReductionCapMinor: 300_000,
  },
  "2024-25": {
    standardBands: [
      { upperBoundMinor: 500_000_000, rateBasisPoints: 1500 },
      { upperBoundMinor: null, rateBasisPoints: 1600 },
    ],
    taxReductionCapMinor: 150_000,
  },
  "2025-26": {
    standardBands: [
      { upperBoundMinor: 500_000_000, rateBasisPoints: 1500 },
      { upperBoundMinor: null, rateBasisPoints: 1600 },
    ],
    taxReductionCapMinor: 300_000,
  },
});
const TAX_YEARS = Object.freeze(Object.keys(MODELS));
const PROGRESSIVE_BANDS = Object.freeze([
  { upperBoundMinor: 5_000_000, rateBasisPoints: 200 },
  { upperBoundMinor: 10_000_000, rateBasisPoints: 600 },
  { upperBoundMinor: 15_000_000, rateBasisPoints: 1000 },
  { upperBoundMinor: 20_000_000, rateBasisPoints: 1400 },
  { upperBoundMinor: null, rateBasisPoints: 1700 },
]);

const DEFINITION = Object.freeze({
  code: "HK",
  name: "Hong Kong salaries tax lower-of computation",
  currency: "HKD",
  supported: [
    "salaries tax comparison between progressive rates on net chargeable income and standard rates on net income",
    "2%, 6%, 10%, 14% and 17% progressive rates",
    "15% standard rate for 2023/24 and two-tier 15%/16% standard rates from 2024/25",
    "automatic selection of the lower candidate liability",
    "year-specific final-tax reductions for 2023/24 through 2025/26",
  ],
  unsupported: [
    "net-income, deduction, allowance and net-chargeable-income derivation",
    "married-person, joint-assessment and household allocation decisions",
    "personal assessment, property tax and profits tax",
    "provisional tax, withholding, prior payments, refunds and instalments",
    "residence, source, employment-income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied net income after deductions and net chargeable income after allowances.",
    "Net chargeable income does not exceed net income.",
    "The package calculates salaries tax only and applies the legislated final-tax reduction for the selected year.",
  ],
  sources: [
    {
      sourceId: "hk.ird.salaries-tax-lower-of-rule",
      publisher: "Hong Kong Inland Revenue Department",
      publisherType: "tax-authority",
      title: "Government statement on salaries tax progressive and standard-rate comparison",
      url: "https://www.ird.gov.hk/eng/ppr/archives/23120601.htm",
      jurisdiction: "HK",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "hk.ird.progressive-rate-example-2025-26",
      publisher: "Hong Kong Inland Revenue Department",
      publisherType: "tax-authority",
      title: "Individual business owner personal assessment example",
      url: "https://www.ird.gov.hk/eng/tax/ind_sp_paeg.htm",
      jurisdiction: "HK",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "hk.ird.two-tier-standard-rates-2024",
      publisher: "Hong Kong Inland Revenue Department",
      publisherType: "tax-authority",
      title: "2024-25 Budget — two-tiered standard rates",
      url: "https://www.ird.gov.hk/eng/tax/budget2024.htm",
      jurisdiction: "HK",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "hk.ird.tax-reduction-2024-25",
      publisher: "Hong Kong Inland Revenue Department",
      publisherType: "tax-authority",
      title: "2025-26 Budget tax measures",
      url: "https://www.ird.gov.hk/eng/tax/budget2025.htm",
      jurisdiction: "HK",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "hk.ird.tax-reduction-2025-26",
      publisher: "Hong Kong Inland Revenue Department",
      publisherType: "tax-authority",
      title: "2026-27 Budget tax measures",
      url: "https://www.ird.gov.hk/eng/tax/budget.htm",
      jurisdiction: "HK",
      retrievedAt: "2026-07-18",
    },
  ],
});

export const hongKongPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((taxYear, index) => ({
      taxYear,
      modelVersion: `hk-${taxYear}-v1`,
      status: taxYear === "2025-26" ? "current" : "historical-supported",
      order: index + 1,
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "year-of-assessment",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["salaries-tax-progressive", "salaries-tax-standard"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "netIncomeMinor", "netChargeableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Hong Kong salaries-tax scope",
            description: "The caller confirms the supplied amounts are net income and net chargeable income for salaries tax.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          netIncomeMinor: {
            type: "integer",
            title: "Net income before allowances",
            description: "Net salaries income in HKD after deductions but before personal allowances.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "HKD",
          },
          netChargeableIncomeMinor: {
            type: "integer",
            title: "Net chargeable income",
            description: "Net chargeable income in HKD after allowances for the progressive-rate calculation.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "HKD",
          },
        },
      },
      rounding: [
        { stage: "progressive-salaries-tax", mode: "half-up", unitMinor: 1 },
        { stage: "standard-rate-salaries-tax", mode: "half-up", unitMinor: 1 },
        { stage: "final-tax-reduction", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map((taxYear) => [taxYear, model(taxYear)])),
});

export const complexCompositePackages = Object.freeze([hongKongPackage]);
export const complexCompositePackagesByJurisdiction = Object.freeze({ HK: hongKongPackage });

function model(taxYear) {
  const parameters = MODELS[taxYear];
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      if (facts.netChargeableIncomeMinor > facts.netIncomeMinor) {
        return {
          ok: false,
          issues: [{
            code: "facts.inconsistent",
            path: "$.netChargeableIncomeMinor",
            message: "Net chargeable income cannot exceed net income before allowances.",
          }],
        };
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.netChargeableIncomeMinor,
        bands: PROGRESSIVE_BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const standard = calculateProgressiveBands({
        taxableMinor: facts.netIncomeMinor,
        bands: parameters.standardBands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const comparison = compareTaxAmounts({
        primaryMinor: progressive.taxMinor,
        alternativeMinor: standard.taxMinor,
        select: "lower",
      });
      const reduction = applyTaxCredit({
        taxMinor: comparison.selectedMinor,
        creditMinor: parameters.taxReductionCapMinor,
        refundable: false,
      });
      const selectedSchedule = comparison.selected === "primary" ? "progressive" : "standard";
      const selectedResult = selectedSchedule === "progressive" ? progressive : standard;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = selectedResult.bands.map((band) => ({
        ruleId: `hk.pit.${taxYear}.${selectedSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${selectedSchedule}-schedule salaries-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `hk.pit.${taxYear}.${selectedSchedule}.zero-income`,
          label: `Zero ${selectedSchedule}-schedule salaries tax`,
          amountMinor: 0,
          sourceIds,
        });
      }
      if (reduction.appliedCreditMinor > 0) {
        lines.push({
          ruleId: `hk.pit.${taxYear}.final-tax-reduction`,
          label: "Year-specific final salaries-tax reduction applied",
          amountMinor: -reduction.appliedCreditMinor,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          netIncomeMinor: facts.netIncomeMinor,
          netChargeableIncomeMinor: facts.netChargeableIncomeMinor,
          progressiveTaxMinor: progressive.taxMinor,
          standardRateTaxMinor: standard.taxMinor,
          selectedTaxBeforeReductionMinor: comparison.selectedMinor,
          availableFinalTaxReductionMinor: parameters.taxReductionCapMinor,
          finalTaxReductionAppliedMinor: reduction.appliedCreditMinor,
          incomeTaxMinor: reduction.taxAfterCreditMinor,
        },
        lines,
        assumptions: [
          ...DEFINITION.assumptions,
          `The ${selectedSchedule} schedule produced the lower pre-reduction liability and was selected.`,
        ],
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
