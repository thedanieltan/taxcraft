import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
  roundRatio,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);
const ANNUAL_BANDS = Object.freeze([
  { upperBoundMinor: 720_000, rateBasisPoints: 0 },
  { upperBoundMinor: 1_200_000, rateBasisPoints: 1000 },
  { upperBoundMinor: 2_400_000, rateBasisPoints: 2000 },
  { upperBoundMinor: null, rateBasisPoints: 3000 },
]);

export const SIMPLE_PROGRESSIVE_WAVE_5_JURISDICTIONS = Object.freeze([
  {
    code: "RW",
    name: "Rwanda employment income tax",
    currency: "RWF",
    taxYearBasis: "calendar-year",
    supported: [
      "employment income tax on caller-confirmed taxable employment income",
      "monthly or annual calculation periods",
      "0%, 10%, 20% and 30% annual progressive bands",
      "monthly tax derived from annual tax and rounded up to a whole Rwandan franc",
      "calendar years 2024 through 2026",
    ],
    unsupported: [
      "taxable-employment-income and deduction derivation",
      "secondary-employer flat-rate withholding and casual-labour treatment",
      "refunds, withholding reconciliation and prior tax payments",
      "residence, source and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied taxable employment income for the selected period.",
      "The selected period is either one month or one complete calendar year.",
      "The result excludes secondary-employer, casual-labour and reconciliation rules.",
    ],
    sources: [
      {
        sourceId: "rw.rra.paye-bands",
        publisher: "Rwanda Revenue Authority",
        publisherType: "tax-authority",
        title: "Calculate your Employment tax (PAYE)",
        url: "https://www.rra.gov.rw/en/domestic-tax-services/employment-tax-paye/calculate-paye",
        jurisdiction: "RW",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "rw.rra.paye-calculator",
        publisher: "Rwanda Revenue Authority",
        publisherType: "tax-authority",
        title: "PAYE Calculator",
        url: "https://www.rra.gov.rw/en/tax-calculator/paye-calculator",
        jurisdiction: "RW",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "rw.rra.paye-overview",
        publisher: "Rwanda Revenue Authority",
        publisherType: "tax-authority",
        title: "Employment tax (PAYE)",
        url: "https://www.rra.gov.rw/en/domestic-tax-services/employment-tax-paye",
        jurisdiction: "RW",
        retrievedAt: "2026-07-18",
      },
    ],
  },
]);

export const simpleProgressiveWave5Packages = Object.freeze([
  createRwandaPackage(SIMPLE_PROGRESSIVE_WAVE_5_JURISDICTIONS[0]),
]);

function createRwandaPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "incomePeriod", "taxableEmploymentIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Rwanda PAYE scope",
        description: "The caller confirms the amount is taxable employment income governed by the ordinary PAYE bands.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      incomePeriod: {
        type: "string",
        title: "Income period",
        description: "Select whether the entered taxable employment income covers one month or one complete calendar year.",
        enum: ["monthly", "annual"],
        "x-taxcraft-kind": "plain",
      },
      taxableEmploymentIncomeMinor: {
        type: "integer",
        title: "Taxable employment income",
        description: "Caller-confirmed taxable employment income in RWF for the selected period.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "RWF",
      },
    },
  };

  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears: TAX_YEARS.map((year) => ({
        taxYear: String(year),
        modelVersion: `rw-${year}-v1`,
        status: year === 2026 ? "current" : "historical-supported",
        order: year,
      })),
      pit: {
        contractVersion: "taxcraft.pit-country-package.v1",
        taxUnit: "individual",
        taxYearBasis: definition.taxYearBasis,
        currencyCodes: [definition.currency],
        incomeSchedules: ["employment-income"],
        taxLayers: {
          national: true,
          subnational: false,
          local: false,
          subdivisionRequired: false,
        },
        factsSchema,
        rounding: [
          { stage: "annual-progressive-income-tax", mode: "half-up", unitMinor: 1 },
          { stage: "monthly-paye", mode: "ceiling", unitMinor: 1 },
        ],
        maintenance: { mode: "manual", sourceWatch: false },
      },
    },
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), rwandaModel(definition, year)])),
  });
}

function rwandaModel(definition, year) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const annualizedIncomeMinor = facts.incomePeriod === "monthly"
        ? facts.taxableEmploymentIncomeMinor * 12
        : facts.taxableEmploymentIncomeMinor;
      const annual = calculateProgressiveBands({
        taxableMinor: annualizedIncomeMinor,
        bands: ANNUAL_BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);

      if (facts.incomePeriod === "monthly") {
        const incomeTaxMinor = roundRatio(
          annual.taxMinor,
          12,
          ROUNDING_MODE.CEILING,
        );
        return {
          currency: definition.currency,
          totals: {
            taxableEmploymentIncomeMinor: facts.taxableEmploymentIncomeMinor,
            annualizedTaxableEmploymentIncomeMinor: annualizedIncomeMinor,
            annualIncomeTaxMinor: annual.taxMinor,
            incomeTaxMinor,
          },
          lines: [{
            ruleId: `rw.pit.${year}.monthly-paye`,
            label: "Monthly PAYE from annual progressive tax, divided by 12 and rounded up",
            amountMinor: incomeTaxMinor,
            sourceIds,
          }],
          assumptions: [...definition.assumptions],
          coverage: coverage(definition),
        };
      }

      const lines = annual.bands.map((band) => ({
        ruleId: `rw.pit.${year}.annual.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual employment-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `rw.pit.${year}.annual.zero-income`,
          label: "Income tax on zero annual taxable employment income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          taxableEmploymentIncomeMinor: facts.taxableEmploymentIncomeMinor,
          incomeTaxMinor: annual.taxMinor,
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
