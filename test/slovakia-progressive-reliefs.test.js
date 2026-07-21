import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { slovakiaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [slovakiaPackage] });

async function calculate(taxBaseMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "SK",
    taxYear,
    facts: { scopeConfirmed: true, taxBaseMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Slovakia exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(slovakiaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(slovakiaPackage.manifest.taxYears[0].status, "current");
  assert.equal(slovakiaPackage.manifest.storesUserPII, false);
  assert.equal(slovakiaPackage.manifest.advisory, false);
  assert.equal(slovakiaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Slovakia applies the official 2026 section 4(1)(a) thresholds", async () => {
  const cases = [
    [0, 0],
    [10, 2],
    [4_398_332, 835_683],
    [6_034_921, 1_244_830],
    [7_501_032, 1_684_663],
    [10_000_000, 2_559_302],
  ];
  for (const [taxBaseMinor, expectedTaxMinor] of cases) {
    const result = await calculate(taxBaseMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.firstThresholdMinor, 4_398_332);
    assert.equal(result.totals.secondThresholdMinor, 6_034_921);
    assert.equal(result.totals.thirdThresholdMinor, 7_501_032);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("sk.fa.individual-income-tax-rates-2026")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("sk.law.income-tax-act-2026")));
  }
});

test("Slovakia exposes the ordinary annual scale through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SK" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SK/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "taxBaseMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SK",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxBaseMinor: 10_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 2_559_302);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "sk.fa.individual-income-tax-rates-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "sk.fa.subsistence-minimum-2026"));
});

test("Slovakia keeps allowances and business schedules outside the scale engine", () => {
  const coverage = slovakiaPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("non-taxable allowance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("business and self-employment")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("social and health contributions")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Slovakia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SK",
      taxYear: "2025",
      facts: { scopeConfirmed: true, taxBaseMinor: 4_398_332 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SK",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        taxBaseMinor: 4_398_332,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
