import { definePitCountryPackage } from "@taxcraft/country-sdk";
import { calculatePersonalAllowance, calculateUkEmploymentIncomeTax } from "./calculate.js";
import { UK_MODEL_DATA } from "./model-data.js";
import { UK_SOURCES } from "./sources.js";

const TERRITORIES = new Set(["England", "Wales", "Northern Ireland"]);
const MONEY_FIELDS = ["nonSavingsIncomeMinor", "adjustedNetIncomeMinor"];
const models = new Map(UK_MODEL_DATA.taxYears.map((model) => [model.taxYear, model]));

function countryModel(taxYear) {
  const model = models.get(taxYear);
  return {
    coverage: {
      supported: ["employment and other non-savings income using England, Wales or Northern Ireland rates"],
      unsupported: ["Scotland", "savings", "dividends", "National Insurance", "special allowances and reliefs"],
    },
    validateFacts({ facts }) {
      const issues = [];
      if (!TERRITORIES.has(facts.territory)) {
        issues.push({
          code: "facts.territory",
          path: "$.facts.territory",
          message: "Territory must be England, Wales or Northern Ireland. Scottish Income Tax is not supported.",
        });
      }

      for (const field of MONEY_FIELDS) {
        const value = facts[field];
        if (!Number.isSafeInteger(value) || value < 0) {
          issues.push({ code: `facts.${field}`, path: `$.facts.${field}`, message: `${field} must be a non-negative safe integer minor-unit amount.` });
        } else if (value % 100 !== 0) {
          issues.push({ code: `facts.${field}.whole-pound`, path: `$.facts.${field}`, message: `${field} must use whole pounds sterling.` });
        }
      }

      return issues.length ? { ok: false, issues } : { ok: true, facts };
    },
    calculate({ facts }) {
      return calculateUkEmploymentIncomeTax({ taxYear, facts, model });
    },
  };
}

export const ukPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: "GB",
    name: "UK non-savings Income Tax: England, Wales and Northern Ireland",
    storesUserPII: false,
    advisory: false,
    taxYears: UK_MODEL_DATA.taxYears.map(({ taxYear, modelVersion, status, order }) => ({
      taxYear,
      modelVersion,
      status,
      order,
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "tax-year",
      currencyCodes: ["GBP"],
      incomeSchedules: ["non-savings-income"],
      taxLayers: {
        national: true,
        subnational: true,
        local: false,
        subdivisionRequired: true,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["territory", "nonSavingsIncomeMinor", "adjustedNetIncomeMinor"],
        properties: {
          territory: {
            type: "string",
            title: "Income Tax territory",
            description: "The caller selects the confirmed England, Wales or Northern Ireland rate regime.",
            enum: ["England", "Wales", "Northern Ireland"],
            "x-taxcraft-kind": "subdivision-code",
          },
          nonSavingsIncomeMinor: {
            type: "integer",
            title: "Non-savings income",
            description: "Caller-confirmed non-savings income in whole pounds, represented in pence.",
            minimum: 0,
            multipleOf: 100,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "GBP",
          },
          adjustedNetIncomeMinor: {
            type: "integer",
            title: "Adjusted net income",
            description: "Caller-confirmed adjusted net income for the Personal Allowance taper, represented in pence.",
            minimum: 0,
            multipleOf: 100,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "GBP",
          },
        },
      },
      rounding: [
        { stage: "income-tax-rates", mode: "floor", unitMinor: 1 },
        { stage: "personal-allowance-taper", mode: "floor", unitMinor: 100 },
      ],
      maintenance: {
        mode: "automated",
        sourceWatch: true,
      },
    },
  },
  sources: UK_SOURCES,
  models: Object.fromEntries(UK_MODEL_DATA.taxYears.map(({ taxYear }) => [taxYear, countryModel(taxYear)])),
});

export {
  calculatePersonalAllowance,
  calculateUkEmploymentIncomeTax,
  UK_MODEL_DATA,
  UK_SOURCES,
};
