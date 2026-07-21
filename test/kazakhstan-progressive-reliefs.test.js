import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { kazakhstanPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [kazakhstanPackage] });

async function calculate(taxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "KZ",
    taxYear,
    facts: { scopeConfirmed: true, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Kazakhstan exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(kazakhstanPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(kazakhstanPackage.manifest.taxYears[0].status, "current");
  assert.equal(kazakhstanPackage.manifest.storesUserPII, false);
  assert.equal(kazakhstanPackage.manifest.advisory, false);
  assert.equal(kazakhstanPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Kazakhstan applies the general 10% and 15% schedule at the exact 2026 MRP threshold", async () => {
  const cases = [
    [0, 0],
    [10, 1],
    [36_762_500, 3_676_250],
    [40_000_000, 4_161_875],
    [100_000_000, 13_161_875],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.statutoryThresholdMinor, 36_762_500);
    assert.equal(result.totals.monthlyCalculationIndexMinor, 4_325);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("kz.tax-code-2026-article-363")));
  }
});

test("Kazakhstan exposes the general schedule through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/KZ" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/KZ/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KZ",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 40_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 4_161_875);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "kz.tax-code-2026-article-363"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "kz.minfin.tax-administration-qa-2026"));
});

test("Kazakhstan keeps deductions and special category schedules outside scope", () => {
  const unsupported = kazakhstanPackage.models["2026"].coverage.unsupported;
  assert.ok(unsupported.some((entry) => entry.includes("tax-deduction derivation")));
  assert.ok(unsupported.some((entry) => entry.includes("private-practice")));
  assert.ok(unsupported.some((entry) => entry.includes("dividend")));
  assert.ok(unsupported.some((entry) => entry.includes("individual-entrepreneur")));
});

test("Kazakhstan rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KZ",
      taxYear: "2025",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 36_762_500 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KZ",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        taxableIncomeMinor: 36_762_500,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
