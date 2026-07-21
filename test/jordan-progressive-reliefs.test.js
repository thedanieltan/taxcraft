import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { jordanPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [jordanPackage] });

async function calculate(taxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "JO",
    taxYear,
    facts: { scopeConfirmed: true, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Jordan exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(jordanPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(jordanPackage.manifest.storesUserPII, false);
  assert.equal(jordanPackage.manifest.advisory, false);
  assert.equal(jordanPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Jordan applies every natural-person income-tax threshold", async () => {
  const cases = [
    [0, 0],
    [500_000, 25_000],
    [1_000_000, 75_000],
    [1_500_000, 150_000],
    [2_000_000, 250_000],
    [20_000_000, 4_750_000],
    [100_000_000, 24_750_000],
    [110_000_000, 27_750_000],
  ];
  for (const [taxableIncomeMinor, expectedIncomeTaxMinor] of cases) {
    const result = await calculate(taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedIncomeTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("jo.istd.income-tax-law-current")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("jo.istd.natural-person-bands-2020-onwards")));
  }
});

test("Jordan applies the national contribution only above JOD 200,000", async () => {
  const threshold = await calculate(20_000_000);
  assert.equal(threshold.totals.nationalContributionBaseMinor, 0);
  assert.equal(threshold.totals.nationalContributionMinor, 0);
  assert.equal(threshold.totals.totalTaxAndContributionMinor, 4_750_000);

  const above = await calculate(20_100_000);
  assert.equal(above.totals.incomeTaxMinor, 4_775_000);
  assert.equal(above.totals.nationalContributionBaseMinor, 100_000);
  assert.equal(above.totals.nationalContributionMinor, 1_000);
  assert.equal(above.totals.totalTaxAndContributionMinor, 4_776_000);

  const topBand = await calculate(110_000_000);
  assert.equal(topBand.totals.nationalContributionMinor, 900_000);
  assert.equal(topBand.totals.totalTaxAndContributionMinor, 28_650_000);
});

test("Jordan exposes income tax and contribution through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/JO" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/JO/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JO",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 20_100_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 4_775_000);
  assert.equal(calculation.body.totals.nationalContributionMinor, 1_000);
});

test("Jordan keeps exemptions and special income outside the engine", () => {
  const coverage = jordanPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("personal, dependant")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("foreign-source")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("withholding")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Jordan rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "JO", taxYear: "2025", facts: { scopeConfirmed: true, taxableIncomeMinor: 2_000_000 } },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JO",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 2_000_000, name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
