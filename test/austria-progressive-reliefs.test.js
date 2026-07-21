import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { austriaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [austriaPackage] });

async function calculate(taxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "AT",
    taxYear,
    facts: { scopeConfirmed: true, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Austria exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(austriaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(austriaPackage.manifest.taxYears[0].status, "current");
  assert.equal(austriaPackage.manifest.storesUserPII, false);
  assert.equal(austriaPackage.manifest.advisory, false);
  assert.equal(austriaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Austria applies every official 2026 tariff threshold", async () => {
  const cases = [
    [0, 0],
    [1_353_900, 0],
    [2_199_200, 169_060],
    [3_645_800, 603_040],
    [4_000_000, 744_720],
    [7_036_500, 1_959_320],
    [10_485_900, 3_615_032],
    [100_000_000, 48_372_082],
    [110_000_000, 53_872_082],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.zeroRateMinor, 1_353_900);
    assert.equal(result.totals.twentyRateMinor, 2_199_200);
    assert.equal(result.totals.thirtyRateMinor, 3_645_800);
    assert.equal(result.totals.fortyRateMinor, 7_036_500);
    assert.equal(result.totals.fortyEightRateMinor, 10_485_900);
    assert.equal(result.totals.fiftyRateMinor, 100_000_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("at.ris.income-tax-act-section-33-2026")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("at.usp.tariff-levels-2026")));
  }
});

test("Austria exposes the ordinary annual tariff through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AT" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AT/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "AT",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 4_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 744_720);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "at.ris.income-tax-act-section-33-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "at.bmf.tax-tariff-2026"));
});

test("Austria keeps credits and special-rate income outside the tariff engine", () => {
  const coverage = austriaPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("tax credits")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("special-rate income")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("social-insurance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Austria rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "AT",
      taxYear: "2025",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 4_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "AT",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        taxableIncomeMinor: 4_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
