import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BANDS = Object.freeze([
  { upperBoundMinor: 4_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 6_000_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: 8_000_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: 10_000_000, rateBasisPoints: 3_000 },
  { upperBoundMinor: 18_000_000, rateBasisPoints: 3_400 },
  { upperBoundMinor: null, rateBasisPoints: 3_700 },
]);

const DEFINITION = Object.freeze({
  code: "MA",
  name: "Morocco general annual income tax",
  currency: "MAD",
  supported: [
    "general income-tax scale published in the 2026 General Tax Code",
    "annual net taxable income supplied by the caller",
    "0%, 10%, 20%, 30%, 34% and 37% marginal bands",
  ],
  unsupported: [
    "gross-income, category-income, expense, deduction and net-taxable-income derivation",
    "family-charge reduction, pension relief, professional-expense deduction and other tax reductions or credits",
    "salary withholding, advance payments, annual return reconciliation and payment administration",
    "professional contribution, auto-entrepreneur, simplified, presumptive and other special business regimes",
    "property, capital, rental, agricultural, foreign-source and other category-specific or final-rate schedules",
    "social-security and health-insurance contributions",
    "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income-period classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual net taxable income after all legally applicable deductions and exemptions.",
    "The general Article 73-I scale applies and no specific rate or special regime applies.",
    "No family reduction, tax credit, withholding or prior payment is included in the result.",
  ],
  sources: [
    {
      sourceId: "ma.mef.cgi-2026-article-73",
      publisher: "Ministry of Economy and Finance of Morocco",
      publisherType: "finance-ministry",
      title: "General Tax Code 2026 — Article 73 general income-tax scale",
      url: "https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf",
      jurisdiction: "MA",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ma.dgi.circular-737-finance-law-2026",
      publisher: "General Directorate of Taxes of Morocco",
      publisherType: "tax-authority",
      title: "Circular No. 737 on the tax measures of Finance Law No. 50-25 for 2026",
      url: "https://www.finances.gov.ma/Publication/dgi/2026/NC737LF2026.pdf",
      jurisdiction: "MA",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ma.official-bulletin-finance-law-2026",
      publisher: "Kingdom of Morocco",
      publisherType: "legislation",
      title: "Official Bulletin No. 7465 bis — Finance Law No. 50-25 for 2026",
      url: "https://www.finances.gov.ma/Publication/db/2025/BO_7465-bis_fr.pdf",
      jurisdiction: "MA",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const moroccoPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `ma-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["general-annual-net-taxable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "netTaxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Morocco general-scale scope",
            description: "The caller confirms that the supplied amount is annual net taxable income governed by the Article 73-I general scale.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          netTaxableIncomeMinor: {
            type: "integer",
            title: "Annual net taxable income",
            description: "Caller-confirmed annual net taxable income in Moroccan dirhams after applicable deductions and exemptions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "MAD",
          },
        },
      },
      rounding: [{ stage: "general-annual-income-tax", mode: "half-up", unitMinor: 1 }],
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
        taxableMinor: facts.netTaxableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `ma.pit.${TAX_YEAR}.general-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} general annual band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `ma.pit.${TAX_YEAR}.general-zero-income`,
          label: "Income tax on zero net taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          netTaxableIncomeMinor: facts.netTaxableIncomeMinor,
          exemptThresholdMinor: 4_000_000,
          secondThresholdMinor: 6_000_000,
          thirdThresholdMinor: 8_000_000,
          fourthThresholdMinor: 10_000_000,
          fifthThresholdMinor: 18_000_000,
          incomeTaxMinor: result.taxMinor,
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
