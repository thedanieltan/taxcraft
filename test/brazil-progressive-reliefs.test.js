import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { brazilPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [brazilPackage] });

async function calculate(annualTaxBaseMinor, taxYear = "2025") {
  const result = await engine.calculate({
    jurisdiction: "BR",
    taxYear,
    facts: { scopeConfirmed: true, annualTaxBaseMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Brazil exposes calendar year 2025 without storing PII", () => {
  assert.deepEqual(brazilPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2025"]);
  assert.equal(brazilPackage.manifest.taxYears[0].status, "current");
  assert.equal(brazilPackage.manifest.storesUserPII, false);
  assert.equal(brazilPackage.manifest.advisory, false);
  assert.equal(brazilPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Brazil applies every official exercise-2026 annual-table transition", async () => {
  const cases = [
    [0, 0],
    [2_846_720, 0],
    [2_846_721, 0],
    [3_000_000, 11_496],
    [3_391_980, 40_895],
    [3_391_981, 40_894],
    [4_501_260, 207_286],
    [4_501_261, 207_287],
    [5_597_616, 453_967],
    [5_597_617, 453_967],
    [6_000_000, 564_622],
  ];
  for (const [annualTaxBaseMinor, expectedTaxMinor] of cases) {
    const result = await calculate(annualTaxBaseMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("br.rfb.irpf-annual-table-2025")));
  }
});

test("Brazil exposes the annual-adjustment tariff through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/BR" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2025"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/BR/2025/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "annualTaxBaseMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BR",
      taxYear: "2025",
      facts: { scopeConfirmed: true, annualTaxBaseMinor: 6_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 564_622);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "br.rfb.irpf-annual-table-2025"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "br.rfb.calendar-year-and-exercise"));
});

test("Brazil keeps deduction derivation and separate schedules outside the tariff engine", () => {
  const coverage = brazilPackage.coverage("2025");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("deduction derivation")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("simplified-discount")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("capital income")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Brazil rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BR",
      taxYear: "2026",
      facts: { scopeConfirmed: true, annualTaxBaseMinor: 3_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BR",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        annualTaxBaseMinor: 3_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
