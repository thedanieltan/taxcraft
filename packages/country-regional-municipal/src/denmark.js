import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const AM_RATE_BASIS_POINTS = 800;
const BOTTOM_TAX_RATE_BASIS_POINTS = 1_201;
const PERSONAL_ALLOWANCE_MINOR = 5_410_000;
const MIDDLE_TAX_THRESHOLD_AFTER_AM_MINOR = 64_120_000;

const DEFINITION = Object.freeze({
  code: "DK",
  name: "Denmark 2026 employment income tax below the middle-tax threshold",
  currency: "DKK",
  supported: [
    "calendar-year 2026 ordinary resident employment income subject to the 8% labour-market contribution",
    "12.01% bottom-bracket tax on employment income after the labour-market contribution",
    "caller-confirmed municipal taxable income and municipal income-tax percentage",
    "DKK 54,100 adult personal allowance applied separately to bottom-bracket and municipal tax",
    "employment income not exceeding DKK 641,200 after labour-market contribution",
    "cent-level deterministic calculation and line-total reconciliation",
  ],
  unsupported: [
    "personal income above the 2026 middle-tax threshold or any middle, top or additional-top bracket tax",
    "positive or negative capital income, share income, pension income, benefits, business income and foreign income",
    "employment, job, senior, single-parent, pension, service, travel and other deduction derivation",
    "municipality identification, municipal-rate lookup, church tax and the personal-income tax ceiling",
    "partial-year residence, taxpayers under age 18, spouse transfers and unused allowance transfers",
    "withholding, preliminary tax, property taxes, treaty positions and assessment reconciliation",
    "residence, source, age, income classification, deduction and relief eligibility determinations",
  ],
  assumptions: [
    "The caller is at least age 18, fully tax resident for all of 2026 and within the ordinary employment-income schedule.",
    "The supplied employment income is fully subject to the 8% labour-market contribution.",
    "The supplied municipal taxable income already reflects legally applicable employment, job and other deductions but is before personal allowance relief.",
    "The caller supplied the applicable municipal rate in basis points, where 2,500 means 25.00%.",
    "The caller has no capital income or other income that changes the bottom-bracket or middle-tax calculation.",
  ],
  sources: [
    {
      sourceId: "dk.skat.am-contribution-2026",
      publisher: "Danish Tax Agency",
      publisherType: "tax-authority",
      title: "Labour market contribution — 8% and age rule from 2026",
      url: "https://skat.dk/borger/am-bidrag",
      jurisdiction: "DK",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "dk.skat.bracket-taxes-2026",
      publisher: "Danish Tax Agency",
      publisherType: "tax-authority",
      title: "Bottom, middle, top and additional-top bracket tax — 2026",
      url: "https://skat.dk/hjaelp/bundskat-mellemskat-topskat-og-toptopskat",
      jurisdiction: "DK",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "dk.skm.personal-tax-act-rates-2026",
      publisher: "Danish Ministry of Taxation",
      publisherType: "finance-ministry",
      title: "Personal Tax Act rates and thresholds — 2026",
      url: "https://skm.dk/tal-og-metode/satser/satser-og-beloebsgraenser-i-lovgivningen/personskatteloven",
      jurisdiction: "DK",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "dk.skat.tax-liability-personal-allowance",
      publisher: "Danish Tax Agency",
      publisherType: "tax-authority",
      title: "Tax liability calculation showing personal allowance against bottom and municipal tax",
      url: "https://skat.dk/en-us/individuals/taxation-in-denmark/tax-liability",
      jurisdiction: "DK",
      retrievedAt: "2026-07-24",
    },
  ],
});

