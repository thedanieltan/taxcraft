import { definePitCountryPackage } from "@taxcraft/country-sdk";
import { NO_PIT_JURISDICTIONS as NO_PIT_WAVE_1_JURISDICTIONS } from "./data.js";
import { NO_PIT_WAVE_2_JURISDICTIONS } from "./wave2.js";
import { NO_PIT_WAVE_3_JURISDICTIONS } from "./wave3.js";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);

export const NO_PIT_JURISDICTIONS = Object.freeze([
  ...NO_PIT_WAVE_1_JURISDICTIONS,
  ...NO_PIT_WAVE_2_JURISDICTIONS,
  ...NO_PIT_WAVE_3_JURISDICTIONS,
]);

export const noPitPackages = Object.freeze(NO_PIT_JURISDICTIONS.map(createNoPitPackage));
export const noPitPackagesByJurisdiction = Object.freeze(Object.fromEntries(
  noPitPackages.map((countryPackage) => [countryPackage.manifest.jurisdiction, countryPackage]),
));

export { NO_PIT_WAVE_2_JURISDICTIONS, NO_PIT_WAVE_3_JURISDICTIONS };

function createNoPitPackage(definition) {
  const taxYears = TAX_YEARS.map((year) => ({
    taxYear: String(year),
    modelVersion: `${definition.code.toLowerCase()}-${year}-v1`,
    status: year === 2026 ? "current" : "historical-supported",
    order: year,
  }));

  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears,
      pit: {
        contractVersion: "taxcraft.pit-country-package.v1",
        taxUnit: "individual",
        taxYearBasis: "calendar-year",
        currencyCodes: [definition.currency],
        incomeSchedules: ["covered-personal-income"],
        taxLayers: {
          national: true,
          subnational: false,
          local: false,
          subdivisionRequired: false,
        },
        factsSchema: {
          type: "object",
          additionalProperties: false,
          required: ["scopeConfirmed", "coveredIncomeMinor"],
          properties: {
            scopeConfirmed: {
              type: "boolean",
              title: definition.scopeTitle,
              description: definition.scopeDescription,
              const: true,
              "x-taxcraft-kind": "confirmed-status",
            },
            coveredIncomeMinor: {
              type: "integer",
              title: definition.coveredIncomeTitle,
              description: `Caller-confirmed amount in ${definition.currency} major units, represented in minor units by the API.`,
              minimum: 0,
              "x-taxcraft-kind": "money-minor",
              "x-taxcraft-currency": definition.currency,
            },
          },
        },
        rounding: [
          { stage: "personal-income-tax", mode: "half-up", unitMinor: 1 },
        ],
        maintenance: {
          mode: "manual",
          sourceWatch: false,
        },
      },
    },
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), createModel(definition, year)])),
  });
}

function createModel(definition, year) {
  return {
    coverage: {
      supported: [...definition.supported],
      unsupported: [...definition.unsupported],
    },
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      return {
        currency: definition.currency,
        totals: {
          coveredIncomeMinor: facts.coveredIncomeMinor,
          incomeTaxMinor: 0,
        },
        lines: [
          {
            ruleId: `${definition.code.toLowerCase()}.pit.${year}.zero-personal-income-tax`,
            label: "Personal income tax under the confirmed package scope",
            amountMinor: 0,
            sourceIds: definition.sources.map(({ sourceId }) => sourceId),
          },
        ],
        assumptions: [...definition.assumptions],
        coverage: {
          supported: [...definition.supported],
          unsupported: [...definition.unsupported],
        },
      };
    },
  };
}
