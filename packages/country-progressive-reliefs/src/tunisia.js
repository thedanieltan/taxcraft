import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BANDS = Object.freeze([
  { upperBoundMinor: 5_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 20_000_000, rateBasisPoints: 2_600 },
  { upperBoundMinor: 30_000_000, rateBasisPoints: 2_800 },
  { upperBoundMinor: 50_000_000, rateBasisPoints: 3_200 },
  { upperBoundMinor: null, rateBasisPoints: 3_500 },
]);

const DEFINITION = Object.freeze({
  code: "TN",
  name: "Tunisia ordinary individual income tax",
  currency: "TND",
  supported: [
    "calendar-year 2026 ordinary individual income tax on caller-confirmed annual net taxable income",
    "0%, 26%, 28%, 32% and 35% progressive bands",
    "Tunisian dinar amounts represented in millimes as the currency minor unit",
  ],
  unsupported: [
    "gross-income, category-income, allowance, family deduction and net-taxable-income derivation",
    "social solidarity contribution and other separate levies or contributions",
    "minimum tax based on turnover or gross receipts",
    "withholding, provisional instalments, advances and annual return reconciliation",
    "category-specific, presumptive, export, non-resident and final-tax schedules",
    "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual net taxable income after all legally applicable common and category deductions.",
    "The income is governed by the ordinary IRPP progressive scale published by the Ministry of Finance.",
    "Only ordinary IRPP is calculated; separate contributions, minimum tax and payment mechanics are excluded.",
  ],
  sources: [
    {
      sourceId: "tn.mof.irpp-scale-current-ar",
      publisher: "Ministry of Finance of Tunisia",
      publisherType: "finance-ministry",
      title: "General overview — income tax table",
      url: "https://www.finances.gov.tn/ar/lmht-amwt",
      jurisdiction: "TN",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "tn.mof.tax-system-overview-current-fr",
      publisher: "Ministry of Finance of Tunisia",
      publisherType: "finance-ministry",
      title: "Tunisian tax system — IRPP scale",
      url: "https://www.finances.gov.tn/fr/apercu-general-sur-la-fiscalite",
      jurisdiction: "TN",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "tn.mof.finance-law-2026",
      publisher: "Ministry of Finance of Tunisia",
      publisherType: "official-budget",
      title: "Finance Law for the year 2026",
      url: "https://www.finances.gov.tn/fr/document/loi-des-finances-pour-lannee-2026-ar",
      jurisdiction: "TN",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const tunisiaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `tn-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["ordinary-annual-net-taxable-income"],
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
            title: "Confirmed Tunisia ordinary IRPP scope",
            description: "The caller confirms the amount is annual net taxable income governed by the ordinary IRPP scale.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          netTaxableIncomeMinor: {
            type: "integer",
            title: "Annual net taxable income",
            description: "Caller-confirmed annual net taxable income in Tunisian millimes after applicable deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "TND",
          },
        },
      },
      rounding: [{ stage: "ordinary-irpp", mode: "half-up", unitMinor: 1 }],
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
        ruleId: `tn.pit.${TAX_YEAR}.ordinary-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ordinary IRPP band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `tn.pit.${TAX_YEAR}.zero-income`,
          label: "Ordinary IRPP on zero net taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          netTaxableIncomeMinor: facts.netTaxableIncomeMinor,
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
