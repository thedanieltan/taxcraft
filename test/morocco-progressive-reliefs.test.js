import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { moroccoPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [moroccoPackage] });

async function calculate(netTaxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "MA",
    taxYear,
    facts: { scopeConfirmed: true, netTaxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Morocco exposes only the 2026 general scale without storing PII", () => {
  assert.deepEqual(moroccoPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(moroccoPackage.manifest.taxYears[0].status, "current");
  assert.equal(moroccoPackage.manifest.storesUserPII, false);
  assert.equal(moroccoPackage.manifest.advisory, false);
  assert.equal(moroccoPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Morocco applies every Article 73-I general-scale threshold", async () => {
  const cases = [
    [0, 0],
    [4_000_000, 0],
    [6_000_000, 200_000],
    [8_000_000, 600_000],
    [10_000_000, 1_200_000],
    [18_000_000, 3_920_000],
    [20_000_000, 4_660_000],
  ];
  for (const [netTaxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(netTaxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.exemptThresholdMinor, 4_000_000);
    assert.equal(result.totals.secondThresholdMinor, 6_000_000);
    assert.equal(result.totals.thirdThresholdMinor, 8_000_000);
    assert.equal(result.totals.fourthThresholdMinor, 10_000_000);
    assert.equal(result.totals.fifthThresholdMinor, 18_000_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("ma.mef.cgi-2026-article-73")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("ma.dgi.circular-737-finance-law-2026")));
  }
});

test("Morocco exposes the general annual scale through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MA" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MA/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "netTaxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MA",
      taxYear: "2026",
      facts: { scopeConfirmed: true, netTaxableIncomeMinor: 20_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 4_660_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ma.mef.cgi-2026-article-73"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ma.official-bulletin-finance-law-2026"));
});

test("Morocco keeps reductions, specific rates and contributions outside the scale engine", () => {
  const coverage = moroccoPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("family-charge reduction")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("category-specific")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("social-security")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Morocco rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MA",
      taxYear: "2025",
      facts: { scopeConfirmed: true, netTaxableIncomeMinor: 6_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MA",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        netTaxableIncomeMinor: 6_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
