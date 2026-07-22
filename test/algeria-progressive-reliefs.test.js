import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { algeriaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [algeriaPackage] });

async function calculate(annualTaxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "DZ",
    taxYear,
    facts: { scopeConfirmed: true, annualTaxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Algeria exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(algeriaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(algeriaPackage.manifest.taxYears[0].status, "current");
  assert.equal(algeriaPackage.manifest.storesUserPII, false);
  assert.equal(algeriaPackage.manifest.advisory, false);
  assert.equal(algeriaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Algeria applies every Article 104 annual scale threshold", async () => {
  const cases = [
    [0, 0],
    [24_000_000, 0],
    [48_000_000, 5_520_000],
    [96_000_000, 18_480_000],
    [192_000_000, 47_280_000],
    [384_000_000, 110_640_000],
    [500_000_000, 151_240_000],
  ];
  for (const [annualTaxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(annualTaxableIncomeMinor);
    assert.equal(result.totals.incomeTaxBeforeAbatementsMinor, expectedTaxMinor);
    assert.equal(result.totals.exemptThresholdMinor, 24_000_000);
    assert.equal(result.totals.secondThresholdMinor, 48_000_000);
    assert.equal(result.totals.thirdThresholdMinor, 96_000_000);
    assert.equal(result.totals.fourthThresholdMinor, 192_000_000);
    assert.equal(result.totals.fifthThresholdMinor, 384_000_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("dz.dgi.irg-article-104-current-2026")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("dz.dgi.cidta-2026-publication")));
  }
});

test("Algeria exposes the raw Article 104 scale through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/DZ" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/DZ/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "annualTaxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "DZ",
      taxYear: "2026",
      facts: { scopeConfirmed: true, annualTaxableIncomeMinor: 500_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxBeforeAbatementsMinor, 151_240_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "dz.dgi.irg-article-104-current-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "dz.dgi.irg-article-104-current-ar-2026"));
});

test("Algeria keeps salary abatements, payroll administration and special schedules outside the engine", () => {
  const coverage = algeriaPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("40% salary")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("monthly payroll")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("occasional intellectual")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Algeria rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "DZ",
      taxYear: "2025",
      facts: { scopeConfirmed: true, annualTaxableIncomeMinor: 48_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "DZ",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        annualTaxableIncomeMinor: 48_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
