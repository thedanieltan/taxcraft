import { defineCountryPackage } from "@taxcraft/country-sdk";
import { calculateResidentTax } from "./calculate.js";
import { SINGAPORE_MODEL_DATA } from "./model-data.js";
import { SINGAPORE_SOURCES } from "./sources.js";

function model(taxYear) {
  return {
    coverage: {
      supported: ["resident tax on whole-dollar chargeable income"],
      unsupported: ["residency and relief eligibility decisions", "non-resident cases", "taxpayer-specific rebates"]
    },
    validateFacts({ facts }) {
      const issues = [];
      if (facts.taxResident !== true) {
        issues.push({
          code: "facts.tax-residency",
          path: "$.facts.taxResident",
          message: "This package only calculates cases where Singapore tax residency has already been confirmed."
        });
      }
      if (!Number.isSafeInteger(facts.chargeableIncomeMinor) || facts.chargeableIncomeMinor < 0) {
        issues.push({
          code: "facts.chargeable-income",
          path: "$.facts.chargeableIncomeMinor",
          message: "Chargeable income must use non-negative integer minor units."
        });
      } else if (facts.chargeableIncomeMinor % 100 !== 0) {
        issues.push({
          code: "facts.chargeable-income-whole-dollar",
          path: "$.facts.chargeableIncomeMinor",
          message: "The Singapore package accepts chargeable income in whole Singapore dollars."
        });
      }
      return issues.length ? { ok: false, issues } : { ok: true, facts };
    },
    calculate({ facts }) {
      return calculateResidentTax({ taxYear, chargeableIncomeMinor: facts.chargeableIncomeMinor });
    }
  };
}

export const singaporePackage = defineCountryPackage({
  manifest: {
    jurisdiction: "SG",
    name: "Singapore resident personal income tax",
    storesUserPII: false,
    advisory: false,
    taxYears: SINGAPORE_MODEL_DATA.taxYears.map(({ taxYear, modelVersion, status, order }) => ({
      taxYear,
      modelVersion,
      status,
      order
    }))
  },
  sources: SINGAPORE_SOURCES,
  models: Object.fromEntries(SINGAPORE_MODEL_DATA.taxYears.map(({ taxYear }) => [taxYear, model(taxYear)]))
});

export { calculateResidentTax, SINGAPORE_MODEL_DATA, SINGAPORE_SOURCES };
