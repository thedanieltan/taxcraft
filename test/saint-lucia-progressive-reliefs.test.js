import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { saintLuciaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [saintLuciaPackage] });

async function calculate(annualChargeableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "LC",
    taxYear,
    facts: { scopeConfirmed: true, annualChargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Saint Lucia exposes only the current 2026 income year without storing PII", () => {
  assert.deepEqual(saintLuciaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(saintLuciaPackage.manifest.taxYears[0].status, "current");
  assert.equal(saintLuciaPackage.manifest.storesUserPII, false);
  assert.equal(saintLuciaPackage.manifest.advisory, false);
  assert.equal(saintLuciaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Saint Lucia applies every unambiguous chargeable-income boundary", async () => {
  const cases = [
    [0, 0],
    [1_000_000, 100_000],
    [2_000_000, 250_000],
    [3_000_000, 450_000],
  ];
  for (const [annualChargeableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(annualChargeableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("lc.ird.individual-income-tax-rates")));
  }
});

test("Saint Lucia rejects income in the contradictory upper-band scope", async () => {
  const api = createApi();
  const response = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LC",
      taxYear: "2026",
      facts: { scopeConfirmed: true, annualChargeableIncomeMinor: 3_000_001 },
    },
  });
  assert.equal(response.status, 400);
  assert.ok(response.body.issues.some(({ code }) => code === "facts.unsupported-scope"));
});

test("Saint Lucia is exposed through the global API with conflict disclosure", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LC" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LC/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "annualChargeableIncomeMinor"]);

  const coverage = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LC/2026/coverage" });
  assert.equal(coverage.status, 200);
  assert.ok(coverage.body.coverage.unsupported.some((entry) => entry.includes("internally inconsistent fixed tax amount")));

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LC",
      taxYear: "2026",
      facts: { scopeConfirmed: true, annualChargeableIncomeMinor: 2_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 250_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "lc.ird.individual-income-tax-rates"));
});

test("Saint Lucia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LC",
      taxYear: "2025",
      facts: { scopeConfirmed: true, annualChargeableIncomeMinor: 1_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LC",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        annualChargeableIncomeMinor: 1_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
