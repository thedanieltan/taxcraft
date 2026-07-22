import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BANDS = Object.freeze([
  { upperBoundMinor: 24_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 48_000_000, rateBasisPoints: 2_300 },
  { upperBoundMinor: 96_000_000, rateBasisPoints: 2_700 },
  { upperBoundMinor: 192_000_000, rateBasisPoints: 3_000 },
  { upperBoundMinor: 384_000_000, rateBasisPoints: 3_300 },
  { upperBoundMinor: null, rateBasisPoints: 3_500 },
]);

const DEFINITION = Object.freeze({
  code: "DZ",
  name: "Algeria annual global income tax scale",
  currency: "DZD",
  supported: [
    "calendar-year 2026 Article 104 progressive IRG scale",
    "annual taxable income supplied by the caller before category-specific tax abatements",
    "0%, 23%, 27%, 30%, 33% and 35% marginal bands",
  ],
  unsupported: [
    "gross-income, category-income, expense, deduction and annual-taxable-income derivation",
    "40% salary and pension tax abatement, minimum and maximum abatement amounts and secondary relief formulas",
    "monthly payroll annualisation, withholding, employer remittance and annual reconciliation",
    "disabled-worker, pensioner and non-resident pension-specific payroll treatment",
    "occasional intellectual-activity, author, artist and other final withholding schedules",
    "property, capital, agricultural, business and other category-specific or provisional tax calculations",
    "social-security contributions, credits, foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after legally applicable deductions and exemptions.",
    "The Article 104 progressive scale applies before any category-specific tax abatement or credit.",
    "No salary, pension, disability, withholding or final-rate reduction is included in the result.",
  ],
  sources: [
    {
      sourceId: "dz.dgi.irg-article-104-current-2026",
      publisher: "Algerian Directorate General of Taxes",
      publisherType: "tax-authority",
      title: "Global income tax — salaries and wages — Article 104 scale",
      url: "https://www.mfdgi.gov.dz/fr/particuliers/irg-traitements-et-salaires",
      jurisdiction: "DZ",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "dz.dgi.irg-article-104-current-ar-2026",
      publisher: "Algerian Directorate General of Taxes",
      publisherType: "tax-authority",
      title: "Global income tax on salaries and wages — current Arabic guidance",
      url: "https://www.mfdgi.gov.dz/particuliers/irg-traitements-salaires",
      jurisdiction: "DZ",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "dz.dgi.cidta-2026-publication",
      publisher: "Algerian Directorate General of Taxes",
      publisherType: "tax-authority",
      title: "Publication of the 2026 Direct Taxes and Similar Taxes Code",
      url: "https://mfdgi.gov.dz/fr/a-propos/actu-fr/codes-fiscaux-fr",
      jurisdiction: "DZ",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const algeriaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `dz-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["article-104-annual-taxable-income-before-abatements"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "annualTaxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Algeria Article 104 scope",
            description: "The caller confirms that the supplied amount is annual taxable income governed by the Article 104 progressive scale before category-specific tax abatements.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          annualTaxableIncomeMinor: {
            type: "integer",
            title: "Annual taxable income",
            description: "Caller-confirmed annual taxable income in Algerian dinars after deductions and exemptions but before category-specific tax abatements.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "DZD",
          },
        },
      },
      rounding: [{ stage: "article-104-annual-income-tax", mode: "half-up", unitMinor: 1 }],
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
      const result = calculateProgressiveBands({
        taxableMinor: facts.annualTaxableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `dz.pit.${TAX_YEAR}.article-104.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} Article 104 annual band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `dz.pit.${TAX_YEAR}.article-104.zero-income`,
          label: "IRG on zero annual taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          annualTaxableIncomeMinor: facts.annualTaxableIncomeMinor,
          exemptThresholdMinor: 24_000_000,
          secondThresholdMinor: 48_000_000,
          thirdThresholdMinor: 96_000_000,
          fourthThresholdMinor: 192_000_000,
          fifthThresholdMinor: 384_000_000,
          incomeTaxBeforeAbatementsMinor: result.taxMinor,
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
