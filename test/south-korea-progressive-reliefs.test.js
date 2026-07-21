import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { southKoreaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [southKoreaPackage] });

async function calculate(globalIncomeTaxBaseMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "KR",
    taxYear,
    facts: {
      scopeConfirmed: true,
      standardLocalRateConfirmed: true,
      globalIncomeTaxBaseMinor,
    },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("South Korea exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(southKoreaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(southKoreaPackage.manifest.taxYears[0].status, "current");
  assert.equal(southKoreaPackage.manifest.storesUserPII, false);
  assert.equal(southKoreaPackage.manifest.advisory, false);
  assert.equal(southKoreaPackage.manifest.pit.taxLayers.national, true);
  assert.equal(southKoreaPackage.manifest.pit.taxLayers.local, true);
  assert.equal(southKoreaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("South Korea applies every national and standard-local statutory boundary", async () => {
  const cases = [
    [0, 0, 0, 0],
    [14_000_000, 840_000, 84_000, 924_000],
    [50_000_000, 6_240_000, 624_000, 6_864_000],
    [88_000_000, 15_360_000, 1_536_000, 16_896_000],
    [150_000_000, 37_060_000, 3_706_000, 40_766_000],
    [300_000_000, 94_060_000, 9_406_000, 103_466_000],
    [500_000_000, 174_060_000, 17_406_000, 191_466_000],
    [1_000_000_000, 384_060_000, 38_406_000, 422_466_000],
    [2_000_000_000, 834_060_000, 83_406_000, 917_466_000],
  ];
  for (const [taxBase, nationalTax, localTax, combinedTax] of cases) {
    const result = await calculate(taxBase);
    assert.equal(result.totals.nationalIncomeTaxMinor, nationalTax);
    assert.equal(result.totals.standardLocalIncomeTaxMinor, localTax);
    assert.equal(result.totals.combinedIncomeTaxMinor, combinedTax);
  }
});

test("South Korea attributes national and local lines to their separate statutes", async () => {
  const result = await calculate(2_000_000_000);
  const nationalLines = result.lines.filter(({ ruleId }) => ruleId.includes("national-band"));
  const localLines = result.lines.filter(({ ruleId }) => ruleId.includes("standard-local-band"));
  assert.ok(nationalLines.length > 0);
  assert.ok(localLines.length > 0);
  assert.ok(nationalLines.every(({ sourceIds }) => sourceIds.length === 1 && sourceIds[0] === "kr.law.income-tax-act-article-55-2026"));
  assert.ok(localLines.every(({ sourceIds }) => sourceIds.length === 1 && sourceIds[0] === "kr.law.local-tax-act-article-92-2026"));
});

test("South Korea is exposed through the global API with standard-local confirmation", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/KR" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/KR/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "standardLocalRateConfirmed",
    "globalIncomeTaxBaseMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KR",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        standardLocalRateConfirmed: true,
        globalIncomeTaxBaseMinor: 500_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.combinedIncomeTaxMinor, 191_466_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "kr.law.income-tax-act-article-55-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "kr.law.local-tax-act-article-92-2026"));
});

test("South Korea rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KR",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        standardLocalRateConfirmed: true,
        globalIncomeTaxBaseMinor: 14_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KR",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        standardLocalRateConfirmed: true,
        globalIncomeTaxBaseMinor: 14_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
