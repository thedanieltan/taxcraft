import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const MRP_2026_MINOR = 4_325;
const GENERAL_THRESHOLD_MINOR = 8_500 * MRP_2026_MINOR;
const BANDS = Object.freeze([
  { upperBoundMinor: GENERAL_THRESHOLD_MINOR, rateBasisPoints: 1_000 },
  { upperBoundMinor: null, rateBasisPoints: 1_500 },
]);

const DEFINITION = Object.freeze({
  code: "KZ",
  name: "Kazakhstan general individual income tax",
  currency: "KZT",
  supported: [
    "calendar-year 2026 individual income tax on caller-confirmed taxable income governed by the general Article 363 schedule",
    "10% through 8,500 monthly calculation indices and 15% on the excess",
    "2026 threshold of KZT 36,762,500 using the KZT 4,325 monthly calculation index effective on 1 January 2026",
  ],
  unsupported: [
    "gross-income, social-payment, basic, social and other tax-deduction derivation",
    "private-practice income taxed at 9%",
    "dividend income and its separate 5% and 15% schedule",
    "individual-entrepreneur and farm income under separate schedules or reductions",
    "employment withholding, payroll periods, declarations and return reconciliation",
    "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after all legally applicable social payments and tax deductions.",
    "The income is governed by Article 363's general individual schedule and not a special category schedule.",
    "The 8,500-MRP threshold uses the monthly calculation index effective on 1 January 2026.",
  ],
  sources: [
    {
      sourceId: "kz.tax-code-2026-article-363",
      publisher: "Government of the Republic of Kazakhstan",
      publisherType: "legislation",
      title: "Tax Code of the Republic of Kazakhstan, Article 363",
      url: "https://www.gov.kz/memleket/entities/kgd-sko/documents/details/1026303?lang=ru",
      jurisdiction: "KZ",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "kz.minfin.tax-administration-qa-2026",
      publisher: "Ministry of Finance of the Republic of Kazakhstan",
      publisherType: "finance-ministry",
      title: "Questions and answers on tax administration",
      url: "https://www.gov.kz/memleket/entities/minfin/documents/details/1030415?lang=ru",
      jurisdiction: "KZ",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "kz.kgd.individual-tax-rates-deductions-2026",
      publisher: "State Revenue Committee of the Ministry of Finance of the Republic of Kazakhstan",
      publisherType: "tax-authority",
      title: "Individual income tax for individuals: rates and deductions",
      url: "https://kgd.gov.kz/ru/content/individualnyy-podohodnyy-nalog-dlya-fizicheskih-lic-stavki-vychety-8",
      jurisdiction: "KZ",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const kazakhstanPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `kz-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["general-annual-taxable-income"],
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
            title: "Confirmed Kazakhstan general individual-tax scope",
            description: "The caller confirms the amount is annual taxable income governed by Article 363's general schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          taxableIncomeMinor: {
            type: "integer",
            title: "Annual taxable income",
            description: "Caller-confirmed annual taxable income in tenge after applicable social payments and tax deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "KZT",
          },
        },
      },
      rounding: [{ stage: "individual-income-tax", mode: "half-up", unitMinor: 1 }],
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
        ruleId: `kz.pit.${TAX_YEAR}.general-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} general taxable-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `kz.pit.${TAX_YEAR}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          statutoryThresholdMinor: GENERAL_THRESHOLD_MINOR,
          monthlyCalculationIndexMinor: MRP_2026_MINOR,
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
