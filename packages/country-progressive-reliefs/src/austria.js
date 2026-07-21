import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BANDS = Object.freeze([
  { upperBoundMinor: 1_353_900, rateBasisPoints: 0 },
  { upperBoundMinor: 2_199_200, rateBasisPoints: 2_000 },
  { upperBoundMinor: 3_645_800, rateBasisPoints: 3_000 },
  { upperBoundMinor: 7_036_500, rateBasisPoints: 4_000 },
  { upperBoundMinor: 10_485_900, rateBasisPoints: 4_800 },
  { upperBoundMinor: 100_000_000, rateBasisPoints: 5_000 },
  { upperBoundMinor: null, rateBasisPoints: 5_500 },
]);

const THRESHOLDS = Object.freeze({
  zeroRateMinor: 1_353_900,
  twentyRateMinor: 2_199_200,
  thirtyRateMinor: 3_645_800,
  fortyRateMinor: 7_036_500,
  fortyEightRateMinor: 10_485_900,
  fiftyRateMinor: 100_000_000,
});

const DEFINITION = Object.freeze({
  code: "AT",
  name: "Austria annual individual income tax",
  currency: "EUR",
  supported: [
    "calendar-year 2026 annual income-tax tariff on caller-confirmed taxable income",
    "0%, 20%, 30%, 40%, 48%, 50% and temporary 55% statutory bands",
    "55% rate for income portions above EUR 1,000,000 through calendar year 2029",
  ],
  unsupported: [
    "gross-income, expense, deduction and taxable-income derivation",
    "employee, pensioner, sole-earner, single-parent, maintenance and transport tax credits",
    "family bonus, child-related reliefs, extraordinary burdens and loss offsets",
    "capital income, real-estate gains, other special-rate income and withholding schedules",
    "social-insurance contributions, wage-tax withholding, advance payments and assessment reconciliation",
    "foreign-tax credit, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after legally applicable deductions and allowances.",
    "The ordinary section 33(1) annual tariff applies to the supplied amount.",
    "No tax credit or special-rate income is included in the result.",
  ],
  sources: [
    {
      sourceId: "at.ris.income-tax-act-section-33-2026",
      publisher: "Federal Legal Information System of Austria",
      publisherType: "legislation",
      title: "Income Tax Act 1988 section 33 — version effective 1 January 2026",
      url: "https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Anlage=&Artikel=&FassungVom=2026-01-01&Gesetzesnummer=10004570&Paragraf=33&Uebergangsrecht=",
      jurisdiction: "AT",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "at.usp.tariff-levels-2026",
      publisher: "Austrian Business Service Portal",
      publisherType: "government-agency",
      title: "Income-tax tariff levels for 2026",
      url: "https://www.usp.gv.at/themen/steuern-finanzen/einkommensteuer-ueberblick/weitere-informationen-est/tarifstufen.html",
      jurisdiction: "AT",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "at.bmf.tax-tariff-2026",
      publisher: "Austrian Federal Ministry of Finance",
      publisherType: "finance-ministry",
      title: "Income-tax tariff and tax credits — 2026 tariff",
      url: "https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/steuertarif-steuerabsetzbetraege.html",
      jurisdiction: "AT",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const austriaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `at-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["ordinary-annual-taxable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Austria ordinary tariff scope",
            description: "The caller confirms the supplied amount is annual taxable income governed by the ordinary section 33(1) tariff.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          taxableIncomeMinor: {
            type: "integer",
            title: "Annual taxable income",
            description: "Caller-confirmed annual taxable income in euro after applicable deductions and allowances.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [{ stage: "annual-tariff-tax", mode: "half-up", unitMinor: 1 }],
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
        taxableMinor: facts.taxableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `at.pit.${TAX_YEAR}.annual-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual taxable-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `at.pit.${TAX_YEAR}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          ...THRESHOLDS,
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
