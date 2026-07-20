import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { sriLankaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [sriLankaPackage] });

async function calculate(taxYear, taxableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "LK",
    taxYear,
    facts: { scopeConfirmed: true, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Sri Lanka maintains three years of assessment without collecting PII", () => {
  assert.deepEqual(sriLankaPackage.manifest.taxYears, [
    { taxYear: "2024-25", modelVersion: "lk-2024-25-v1", status: "historical-supported", order: 2024 },
    { taxYear: "2025-26", modelVersion: "lk-2025-26-v1", status: "historical-supported", order: 2025 },
    { taxYear: "2026-27", modelVersion: "lk-2026-27-v1", status: "current", order: 2026 },
  ]);
  assert.equal(sriLankaPackage.manifest.storesUserPII, false);
  assert.equal(sriLankaPackage.manifest.advisory, false);
  assert.equal(sriLankaPackage.manifest.pit.taxYearBasis, "year-of-assessment");
  assert.equal(sriLankaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Sri Lanka applies every 2024-25 standard-rate boundary", async () => {
  const cases = [
    [50_000_000, 3_000_000],
    [100_000_000, 9_000_000],
    [150_000_000, 18_000_000],
    [200_000_000, 30_000_000],
    [250_000_000, 45_000_000],
    [300_000_000, 63_000_000],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("2024-25", taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) =>
      sourceIds.length === 1 && sourceIds[0] === "lk.ird.tax-chart-2024-25"));
  }
});

test("Sri Lanka applies the 2025-26 standard-rate structure", async () => {
  const cases = [
    [100_000_000, 6_000_000],
    [150_000_000, 15_000_000],
    [200_000_000, 27_000_000],
    [250_000_000, 42_000_000],
    [300_000_000, 60_000_000],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("2025-26", taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) =>
      sourceIds.length === 1 && sourceIds[0] === "lk.ird.tax-chart-2025-26"));
  }
});

test("Sri Lanka carries the published standard bands into 2026-27 with amendment evidence", async () => {
  const result = await calculate("2026-27", 300_000_000);
  assert.equal(result.totals.incomeTaxMinor, 60_000_000);
  assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("lk.ird.tax-chart-2025-26")));
  assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("lk.ird.inland-revenue-amendment-2026-notice")));
  assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("lk.ird.apit-tables-2025-26")));
  assert.ok(result.coverage.unsupported.some((entry) => entry.includes("15% individual capital-gains rate")));
});

test("Sri Lanka calculations are deterministic and leave relief derivation outside scope", async () => {
  const first = await calculate("2026-27", 123_456_700);
  const second = await calculate("2026-27", 123_456_700);
  assert.deepEqual(first, second);
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("personal, rental, solar-panel")));
  assert.ok(first.assumptions.some((entry) => entry.includes("after all legally available personal")));
});

test("Sri Lanka is exposed through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LK" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2024-25", "2025-26", "2026-27"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LK/2026-27/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LK",
      taxYear: "2026-27",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 300_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 60_000_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "lk.ird.tax-chart-2025-26"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "lk.ird.inland-revenue-amendment-2026-notice"));
});

test("Sri Lanka rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LK",
      taxYear: "2023-24",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 100_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LK",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        taxableIncomeMinor: 100_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
