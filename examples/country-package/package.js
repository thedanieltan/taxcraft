import { defineCountryPackage } from "@taxcraft/country-sdk";

export default defineCountryPackage({
  manifest: {
    jurisdiction: "XY",
    name: "Example jurisdiction",
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: "2026", modelVersion: "1.0.0", status: "current", order: 2026 }],
  },
  sources: [
    {
      sourceId: "xy-pit-rates-2026",
      publisher: "Example Revenue Authority",
      publisherType: "tax-authority",
      title: "Personal income tax rates 2026",
      url: "https://revenue.example.gov/pit-rates-2026",
      retrievedAt: "2026-07-13",
    },
  ],
  models: {
    "2026": {
      coverage: { supported: ["resident employment income"], unsupported: ["all other cases"] },
      validateFacts({ facts }) {
        const valid = Number.isSafeInteger(facts.employmentIncomeMinor) && facts.employmentIncomeMinor >= 0;
        return valid
          ? { ok: true, facts }
          : { ok: false, issues: [{ code: "facts.employment-income", path: "$.facts.employmentIncomeMinor", message: "Employment income must use non-negative integer minor units." }] };
      },
      calculate({ facts }) {
        const taxMinor = Math.trunc(facts.employmentIncomeMinor / 10);
        return {
          currency: "XYD",
          totals: { taxableIncomeMinor: facts.employmentIncomeMinor, taxMinor },
          lines: [{ ruleId: "xy.pit.flat-rate", label: "Personal income tax", amountMinor: taxMinor, sourceIds: ["xy-pit-rates-2026"] }],
          assumptions: [],
          coverage: this.coverage,
        };
      },
    },
  },
});
