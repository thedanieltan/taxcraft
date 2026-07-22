import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026-27";
const FILING_SCHEDULES = Object.freeze(["individual", "joint"]);
const SCHEDULES = Object.freeze({
  individual: Object.freeze({
    personalAllowancePounds: 17_000,
    allowanceTaperThresholdPounds: 100_000,
    standardRateBandPounds: 6_500,
  }),
  joint: Object.freeze({
    personalAllowancePounds: 34_000,
    allowanceTaperThresholdPounds: 200_000,
    standardRateBandPounds: 13_000,
  }),
});

const DEFINITION = Object.freeze({
  code: "IM",
  name: "Isle of Man resident individual and joint income tax",
  currency: "GBP",
  supported: [
    "tax year 2026-27 resident individual and jointly assessed couple schedules",
    "GBP 17,000 individual and GBP 34,000 joint personal allowances",
    "personal-allowance reduction of GBP 1 for every GBP 2 of total income above GBP 100,000 or GBP 200,000",
    "10% standard-rate bands of GBP 6,500 or GBP 13,000 and 21% higher rate",
    "caller-confirmed additional allowances after eligibility determination",
  ],
  unsupported: [
    "gross-income, assessable-income, expense, deduction and relief derivation",
    "eligibility for single-parent, blind, disabled, nursing, medical, donation, interest and other allowances",
    "non-resident rate and non-resident source-income calculation",
    "income-tax cap election and cap eligibility",
    "National Insurance contributions",
    "payroll withholding, prior payments and assessment reconciliation",
    "foreign-tax credit, treaty relief, penalties, interest and refunds",
    "residence, income classification, joint-assessment eligibility and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied assessable income after legally applicable expenses and deductions but before personal and additional allowances.",
    "The caller supplied total income used for the statutory personal-allowance taper.",
    "The caller supplied any legally available additional allowances without identity or eligibility data.",
    "Amounts are supplied in whole pounds so the taper and tax-rate calculations are deterministic in pence.",
  ],
  sources: [
    {
      sourceId: "im.gov.rates-and-allowances-2026-27",
      publisher: "Isle of Man Government",
      publisherType: "tax-authority",
      title: "Income tax rates and allowances — 2026/27",
      url: "https://www.gov.im/categories/tax-vat-and-your-money/income-tax-and-national-insurance/individuals/residents/rates-and-allowances/",
      jurisdiction: "IM",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "im.gov.budget-2026",
      publisher: "Isle of Man Government",
      publisherType: "government-agency",
      title: "Budget 2026: all the facts and figures",
      url: "https://www.gov.im/news/2026/feb/17/budget-2026-all-the-facts-and-figures/",
      jurisdiction: "IM",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "im.gov.budget-speech-2026",
      publisher: "Isle of Man Treasury",
      publisherType: "finance-ministry",
      title: "Treasury Minister's Budget Speech 2026",
      url: "https://www.gov.im/news/2026/feb/17/treasury-ministers-budget-speech-2026/",
      jurisdiction: "IM",
      retrievedAt: "2026-07-22",
    },
  ],
});

export const isleOfManPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: "im-2026-27-v1", status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "tax-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: FILING_SCHEDULES,
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "scopeConfirmed",
          "filingSchedule",
          "assessableIncomePounds",
          "totalIncomeForAllowanceTaperPounds",
          "additionalAllowancesPounds",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Isle of Man resident schedule",
            description: "The caller confirms the resident individual or joint 2026-27 schedule is legally applicable.",
            "x-taxcraft-kind": "confirmed-status",
          },
          filingSchedule: {
            type: "string",
            enum: FILING_SCHEDULES,
            title: "Resident filing schedule",
            "x-taxcraft-kind": "enum",
          },
          assessableIncomePounds: {
            type: "integer",
            minimum: 0,
            title: "Assessable income before personal allowances",
            description: "Caller-confirmed assessable income after expenses and deductions but before personal and additional allowances, in whole pounds.",
            "x-taxcraft-kind": "plain",
          },
          totalIncomeForAllowanceTaperPounds: {
            type: "integer",
            minimum: 0,
            title: "Total income for personal-allowance taper",
            description: "Caller-confirmed total income used to reduce the personal allowance, in whole pounds.",
            "x-taxcraft-kind": "plain",
          },
          additionalAllowancesPounds: {
            type: "integer",
            minimum: 0,
            title: "Additional allowances",
            description: "Caller-confirmed legally available additional allowances, excluding the ordinary personal allowance, in whole pounds.",
            "x-taxcraft-kind": "plain",
          },
        },
      },
      rounding: [{ stage: "whole-pound-allowance-and-rate-calculation", mode: "floor", unitMinor: 1 }],
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
      const schedule = SCHEDULES[facts.filingSchedule];
      const taperExcessPounds = Math.max(
        0,
        facts.totalIncomeForAllowanceTaperPounds - schedule.allowanceTaperThresholdPounds,
      );
      const personalAllowanceReductionPounds = Math.floor(taperExcessPounds / 2);
      const personalAllowancePounds = Math.max(
        0,
        schedule.personalAllowancePounds - personalAllowanceReductionPounds,
      );
      const totalAllowancesPounds = personalAllowancePounds + facts.additionalAllowancesPounds;
      const taxableIncomePounds = Math.max(0, facts.assessableIncomePounds - totalAllowancesPounds);
      const standardRateBasePounds = Math.min(taxableIncomePounds, schedule.standardRateBandPounds);
      const higherRateBasePounds = Math.max(0, taxableIncomePounds - schedule.standardRateBandPounds);
      const standardRateTaxMinor = standardRateBasePounds * 10;
      const higherRateTaxMinor = higherRateBasePounds * 21;
      const incomeTaxMinor = standardRateTaxMinor + higherRateTaxMinor;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);

      return {
        currency: DEFINITION.currency,
        totals: {
          assessableIncomePounds: facts.assessableIncomePounds,
          totalIncomeForAllowanceTaperPounds: facts.totalIncomeForAllowanceTaperPounds,
          basePersonalAllowancePounds: schedule.personalAllowancePounds,
          personalAllowanceReductionPounds,
          personalAllowancePounds,
          additionalAllowancesPounds: facts.additionalAllowancesPounds,
          totalAllowancesPounds,
          taxableIncomePounds,
          standardRateBasePounds,
          higherRateBasePounds,
          standardRateTaxMinor,
          higherRateTaxMinor,
          incomeTaxMinor,
        },
        lines: [
          {
            ruleId: `im.pit.${TAX_YEAR}.${facts.filingSchedule}.standard-rate`,
            label: "10% standard-rate income tax",
            amountMinor: standardRateTaxMinor,
            sourceIds,
          },
          {
            ruleId: `im.pit.${TAX_YEAR}.${facts.filingSchedule}.higher-rate`,
            label: "21% higher-rate income tax",
            amountMinor: higherRateTaxMinor,
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
