import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BANDS = Object.freeze([
  { upperBoundMinor: 336_000_000, rateBasisPoints: 2_500 },
  { upperBoundMinor: null, rateBasisPoints: 3_500 },
]);

const DEFINITION = Object.freeze({
  code: "GY",
  name: "Guyana individual income tax",
  currency: "GYD",
  supported: [
    "calendar-year 2026 individual income tax on caller-confirmed annual chargeable income",
    "25% on the first GYD 3,360,000 of annual chargeable income",
    "35% on annual chargeable income above GYD 3,360,000",
  ],
  unsupported: [
    "personal deduction using the greater of GYD 1,680,000 or one-third of qualifying income",
    "National Insurance Scheme deduction",
    "medical and life insurance premium deduction",
    "child, second-job and overtime deductions",
    "gross-income, taxable-income and chargeable-income derivation",
    "daily, weekly, fortnightly, monthly or cumulative PAYE calculations",
    "withholding tax, estimated payments, return balances, penalties, interest, prior payments and refunds",
    "residence, source, exemption and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual chargeable income after all legally applicable personal deductions, National Insurance deductions, allowances and exclusions.",
    "The amount is governed by the ordinary individual chargeable-income schedule and excludes income subject to separate withholding treatment.",
    "The package calculates annual income tax only and does not reproduce employer or self-employed periodic computation worksheets.",
  ],
  sources: [
    {
      sourceId: "gy.gra.revised-allowance-rates-2026",
      publisher: "Guyana Revenue Authority",
      publisherType: "tax-authority",
      title: "Revised Personal Allowance and Deductions for Income Tax 2026",
      url: "https://gra.gov.gy/notice-to-employers-employees-self-employed-persons-revised-personal-allowance-and-deductions-for-income-tax-2026/",
      jurisdiction: "GY",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const guyanaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `gy-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["annual-chargeable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "annualChargeableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Guyana annual individual-tax scope",
            description: "The caller confirms that the supplied amount is annual chargeable income governed by the ordinary individual rate schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          annualChargeableIncomeMinor: {
            type: "integer",
            title: "Annual chargeable income",
            description: "Caller-confirmed annual chargeable income in Guyana dollars after applicable deductions, allowances and exclusions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "GYD",
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
        taxableMinor: facts.annualChargeableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `gy.pit.${TAX_YEAR}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual chargeable-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `gy.pit.${TAX_YEAR}.zero-income`,
          label: "Income tax on zero chargeable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          annualChargeableIncomeMinor: facts.annualChargeableIncomeMinor,
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