export const denmarkPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `dk-${TAX_YEAR}-employment-below-middle-tax-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["ordinary-employment-below-middle-tax-threshold"],
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
          "employmentIncomeSubjectToAmMinor",
          "municipalTaxableIncomeMinor",
          "municipalTaxRateBasisPoints",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Denmark 2026 lower-income employment scope",
            description: "The caller confirms the supplied facts fit the supported full-year adult resident employment-income scope.",
            "x-taxcraft-kind": "confirmed-status",
          },
          employmentIncomeSubjectToAmMinor: {
            type: "integer",
            minimum: 0,
            title: "Employment income subject to AM contribution",
            description: "Caller-confirmed annual employment income in øre that is fully subject to the 8% labour-market contribution.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "DKK",
          },
          municipalTaxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Municipal taxable income before personal allowance",
            description: "Caller-confirmed municipal taxable income in øre after applicable deductions but before the personal allowance tax reduction.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "DKK",
          },
          municipalTaxRateBasisPoints: {
            type: "integer",
            minimum: 0,
            maximum: 3_000,
            title: "Municipal income-tax rate",
            description: "Caller-confirmed municipal rate in basis points; 2,500 means 25.00%.",
            "x-taxcraft-kind": "percentage-basis-points",
          },
        },
      },
      rounding: [
        { stage: "labour-market-contribution", mode: "floor", unitMinor: 1 },
        { stage: "bottom-bracket-tax", mode: "floor", unitMinor: 1 },
        { stage: "municipal-income-tax", mode: "floor", unitMinor: 1 },
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
      const labourMarketContributionMinor = applyRate(
        facts.employmentIncomeSubjectToAmMinor,
        AM_RATE_BASIS_POINTS,
      );
      const personalIncomeAfterAmMinor = facts.employmentIncomeSubjectToAmMinor
        - labourMarketContributionMinor;
      const issues = [];
      if (personalIncomeAfterAmMinor > MIDDLE_TAX_THRESHOLD_AFTER_AM_MINOR) {
        issues.push({
          code: "scope.middle-tax-threshold",
          path: "$.facts.employmentIncomeSubjectToAmMinor",
          message: "Employment income after labour-market contribution exceeds the supported DKK 641,200 threshold.",
        });
      }
      if (facts.municipalTaxableIncomeMinor > personalIncomeAfterAmMinor) {
        issues.push({
          code: "scope.municipal-base",
          path: "$.facts.municipalTaxableIncomeMinor",
          message: "Municipal taxable income exceeds the supported employment-only personal income after AM contribution.",
        });
      }
      return issues.length ? { ok: false, issues } : { ok: true, facts };
    },
    calculate({ facts }) {
      const labourMarketContributionMinor = applyRate(
        facts.employmentIncomeSubjectToAmMinor,
        AM_RATE_BASIS_POINTS,
      );
      const personalIncomeAfterAmMinor = facts.employmentIncomeSubjectToAmMinor
        - labourMarketContributionMinor;

      const grossBottomTaxMinor = applyRate(
        personalIncomeAfterAmMinor,
        BOTTOM_TAX_RATE_BASIS_POINTS,
      );
      const bottomAllowanceValueMinor = applyRate(
        PERSONAL_ALLOWANCE_MINOR,
        BOTTOM_TAX_RATE_BASIS_POINTS,
      );
      const bottomAllowanceAppliedMinor = Math.min(
        grossBottomTaxMinor,
        bottomAllowanceValueMinor,
      );
      const bottomTaxMinor = grossBottomTaxMinor - bottomAllowanceAppliedMinor;

      const grossMunicipalTaxMinor = applyRate(
        facts.municipalTaxableIncomeMinor,
        facts.municipalTaxRateBasisPoints,
      );
      const municipalAllowanceValueMinor = applyRate(
        PERSONAL_ALLOWANCE_MINOR,
        facts.municipalTaxRateBasisPoints,
      );
      const municipalAllowanceAppliedMinor = Math.min(
        grossMunicipalTaxMinor,
        municipalAllowanceValueMinor,
      );
      const municipalIncomeTaxMinor = grossMunicipalTaxMinor - municipalAllowanceAppliedMinor;
      const totalIncomeTaxMinor = labourMarketContributionMinor + bottomTaxMinor + municipalIncomeTaxMinor;

      const lines = [
        {
          ruleId: `dk.pit.${TAX_YEAR}.labour-market-contribution`,
          label: "Labour-market contribution at 8%",
          amountMinor: labourMarketContributionMinor,
          sourceIds: ["dk.skat.am-contribution-2026"],
        },
        {
          ruleId: `dk.pit.${TAX_YEAR}.bottom-bracket-tax`,
          label: "Bottom-bracket tax before personal allowance",
          amountMinor: grossBottomTaxMinor,
          sourceIds: ["dk.skat.bracket-taxes-2026", "dk.skm.personal-tax-act-rates-2026"],
        },
      ];
      if (bottomAllowanceAppliedMinor > 0) {
        lines.push({
          ruleId: `dk.pit.${TAX_YEAR}.bottom-personal-allowance`,
          label: "Personal allowance reduction against bottom-bracket tax",
          amountMinor: -bottomAllowanceAppliedMinor,
          sourceIds: ["dk.skm.personal-tax-act-rates-2026", "dk.skat.tax-liability-personal-allowance"],
        });
      }
      lines.push({
        ruleId: `dk.pit.${TAX_YEAR}.municipal-tax`,
        label: "Municipal income tax before personal allowance",
        amountMinor: grossMunicipalTaxMinor,
        sourceIds: ["dk.skat.bracket-taxes-2026", "dk.skat.tax-liability-personal-allowance"],
      });
      if (municipalAllowanceAppliedMinor > 0) {
        lines.push({
          ruleId: `dk.pit.${TAX_YEAR}.municipal-personal-allowance`,
          label: "Personal allowance reduction against municipal income tax",
          amountMinor: -municipalAllowanceAppliedMinor,
          sourceIds: ["dk.skm.personal-tax-act-rates-2026", "dk.skat.tax-liability-personal-allowance"],
        });
      }

      return {
        currency: DEFINITION.currency,
        totals: {
          employmentIncomeSubjectToAmMinor: facts.employmentIncomeSubjectToAmMinor,
          labourMarketContributionMinor,
          personalIncomeAfterAmMinor,
          grossBottomTaxMinor,
          bottomAllowanceValueMinor,
          bottomAllowanceAppliedMinor,
          bottomTaxMinor,
          municipalTaxableIncomeMinor: facts.municipalTaxableIncomeMinor,
          municipalTaxRateBasisPoints: facts.municipalTaxRateBasisPoints,
          grossMunicipalTaxMinor,
          municipalAllowanceValueMinor,
          municipalAllowanceAppliedMinor,
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

function applyRate(amountMinor, basisPoints) {
  return Math.floor(amountMinor * basisPoints / 10_000);
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}
