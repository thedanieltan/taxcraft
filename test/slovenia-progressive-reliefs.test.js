import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { sloveniaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [sloveniaPackage] });

async function calculate(netAnnualTaxBaseMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "SI",
    taxYear,
    facts: { scopeConfirmed: true, netAnnualTaxBaseMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Slovenia exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(sloveniaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(sloveniaPackage.manifest.taxYears[0].status, "current");
  assert.equal(sloveniaPackage.manifest.storesUserPII, false);
  assert.equal(sloveniaPackage.manifest.advisory, false);
  assert.equal(sloveniaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Slovenia reproduces every official 2026 fixed-transition amount", async () => {
  const cases = [
    [0, 0],
    [972_143, 155_543],
    [2_859_244, 646_189],
    [5_718_488, 1_589_740],
    [8_234_623, 2_571_033],
    [10_000_000, 3_453_722],
  ];
  for (const [netAnnualTaxBaseMinor, expectedTaxMinor] of cases) {
    const result = await calculate(netAnnualTaxBaseMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("si.official-gazette-income-tax-parameters-2026")));
  }
});

test("Slovenia exposes the annual scale through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SI" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SI/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "netAnnualTaxBaseMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SI",
      taxYear: "2026",
      facts: { scopeConfirmed: true, netAnnualTaxBaseMinor: 5_718_488 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 1_589_740);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "si.official-gazette-income-tax-parameters-2026"));
});

test("Slovenia keeps allowances and final-tax income outside the scale engine", () => {
  const coverage = sloveniaPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("general allowance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("dependent-family-member")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("final or category-specific")));
});

test("Slovenia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SI",
      taxYear: "2025",
      facts: { scopeConfirmed: true, netAnnualTaxBaseMinor: 972_143 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SI",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        netAnnualTaxBaseMinor: 972_143,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
