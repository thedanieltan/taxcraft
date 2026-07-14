import { defineCountryPackage } from "@taxcraft/country-sdk";
import { calculatePersonalAllowance, calculateUkEmploymentIncomeTax } from "./calculate.js";
import { UK_MODEL_DATA } from "./model-data.js";
import { UK_SOURCES } from "./sources.js";

const TERRITORIES = new Set(["England", "Wales", "Northern Ireland"]);
const MONEY_FIELDS = ["nonSavingsIncomeMinor", "adjustedNetIncomeMinor"];
const ALLOWED_FIELDS = new Set(["territory", ...MONEY_FIELDS]);
const MAX_INPUT_MINOR = Math.floor(Number.MAX_SAFE_INTEGER / 4_500);
const models = new Map(UK_MODEL_DATA.taxYears.map((model) => [model.taxYear, model]));

function countryModel(taxYear) {
  const model = models.get(taxYear);
  return {
    coverage: {
      supported: ["employment and other non-savings income using England, Wales or Northern Ireland rates"],
      unsupported: ["Scotland", "savings", "dividends", "National Insurance", "special allowances and reliefs"]
    },
    validateFacts({ facts }) {
      const issues = [];
      if (!facts || typeof facts !== "object" || Array.isArray(facts)) {
        return { ok: false, issues: [{ code: "facts.invalid", path: "$.facts", message: "Facts must be an object." }] };
      }

      for (const field of Object.keys(facts)) {
        if (!ALLOWED_FIELDS.has(field)) {
          issues.push({ code: "facts.unknown-field", path: `$.facts.${field}`, message: `Field ${field} is not supported by the UK package.` });
        }
      }

      if (!TERRITORIES.has(facts.territory)) {
        issues.push({
          code: "facts.territory",
          path: "$.facts.territory",
          message: "Territory must be England, Wales or Northern Ireland. Scottish Income Tax is not supported."
        });
      }

      for (const field of MONEY_FIELDS) {
        const value = facts[field];
        if (!Number.isSafeInteger(value) || value < 0 || value > MAX_INPUT_MINOR) {
          issues.push({ code: `facts.${field}`, path: `$.facts.${field}`, message: `${field} must be a supported non-negative integer minor-unit amount.` });
        } else if (value % 100 !== 0) {
          issues.push({ code: `facts.${field}.whole-pound`, path: `$.facts.${field}`, message: `${field} must use whole pounds sterling.` });
        }
      }

      return issues.length ? { ok: false, issues } : { ok: true, facts };
    },
    calculate({ facts }) {
      return calculateUkEmploymentIncomeTax({ taxYear, facts, model });
    }
  };
}

export const ukPackage = defineCountryPackage({
  manifest: {
    jurisdiction: "GB",
    name: "UK non-savings Income Tax: England, Wales and Northern Ireland",
    storesUserPII: false,
    advisory: false,
    taxYears: UK_MODEL_DATA.taxYears.map(({ taxYear, modelVersion, status, order }) => ({
      taxYear,
      modelVersion,
      status,
      order
    }))
  },
  sources: UK_SOURCES,
  models: Object.fromEntries(UK_MODEL_DATA.taxYears.map(({ taxYear }) => [taxYear, countryModel(taxYear)]))
});

export {
  calculatePersonalAllowance,
  calculateUkEmploymentIncomeTax,
  UK_MODEL_DATA,
  UK_SOURCES
};
