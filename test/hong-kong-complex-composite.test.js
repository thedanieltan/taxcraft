import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { hongKongPackage } from "@taxcraft/country-complex-composite";

const engine = createTaxCraft({ countryPackages: [hongKongPackage] });

async function calculate(taxYear, netIncomeMinor, netChargeableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "HK",
    taxYear,
    facts: { scopeConfirmed: true, netIncomeMinor, netChargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Hong Kong maintains years of assessment 2023-24 through 2025-26", () => {
  assert.deepEqual(hongKongPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2023-24", "2024-25", "2025-26"]);
  assert.equal(hongKongPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(hongKongPackage.manifest.storesUserPII, false);
  assert.equal(hongKongPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.deepEqual(hongKongPackage.manifest.pit.incomeSchedules, ["salaries-tax-progressive", "salaries-tax-standard"]);
});

test("Hong Kong selects progressive rates for a lower-income case", async () => {
  const expectedAfterReduction = {
    "2023-24": 1_776_000,
    "2024-25": 1_926_000,
    "2025-26": 1_776_000,
  };
  for (const taxYear of Object.keys(expectedAfterReduction)) {
    const result = await calculate(taxYear, 36_000_000, 22_800_000);
    assert.equal(result.totals.progressiveTaxMinor, 2_076_000);
    assert.equal(result.totals.standardRateTaxMinor, 5_400_000);
    assert.equal(result.totals.selectedTaxBeforeReductionMinor, 2_076_000);
    assert.equal(result.totals.incomeTaxMinor, expectedAfterReduction[taxYear]);
    assert.ok(result.assumptions.some((item) => item.includes("progressive schedule")));
  }
});

test("Hong Kong selects the standard-rate alternative for a high-income case", async () => {
  const cases = [
    ["2023-24", 90_000_000, 89_700_000],
    ["2024-25", 91_000_000, 90_850_000],
    ["2025-26", 91_000_000, 90_700_000],
  ];
  for (const [taxYear, expectedStandardMinor, expectedAfterReductionMinor] of cases) {
    const result = await calculate(taxYear, 600_000_000, 600_000_000);
    assert.equal(result.totals.progressiveTaxMinor, 100_200_000);
    assert.equal(result.totals.standardRateTaxMinor, expectedStandardMinor);
    assert.equal(result.totals.selectedTaxBeforeReductionMinor, expectedStandardMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedAfterReductionMinor);
    assert.ok(result.assumptions.some((item) => item.includes("standard schedule")));
  }
});

test("Hong Kong applies the final-tax reduction non-refundably", async () => {
  const result = await calculate("2025-26", 13_200_000, 5_000_000);
  assert.equal(result.totals.progressiveTaxMinor, 100_000);
  assert.equal(result.totals.selectedTaxBeforeReductionMinor, 100_000);
  assert.equal(result.totals.availableFinalTaxReductionMinor, 300_000);
  assert.equal(result.totals.finalTaxReductionAppliedMinor, 100_000);
  assert.equal(result.totals.incomeTaxMinor, 0);
});

test("Hong Kong rejects inconsistent net income facts", async () => {
  const api = createApi();
  const response = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "HK",
      taxYear: "2025-26",
      facts: {
        scopeConfirmed: true,
        netIncomeMinor: 10_000_000,
        netChargeableIncomeMinor: 11_000_000,
      },
    },
  });
  assert.equal(response.status, 400);
  assert.ok(response.body.issues.some(({ code }) => code === "facts.inconsistent"));
});

test("Hong Kong is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/HK" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "COMPLEX_COMPOSITE");
  assert.deepEqual(detail.body.supportedTaxYears, ["2023-24", "2024-25", "2025-26"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/HK/2025-26/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "netIncomeMinor",
    "netChargeableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "HK",
      taxYear: "2025-26",
      facts: {
        scopeConfirmed: true,
        netIncomeMinor: 600_000_000,
        netChargeableIncomeMinor: 600_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 90_700_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "hk.ird.two-tier-standard-rates-2024"));
});

test("Hong Kong rejects unsupported years and identity-bearing facts", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "HK",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        netIncomeMinor: 36_000_000,
        netChargeableIncomeMinor: 22_800_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "HK",
      taxYear: "2025-26",
      facts: {
        scopeConfirmed: true,
        netIncomeMinor: 36_000_000,
        netChargeableIncomeMinor: 22_800_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
