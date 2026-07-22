import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BASE_EXEMPTION_THRESHOLD_POUNDS = 21_250;

const DEFINITION = Object.freeze({
  code: "JE",
  name: "Jersey standard and marginal-relief income tax",
  currency: "GBP",
  supported: [
    "year of assessment 2026 independent individual income tax",
    "20% standard-rate calculation on caller-confirmed liable income after allowable expenses and pension contributions",
    "26% marginal-relief calculation after the caller-confirmed total exemption threshold",
    "lower-of-two statutory liability comparison",
  ],
  unsupported: [
    "gross-income, allowable-expense, pension-contribution and liable-income derivation",
    "eligibility for child, additional-child, childcare, compensatory and other threshold additions",
    "benefit-in-kind deduction, annuity limits and relief apportionment",
    "long-term care contribution and social-security contributions",
    "non-resident income exemptions and non-resident relief",
    "ITIS effective-rate calculation, withholding, prior payments and assessment reconciliation",
    "foreign-tax credit, treaty relief, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied liable income after all legally applicable expenses and approved pension contributions.",
    "The caller supplied the total legally applicable 2026 exemption threshold, including any eligible additions.",
    "Amounts are supplied in whole pounds so both statutory percentage calculations are exact in pence.",
    "The result excludes long-term care contributions, ITIS deductions and prior payments.",
  ],
  sources: [
    {
      sourceId: "je.revenue.tax-allowances-2026",
      publisher: "Revenue Jersey",
      publisherType: "tax-authority",
      title: "2026 tax allowances and reliefs",
      url: "https://www.gov.je/TaxesMoney/IncomeTax/Individuals/AllowancesReliefs/pages/2026taxallowances.aspx",
      jurisdiction: "JE",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "je.revenue.marginal-income-deduction",
      publisher: "Revenue Jersey",
      publisherType: "tax-authority",
      title: "Marginal income deduction explained",
      url: "https://www.gov.je/TaxesMoney/IncomeTax/Individuals/AllowancesReliefs/pages/marginalcalculation.aspx",
      jurisdiction: "JE",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "je.revenue.budget-summary-2026",
      publisher: "Revenue Jersey",
      publisherType: "tax-authority",
      title: "2026 budget tax summary",
      url: "https://www.gov.je/TaxesMoney/IncomeTax/Technical/Guidelines/pages/2026budgetsummary.aspx",
      jurisdiction: "JE",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "je.revenue.yearly-tax-assessment",
      publisher: "Revenue Jersey",
      publisherType: "tax-authority",
      title: "Calculating your tax — yearly tax assessment",
      url: "https://www.gov.je/TaxesMoney/IncomeTax/Individuals/PayingTaxEarnings/pages/calculatingtaxassessment.aspx",
      jurisdiction: "JE",
      retrievedAt: "2026-07-22",
    },
  ],
});

export const jerseyPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `je-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["independent-individual-standard-and-marginal"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "liableIncomeAfterDeductionsPounds", "totalExemptionThresholdPounds"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Jersey 2026 individual scope",
            description: "The caller confirms that the supplied income and threshold are legally applicable to the independent individual calculation.",
            "x-taxcraft-kind": "confirmed-status",
          },
          liableIncomeAfterDeductionsPounds: {
            type: "integer",
            minimum: 0,
            title: "Liable income after deductions in whole pounds",
            description: "Income liable to Jersey tax after allowable expenses and approved pension contributions, supplied in whole pounds.",
            "x-taxcraft-kind": "plain",
          },
          totalExemptionThresholdPounds: {
            type: "integer",
            minimum: BASE_EXEMPTION_THRESHOLD_POUNDS,
            title: "Total exemption threshold in whole pounds",
            description: "Caller-confirmed 2026 low-income threshold plus any legally available threshold additions, supplied in whole pounds.",
            "x-taxcraft-kind": "plain",
          },
        },
      },
      rounding: [{ stage: "whole-pound-input-percentage", mode: "half-up", unitMinor: 1 }],
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
      const standardTaxMinor = facts.liableIncomeAfterDeductionsPounds * 20;
      const marginalTaxBasePounds = Math.max(
        0,
        facts.liableIncomeAfterDeductionsPounds - facts.totalExemptionThresholdPounds,
      );
      const marginalTaxMinor = marginalTaxBasePounds * 26;
      const incomeTaxMinor = Math.min(standardTaxMinor, marginalTaxMinor);
      const marginalIncomeDeductionMinor = standardTaxMinor - incomeTaxMinor;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);

      return {
        currency: DEFINITION.currency,
        totals: {
          liableIncomeAfterDeductionsPounds: facts.liableIncomeAfterDeductionsPounds,
          totalExemptionThresholdPounds: facts.totalExemptionThresholdPounds,
          standardTaxMinor,
          marginalTaxBasePounds,
          marginalTaxMinor,
          marginalIncomeDeductionMinor,
          incomeTaxMinor,
        },
        lines: [
          {
            ruleId: `je.pit.${TAX_YEAR}.lower-of-standard-and-marginal`,
            label: incomeTaxMinor === marginalTaxMinor
              ? "26% marginal-relief calculation"
              : "20% standard-rate calculation",
            amountMinor: incomeTaxMinor,
            sourceIds,
          },
        ],
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}
