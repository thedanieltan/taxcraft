import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";

export const SIMPLE_PROGRESSIVE_WAVE_13_JURISDICTIONS = Object.freeze([
  {
    code: "ZM",
    name: "Zambia annual individual income tax",
    currency: "ZMW",
    taxYearBasis: "calendar-year",
    kind: "ordinary-annual-taxable-income",
    supported: [
      "calendar-year 2026 ordinary annual individual income-tax schedule",
      "ZMW 61,200 annual tax-free threshold",
      "20%, 30% and 37% marginal bands",
    ],
    unsupported: [
      "gross-income, emolument, expense, deduction and taxable-income derivation",
      "NAPSA, National Health Insurance, skills-development levy and other statutory contribution calculations",
      "monthly PAYE withholding, cumulative payroll tables, employer remittance and annual reconciliation",
      "turnover tax, presumptive tax, rental tax, minimum alternative tax and business-specific schedules",
      "investment, interest, dividend, property, mining, farming and other special-rate income",
      "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
      "residence, source, income classification and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied annual taxable income after all legally applicable deductions and exemptions.",
      "The ordinary individual Charging Schedule applies and no special-rate or presumptive regime applies.",
      "The 2023 individual bands remained unchanged by the 2025 amendments effective for calendar year 2026.",
    ],
    sources: [
      {
        sourceId: "zm.parliament.income-tax-amendment-2023",
        publisher: "National Assembly of Zambia",
        publisherType: "legislation",
        title: "Income Tax (Amendment) Act No. 22 of 2023",
        url: "https://www.parliament.gov.zm/sites/default/files/documents/acts/Act%20No.%2022%20of%202023%2C%20The%20Income%20Tax%20%28Amendment%29.pdf",
        jurisdiction: "ZM",
        retrievedAt: "2026-07-23",
      },
      {
        sourceId: "zm.zra.paye-current",
        publisher: "Zambia Revenue Authority",
        publisherType: "tax-authority",
        title: "Tax information — Pay As You Earn",
        url: "https://www.zra.org.zm/tax-information/",
        jurisdiction: "ZM",
        retrievedAt: "2026-07-23",
      },
      {
        sourceId: "zm.parliament.income-tax-amendment-no2-2025",
        publisher: "National Assembly of Zambia",
        publisherType: "legislation",
        title: "Income Tax (Amendment) (No. 2) Act No. 17 of 2025",
        url: "https://www.parliament.gov.zm/sites/default/files/documents/acts/Act%20No.%2017%20of%202025%2C%20The%20Income%20Tax%20%28Amendment%29%28No.%202%29%20Act.pdf",
        jurisdiction: "ZM",
        retrievedAt: "2026-07-23",
      },
    ],
  },
]);

export const simpleProgressiveWave13Packages = Object.freeze([
  createZambiaPackage(SIMPLE_PROGRESSIVE_WAVE_13_JURISDICTIONS[0]),
]);

function createZambiaPackage(definition) {
  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears: [{
        taxYear: TAX_YEAR,
        modelVersion: `zm-${TAX_YEAR}-v1`,
        status: "current",
        order: 2026,
      }],
      pit: {
        contractVersion: "taxcraft.pit-country-package.v1",
        taxUnit: "individual",
        taxYearBasis: definition.taxYearBasis,
        currencyCodes: [definition.currency],
        incomeSchedules: [definition.kind],
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
              title: "Confirmed Zambia ordinary individual scope",
              description: "The caller confirms the supplied amount is annual taxable income governed by the ordinary individual Charging Schedule.",
              const: true,
              "x-taxcraft-kind": "confirmed-status",
            },
            taxableIncomeMinor: {
              type: "integer",
              title: "Annual taxable income",
              description: "Caller-confirmed annual taxable income in Zambian kwacha after applicable deductions and exemptions.",
              minimum: 0,
              "x-taxcraft-kind": "money-minor",
              "x-taxcraft-currency": "ZMW",
            },
          },
        },
        rounding: [{ stage: "annual-income-tax", mode: "half-up", unitMinor: 1 }],
        maintenance: { mode: "manual", sourceWatch: false },
      },
    },
    sources: definition.sources,
    models: {
      [TAX_YEAR]: model(definition),
    },
  });
}

function model(definition) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const result = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands: [
          { upperBoundMinor: 6_120_000, rateBasisPoints: 0 },
          { upperBoundMinor: 8_520_000, rateBasisPoints: 2_000 },
          { upperBoundMinor: 11_040_000, rateBasisPoints: 3_000 },
          { upperBoundMinor: null, rateBasisPoints: 3_700 },
        ],
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `zm.pit.${TAX_YEAR}.ordinary-annual.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ordinary annual band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `zm.pit.${TAX_YEAR}.ordinary-annual.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          taxFreeThresholdMinor: 6_120_000,
          secondThresholdMinor: 8_520_000,
          thirdThresholdMinor: 11_040_000,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...definition.assumptions],
        coverage: coverage(definition),
      };
    },
  };
}

function coverage(definition) {
  return {
    supported: [...definition.supported],
    unsupported: [...definition.unsupported],
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
