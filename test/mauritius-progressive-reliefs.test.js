import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { mauritiusPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [mauritiusPackage] });

async function calculate({
  taxYear = "2026-27",
  chargeableIncomeMinor,
  fairShareThresholdIncomeMinor,
  fairShareLeviableIncomeMinor,
}) {
  const result = await engine.calculate({
    jurisdiction: "MU",
    taxYear,
    facts: {
      scopeConfirmed: true,
      chargeableIncomeMinor,
      fairShareThresholdIncomeMinor,
      fairShareLeviableIncomeMinor,
    },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Mauritius maintains the enacted 2025-26 through 2027-28 window", () => {
  assert.deepEqual(mauritiusPackage.manifest.taxYears, [
    { taxYear: "2025-26", modelVersion: "mu-2025-26-v1", status: "historical-supported", order: 2025 },
    { taxYear: "2026-27", modelVersion: "mu-2026-27-v1", status: "current", order: 2026 },
    { taxYear: "2027-28", modelVersion: "mu-2027-28-v1", status: "candidate", order: 2027 },
  ]);
  assert.equal(mauritiusPackage.manifest.storesUserPII, false);
  assert.equal(mauritiusPackage.manifest.advisory, false);
  assert.equal(mauritiusPackage.manifest.pit.taxYearBasis, "income-year");
  assert.equal(mauritiusPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Mauritius applies the 0%, 10% and 20% annual income-tax bands", async () => {
  const cases = [
    [50_000_000, 0],
    [100_000_000, 5_000_000],
    [200_000_000, 25_000_000],
  ];
  for (const [chargeableIncomeMinor, expectedIncomeTaxMinor] of cases) {
    const result = await calculate({
      chargeableIncomeMinor,
      fairShareThresholdIncomeMinor: chargeableIncomeMinor,
      fairShareLeviableIncomeMinor: chargeableIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedIncomeTaxMinor);
    assert.equal(result.totals.fairShareContributionMinor, 0);
    assert.equal(result.totals.totalTaxAndContributionMinor, expectedIncomeTaxMinor);
  }
});

test("Mauritius applies Fair Share Contribution only when threshold income exceeds MUR 12 million", async () => {
  const atThreshold = await calculate({
    chargeableIncomeMinor: 100_000_000,
    fairShareThresholdIncomeMinor: 1_200_000_000,
    fairShareLeviableIncomeMinor: 1_200_000_000,
  });
  assert.equal(atThreshold.totals.incomeTaxMinor, 5_000_000);
  assert.equal(atThreshold.totals.fairShareContributionMinor, 0);

  const aboveThreshold = await calculate({
    chargeableIncomeMinor: 100_000_000,
    fairShareThresholdIncomeMinor: 1_300_000_000,
    fairShareLeviableIncomeMinor: 1_300_000_000,
  });
  assert.equal(aboveThreshold.totals.incomeTaxMinor, 5_000_000);
  assert.equal(aboveThreshold.totals.fairShareContributionMinor, 15_000_000);
  assert.equal(aboveThreshold.totals.totalTaxAndContributionMinor, 20_000_000);
  assert.ok(aboveThreshold.lines.some(({ ruleId, sourceIds }) =>
    ruleId.endsWith("fair-share-contribution")
      && sourceIds.includes("mu.mra.fair-share-contribution")));
});

test("Mauritius accepts a threshold trigger with lower leviable income without inventing contribution", async () => {
  const result = await calculate({
    chargeableIncomeMinor: 100_000_000,
    fairShareThresholdIncomeMinor: 1_300_000_000,
    fairShareLeviableIncomeMinor: 1_100_000_000,
  });
  assert.equal(result.totals.fairShareContributionMinor, 0);
});

test("Mauritius rejects inconsistent Fair Share facts", async () => {
  const api = createApi();
  const cases = [
    {
      facts: {
        chargeableIncomeMinor: 200_000_000,
        fairShareThresholdIncomeMinor: 300_000_000,
        fairShareLeviableIncomeMinor: 100_000_000,
      },
      expectedPath: "$.fairShareLeviableIncomeMinor",
    },
    {
      facts: {
        chargeableIncomeMinor: 100_000_000,
        fairShareThresholdIncomeMinor: 200_000_000,
        fairShareLeviableIncomeMinor: 300_000_000,
      },
      expectedPath: "$.fairShareThresholdIncomeMinor",
    },
  ];
  for (const { facts, expectedPath } of cases) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: {
        jurisdiction: "MU",
        taxYear: "2026-27",
        facts: { scopeConfirmed: true, ...facts },
      },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ path }) => path === expectedPath));
  }
});

test("Mauritius is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MU" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2025-26", "2026-27", "2027-28"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MU/2026-27/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "chargeableIncomeMinor",
    "fairShareThresholdIncomeMinor",
    "fairShareLeviableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MU",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        chargeableIncomeMinor: 200_000_000,
        fairShareThresholdIncomeMinor: 1_300_000_000,
        fairShareLeviableIncomeMinor: 1_300_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.totalTaxAndContributionMinor, 40_000_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "mu.mra.paye-rates-2025"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "mu.mra.fair-share-contribution"));
});

test("Mauritius rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MU",
      taxYear: "2024-25",
      facts: {
        scopeConfirmed: true,
        chargeableIncomeMinor: 100_000_000,
        fairShareThresholdIncomeMinor: 100_000_000,
        fairShareLeviableIncomeMinor: 100_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MU",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        chargeableIncomeMinor: 100_000_000,
        fairShareThresholdIncomeMinor: 100_000_000,
        fairShareLeviableIncomeMinor: 100_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
