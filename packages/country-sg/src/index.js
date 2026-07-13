import { defineCountryPackage } from "@taxcraft/country-sdk";
import { calculateResidentTax } from "./calculate.js";
import { SINGAPORE_SOURCES } from "./sources.js";

const TAX_YEARS = ["YA2024", "YA2025", "YA2026"];

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
          message: "The first Singapore package accepts chargeable income in whole Singapore dollars."
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
    taxYears: [
      { taxYear: "YA2024", modelVersion: "1.0.0", status: "historical-supported", order: 2024 },
      { taxYear: "YA2025", modelVersion: "1.0.0", status: "historical-supported", order: 2025 },
      { taxYear: "YA2026", modelVersion: "1.0.0", status: "current", order: 2026 }
    ]
  },
  sources: SINGAPORE_SOURCES,
  models: Object.fromEntries(TAX_YEARS.map((taxYear) => [taxYear, model(taxYear)]))
});

export { calculateResidentTax, SINGAPORE_SOURCES };
