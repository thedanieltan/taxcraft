import {
  ROUNDING_MODE,
  applyBasisPoints,
  calculateProgressiveBands,
  definePitCountryPackage,
  roundRatio,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const STANDARD_EXEMPTION_MINOR = 14_400_000;
const BANDS = Object.freeze([
  { upperBoundMinor: 2_000_000, rateBasisPoints: 700 },
  { upperBoundMinor: 4_000_000, rateBasisPoints: 800 },
  { upperBoundMinor: 8_000_000, rateBasisPoints: 900 },
  { upperBoundMinor: 16_000_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: 28_000_000, rateBasisPoints: 1_100 },
  { upperBoundMinor: null, rateBasisPoints: 1_200 },
]);

const DEFINITION = Object.freeze({
  code: "MO",
  name: "Macao professional tax",
  currency: "MOP",
  supported: [
    "economic-year 2026 ordinary professional-tax schedule",
    "standard MOP 144,000 exemption and progressive 7% to 12% bands",
    "2026 budget deduction equal to 30% of assessed professional tax",
    "whole-pataca upward rounding of the final professional-tax assessment",
  ],
  unsupported: [
    "gross remuneration, non-taxable income, expense and professional-income derivation",
    "enhanced exemption for taxpayers aged over 65 or with qualifying permanent disability",
    "self-employed accounting-profit determination and fixed professional licence charges",
    "withholding-period calculations, employer remittance, annual reconciliation and refunds",
    "the separate 60% refund of professional tax paid for economic year 2024",
    "foreign-tax relief, prior payments, penalties and interest",
    "residence, source, taxpayer-group classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual professional income after non-taxable items but before the standard MOP 144,000 exemption.",
    "The ordinary exemption applies; the enhanced age or disability exemption does not apply.",
    "The 30% budget deduction is applied to the whole-pataca gross assessment and the final amount due is rounded upward to a whole pataca.",
  ],
  sources: [
    {
      sourceId: "mo.budget-2026-professional-tax-relief",
      publisher: "Official Gazette of the Macao Special Administrative Region",
      publisherType: "legislation",
      title: "Law No. 13/2025 — 2026 budget professional-tax deduction and exemption",
      url: "https://bo.dsaj.gov.mo/bo/i/2025/52/lei13.asp?printer=1",
      jurisdiction: "MO",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "mo.law.professional-tax-article-7",
      publisher: "Official Gazette of the Macao Special Administrative Region",
      publisherType: "legislation",
      title: "Law No. 2/78/M — Professional Tax Regulation, articles 7 and 8",
      url: "https://bo.dsaj.gov.mo/bo/i/78/08/lei02.asp?printer=1",
      jurisdiction: "MO",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "mo.dsf.professional-tax-overview",
      publisher: "Financial Services Bureau of the Macao SAR",
      publisherType: "tax-authority",
      title: "Professional tax — rates and calculation method",
      url: "https://www.dsf.gov.mo/zh-hans/tax/tax_introduction/salaries_tax",
      jurisdiction: "MO",
      retrievedAt: "2026-07-22",
    },
  ],
});

export const macaoPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `mo-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["ordinary-professional-income-before-standard-exemption"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "annualProfessionalIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Macao ordinary professional-tax scope",
            description: "The caller confirms the ordinary MOP 144,000 exemption and professional-tax schedule apply.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          annualProfessionalIncomeMinor: {
            type: "integer",
            title: "Annual professional income",
            description: "Caller-confirmed annual professional income in patacas after non-taxable items but before the standard exemption.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "MOP",
          },
        },
      },
      rounding: [
        { stage: "progressive-band-tax", mode: "half-up", unitMinor: 1 },
        { stage: "gross-assessment", mode: "ceiling", unitMinor: 100 },
        { stage: "final-assessment", mode: "ceiling", unitMinor: 100 },
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
      const taxableProfessionalIncomeMinor = Math.max(
        0,
        facts.annualProfessionalIncomeMinor - STANDARD_EXEMPTION_MINOR,
      );
      const progressive = calculateProgressiveBands({
        taxableMinor: taxableProfessionalIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const grossAssessmentMinor = roundToWholePataca(progressive.taxMinor);
      const budgetDeductionCalculatedMinor = applyBasisPoints(
        grossAssessmentMinor,
        3_000,
        ROUNDING_MODE.HALF_UP,
      );
      const taxAfterBudgetDeductionMinor = Math.max(
        0,
        grossAssessmentMinor - budgetDeductionCalculatedMinor,
      );
      const incomeTaxMinor = roundToWholePataca(taxAfterBudgetDeductionMinor);
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `mo.pit.${TAX_YEAR}.professional-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} professional-income band before 2026 budget deduction`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `mo.pit.${TAX_YEAR}.professional-exempt-income`,
          label: "Professional income within the standard exemption",
          amountMinor: 0,
          sourceIds,
        });
      }
      lines.push({
        ruleId: `mo.pit.${TAX_YEAR}.budget-deduction-and-rounding`,
        label: "Net professional tax after 30% budget deduction and whole-pataca rounding",
        amountMinor: incomeTaxMinor,
        sourceIds,
      });

      return {
        currency: DEFINITION.currency,
        totals: {
          annualProfessionalIncomeMinor: facts.annualProfessionalIncomeMinor,
          standardExemptionMinor: STANDARD_EXEMPTION_MINOR,
          taxableProfessionalIncomeMinor,
          grossBandTaxMinor: progressive.taxMinor,
          grossAssessmentMinor,
          budgetDeductionCalculatedMinor,
          taxAfterBudgetDeductionMinor,
          incomeTaxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function roundToWholePataca(amountMinor) {
  return roundRatio(amountMinor, 100, ROUNDING_MODE.CEILING) * 100;
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
