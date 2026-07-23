import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BASIC_TAX_FREE_AMOUNT_MINOR = 1_118_000;
const BASIC_TAX_FREE_REDUCTION_MINOR = 279_500;
const BANDS = Object.freeze([
  { upperBoundMinor: 1_672_000, rateBasisPoints: 2_500 },
  { upperBoundMinor: 2_951_000, rateBasisPoints: 4_000 },
  { upperBoundMinor: 5_107_000, rateBasisPoints: 4_500 },
  { upperBoundMinor: null, rateBasisPoints: 5_000 },
]);

const DEFINITION = Object.freeze({
  code: "BE",
  name: "Belgium 2026 resident personal income tax and municipal addition",
  currency: "EUR",
  supported: [
    "income year 2026 ordinary resident personal income tax on caller-confirmed jointly taxable income",
    "25%, 40%, 45% and 50% statutory income bands",
    "EUR 11,180 basic tax-free amount, represented by its EUR 2,795 standard tax reduction",
    "caller-confirmed municipal addition calculated as a percentage of personal income tax",
    "cent-level deterministic calculation and line-total reconciliation",
  ],
  unsupported: [
    "gross-income, professional-expense, social-contribution, deduction and taxable-income derivation",
    "increased tax-free amounts, dependants, disability, marital quotient and spouse allocation",
    "regional tax reductions, credits, rebates, separately taxed income and special schedules",
    "municipality identification or municipal-rate lookup",
    "withholding, advance payments, special social-security contributions and assessment reconciliation",
    "residence, source, filing, family, dependant, deduction and relief eligibility determinations",
    "non-resident tax, treaty positions, prior payments, refunds, penalties and interest",
  ],
  assumptions: [
    "The caller supplied annual jointly taxable income after legally applicable classifications, expenses and deductions.",
    "The caller is entitled only to the standard EUR 11,180 basic tax-free amount for income year 2026.",
    "The caller supplied the applicable municipal addition as basis points, where 700 means 7.00%.",
    "No regional relief, family enhancement, separately taxed income or social-security amount is included.",
  ],
  sources: [
    {
      sourceId: "be.fps-finance.pit-rates-2026",
      publisher: "Belgian Federal Public Service Finance",
      publisherType: "tax-authority",
      title: "Personal income-tax rates and basic tax-free amount — income year 2026",
      url: "https://financien.belgium.be/nl/particulieren/belastingaangifte/tarieven-belastbaar-inkomen",
      jurisdiction: "BE",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "be.fps-finance.municipal-addition",
      publisher: "Belgian Federal Public Service Finance",
      publisherType: "tax-authority",
      title: "Municipal addition to personal income tax",
      url: "https://financien.belgium.be/nl/particulieren/belastingaangifte/gemeentebelasting",
      jurisdiction: "BE",
      retrievedAt: "2026-07-24",
    },
  ],
});

export const belgiumPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `be-${TAX_YEAR}-ordinary-resident-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["ordinary-jointly-taxable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: true,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "scopeConfirmed",
          "taxableIncomeMinor",
          "municipalSurchargeBasisPoints",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Belgium ordinary resident scope",
            description: "The caller confirms the supplied income and municipal rate apply to the supported income-year 2026 calculation.",
            "x-taxcraft-kind": "confirmed-status",
          },
          taxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Annual jointly taxable income",
            description: "Caller-confirmed annual jointly taxable income in euro cents after applicable classifications, expenses and deductions.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
          municipalSurchargeBasisPoints: {
            type: "integer",
            minimum: 0,
            maximum: 2_000,
            title: "Municipal addition",
            description: "Caller-confirmed municipal addition in basis points; 700 represents 7.00%.",
            "x-taxcraft-kind": "plain",
          },
        },
      },
      rounding: [
        { stage: "ordinary-personal-income-tax", mode: "half-up", unitMinor: 1 },
        { stage: "municipal-addition", mode: "half-up", unitMinor: 1 },
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
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const taxFreeReductionAppliedMinor = Math.min(
        progressive.taxMinor,
        BASIC_TAX_FREE_REDUCTION_MINOR,
      );
      const personalIncomeTaxMinor = progressive.taxMinor - taxFreeReductionAppliedMinor;
      const municipalIncomeTaxMinor = multiplyBasisPointsHalfUp(
        personalIncomeTaxMinor,
        facts.municipalSurchargeBasisPoints,
      );
      const totalIncomeTaxMinor = personalIncomeTaxMinor + municipalIncomeTaxMinor;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `be.pit.${TAX_YEAR}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ordinary personal income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds: ["be.fps-finance.pit-rates-2026"],
      }));
      if (taxFreeReductionAppliedMinor > 0) {
        lines.push({
          ruleId: `be.pit.${TAX_YEAR}.basic-tax-free-amount`,
          label: "Basic tax-free amount tax reduction",
          amountMinor: -taxFreeReductionAppliedMinor,
          sourceIds: ["be.fps-finance.pit-rates-2026"],
        });
      }
      lines.push({
        ruleId: `be.pit.${TAX_YEAR}.municipal-addition`,
        label: `Municipal addition at ${formatBasisPoints(facts.municipalSurchargeBasisPoints)}`,
        amountMinor: municipalIncomeTaxMinor,
        sourceIds: ["be.fps-finance.municipal-addition"],
      });
      if (lines.length === 1) {
        lines.unshift({
          ruleId: `be.pit.${TAX_YEAR}.zero-income`,
          label: "Personal income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          basicTaxFreeAmountMinor: BASIC_TAX_FREE_AMOUNT_MINOR,
          grossPersonalIncomeTaxMinor: progressive.taxMinor,
          basicTaxFreeReductionAvailableMinor: BASIC_TAX_FREE_REDUCTION_MINOR,
          basicTaxFreeReductionAppliedMinor: taxFreeReductionAppliedMinor,
          personalIncomeTaxMinor,
          municipalSurchargeBasisPoints: facts.municipalSurchargeBasisPoints,
          municipalIncomeTaxMinor,
          totalIncomeTaxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function multiplyBasisPointsHalfUp(amountMinor, basisPoints) {
  return Math.floor(((amountMinor * basisPoints) + 5_000) / 10_000);
}

function formatRate(rateBasisPoints) {
  return `${rateBasisPoints / 100}%`;
}

function formatBasisPoints(basisPoints) {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}
