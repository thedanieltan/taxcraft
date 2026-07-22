import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";

export const SIMPLE_PROGRESSIVE_WAVE_14_JURISDICTIONS = Object.freeze([
  {
    code: "ME",
    name: "Montenegro monthly personal earnings income tax",
    currency: "EUR",
    taxYearBasis: "calendar-year",
    kind: "monthly-taxable-personal-earnings",
    supported: [
      "calendar-year 2026 national income tax on monthly taxable personal earnings",
      "0% through EUR 700 per month",
      "9% from EUR 700 through EUR 1,000 and 15% above EUR 1,000",
    ],
    unsupported: [
      "gross salary, expense, exemption, deduction and monthly taxable-earnings derivation",
      "employee and employer social-insurance contributions and other payroll charges",
      "municipal surtax on personal income tax",
      "annual aggregation, annual return reconciliation, employer withholding and remittance administration",
      "self-employment, property, capital gains, investment, occasional and other non-salary income schedules",
      "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
      "residence, source, income classification and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied monthly taxable personal earnings after legally applicable exemptions and deductions.",
      "The ordinary national personal-earnings schedule applies and no non-salary income schedule applies.",
      "The result excludes municipal surtax, contributions, withholding reconciliation and prior payments.",
    ],
    sources: [
      {
        sourceId: "me.tax-administration.personal-earnings-rates-current",
        publisher: "Tax Administration of Montenegro",
        publisherType: "tax-authority",
        title: "Annual personal income tax return — personal earnings rate bands",
        url: "https://www.gov.me/clanak/godisnja-prijava-poreza-na-dohodak-fizickih-lica-za-2023-godinu",
        jurisdiction: "ME",
        retrievedAt: "2026-07-23",
      },
      {
        sourceId: "me.gov.payroll-calculation-guide-2026",
        publisher: "Government of Montenegro",
        publisherType: "government-agency",
        title: "Instructions for calculating gross salary and tax and contribution obligations applicable from 1 January 2026",
        url: "https://www.gov.me/dokumenta/81e33fb6-f1d6-4d7a-8afc-72c9feab7b7b",
        jurisdiction: "ME",
        retrievedAt: "2026-07-23",
      },
      {
        sourceId: "me.gov.personal-income-tax-law-current-2026",
        publisher: "Government of Montenegro",
        publisherType: "legislation",
        title: "Personal Income Tax Law — current consolidated publication",
        url: "https://www.gov.me/dokumenta/f8d361b8-419c-4ca7-8528-04c82112459e",
        jurisdiction: "ME",
        retrievedAt: "2026-07-23",
      },
    ],
  },
]);

export const simpleProgressiveWave14Packages = Object.freeze([
  createMontenegroPackage(SIMPLE_PROGRESSIVE_WAVE_14_JURISDICTIONS[0]),
]);

function createMontenegroPackage(definition) {
  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears: [{
        taxYear: TAX_YEAR,
        modelVersion: `me-${TAX_YEAR}-v1`,
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
          required: ["scopeConfirmed", "monthlyTaxablePersonalIncomeMinor"],
          properties: {
            scopeConfirmed: {
              type: "boolean",
              title: "Confirmed Montenegro personal-earnings scope",
              description: "The caller confirms that the supplied amount is monthly taxable personal earnings governed by the ordinary national schedule.",
              const: true,
              "x-taxcraft-kind": "confirmed-status",
            },
            monthlyTaxablePersonalIncomeMinor: {
              type: "integer",
              title: "Monthly taxable personal earnings",
              description: "Caller-confirmed monthly taxable personal earnings in euro cents after applicable exemptions and deductions.",
              minimum: 0,
              "x-taxcraft-kind": "money-minor",
              "x-taxcraft-currency": "EUR",
            },
          },
        },
        rounding: [{ stage: "monthly-personal-earnings-tax", mode: "half-up", unitMinor: 1 }],
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
        taxableMinor: facts.monthlyTaxablePersonalIncomeMinor,
        bands: [
          { upperBoundMinor: 70_000, rateBasisPoints: 0 },
          { upperBoundMinor: 100_000, rateBasisPoints: 900 },
          { upperBoundMinor: null, rateBasisPoints: 1_500 },
        ],
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `me.pit.${TAX_YEAR}.monthly-personal-earnings.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} monthly personal-earnings band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `me.pit.${TAX_YEAR}.monthly-personal-earnings.zero-income`,
          label: "Income tax on zero monthly taxable personal earnings",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          monthlyTaxablePersonalIncomeMinor: facts.monthlyTaxablePersonalIncomeMinor,
          exemptThresholdMinor: 70_000,
          secondThresholdMinor: 100_000,
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
