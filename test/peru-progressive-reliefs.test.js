import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { peruPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [peruPackage] });

async function calculate(netTaxableWorkIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "PE",
    taxYear,
    facts: { scopeConfirmed: true, netTaxableWorkIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Peru exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(peruPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(peruPackage.manifest.storesUserPII, false);
  assert.equal(peruPackage.manifest.advisory, false);
  assert.equal(peruPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Peru applies the 2026 five-UIT work-income scale", async () => {
  const cases = [
    [0, 0],
    [2_750_000, 220_000],
    [11_000_000, 1_375_000],
    [19_250_000, 2_777_500],
    [24_750_000, 3_877_500],
    [30_000_000, 5_452_500],
  ];
  for (const [netTaxableWorkIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(netTaxableWorkIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.uitMinor, 550_000);
    assert.equal(result.totals.firstThresholdMinor, 2_750_000);
    assert.equal(result.totals.secondThresholdMinor, 11_000_000);
    assert.equal(result.totals.thirdThresholdMinor, 19_250_000);
    assert.equal(result.totals.fourthThresholdMinor, 24_750_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("pe.sunat.work-income-rates")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("pe.sunat.uit-2026")));
  }
});

test("Peru exposes the annual work-income scale through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/PE" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/PE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "netTaxableWorkIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PE",
      taxYear: "2026",
      facts: { scopeConfirmed: true, netTaxableWorkIncomeMinor: 30_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 5_452_500);
});

test("Peru keeps deduction and income-classification rules outside the scale engine", () => {
  const coverage = peruPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("seven-UIT deduction")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("additional three-UIT")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("capital-income")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("domicile")));
});

test("Peru rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "PE", taxYear: "2025", facts: { scopeConfirmed: true, netTaxableWorkIncomeMinor: 2_750_000 } },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PE",
      taxYear: "2026",
      facts: { scopeConfirmed: true, netTaxableWorkIncomeMinor: 2_750_000, name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
