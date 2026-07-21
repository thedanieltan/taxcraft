import {
  ROUNDING_MODE,
  applyBasisPoints,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const NATIONAL_CONTRIBUTION_THRESHOLD_MINOR = 20_000_000;
const BANDS = Object.freeze([
  { upperBoundMinor: 500_000, rateBasisPoints: 500 },
  { upperBoundMinor: 1_000_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: 1_500_000, rateBasisPoints: 1_500 },
  { upperBoundMinor: 2_000_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: 100_000_000, rateBasisPoints: 2_500 },
  { upperBoundMinor: null, rateBasisPoints: 3_000 },
]);

const DEFINITION = Object.freeze({
  code: "JO",
  name: "Jordan annual natural-person income tax",
  currency: "JOD",
  supported: [
    "calendar-year 2026 ordinary natural-person income-tax schedule",
    "5%, 10%, 15%, 20%, 25% and 30% statutory bands",
    "1% national contribution on taxable income above JOD 200,000",
  ],
  unsupported: [
    "gross-income, expense, loss, exemption, donation and taxable-income derivation",
    "personal, dependant, disability, medical, education, rent, housing-finance and other exemptions",
    "foreign-source, pension, end-of-service, agricultural and other special income schedules",
    "withholding, advance payments, prior payments and return reconciliation",
    "foreign-tax credit, treaty relief, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after all legally applicable deductions and exemptions.",
    "The ordinary natural-person schedule applies to the supplied taxable income.",
    "The national contribution is calculated separately on the portion above JOD 200,000.",
  ],
  sources: [
    {
      sourceId: "jo.istd.income-tax-law-current",
      publisher: "Jordan Income and Sales Tax Department",
      publisherType: "tax-authority",
      title: "Income Tax Law No. 34 of 2014 and amendments — current searchable text",
      url: "https://istd.gov.jo/AR/List/%D9%82%D8%A7%D9%86%D9%88%D9%86_%D8%B6%D8%B1%D9%8A%D8%A8%D8%A9_%D8%A7%D9%84%D8%AF%D8%AE%D9%84",
      jurisdiction: "JO",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "jo.istd.natural-person-bands-2020-onwards",
      publisher: "Jordan Income and Sales Tax Department",
      publisherType: "tax-authority",
      title: "Natural-person income-tax bands effective from 2020 onwards",
      url: "https://istd.gov.jo/Ar/NewsDetails/13__%D8%A7%D8%B1%D8%AA%D9%81%D8%A7%D8%B9_%D8%A7%D9%84%D8%A5%D9%8A%D8%B1%D8%A7%D8%AF%D8%A7%D8%AA_%D8%A7%D9%84%D8%B6%D8%B1%D9%8A%D8%A8%D9%8A%D8%A9",
      jurisdiction: "JO",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "jo.istd.national-contribution-natural-person",
      publisher: "Jordan Income and Sales Tax Department",
      publisherType: "tax-authority",
      title: "National contribution for natural persons",
      url: "https://istd.gov.jo/Ar/NewsDetails/%D8%A7%D9%84%D8%AF%D8%A7%D8%A6%D8%B1%D8%A9_%D8%AA%D8%AF%D8%B9%D9%88_%D9%84%D8%AA%D9%88%D8%B1%D9%8A%D8%AF_%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D9%87%D9%85%D8%A9_%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9_%D8%A8%D8%B4%D9%83%D9%84_%D9%85%D9%86%D9%81%D8%B5%D9%84",
      jurisdiction: "JO",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const jordanPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `jo-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["ordinary-natural-person-taxable-income"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Jordan ordinary natural-person scope",
            "x-taxcraft-kind": "confirmed-status",
          },
          taxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Annual taxable income",
            description: "Caller-confirmed annual taxable income in Jordanian dinar after applicable exemptions and deductions.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "JOD",
          },
        },
      },
      rounding: [
        { stage: "annual-income-tax", mode: "half-up", unitMinor: 1 },
        { stage: "national-contribution", mode: "half-up", unitMinor: 1 },
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
      const contributionBaseMinor = Math.max(
        0,
        facts.taxableIncomeMinor - NATIONAL_CONTRIBUTION_THRESHOLD_MINOR,
      );
      const nationalContributionMinor = applyBasisPoints(
        contributionBaseMinor,
        100,
        ROUNDING_MODE.HALF_UP,
      );
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `jo.pit.${TAX_YEAR}.annual-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} natural-person income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (nationalContributionMinor > 0) {
        lines.push({
          ruleId: `jo.pit.${TAX_YEAR}.national-contribution`,
          label: "1% national contribution above JOD 200,000",
          amountMinor: nationalContributionMinor,
          sourceIds,
        });
      }
      if (lines.length === 0) {
        lines.push({
          ruleId: `jo.pit.${TAX_YEAR}.zero-income`,
          label: "Tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          incomeTaxMinor: progressive.taxMinor,
          nationalContributionBaseMinor: contributionBaseMinor,
          nationalContributionMinor,
          totalTaxAndContributionMinor: progressive.taxMinor + nationalContributionMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
