import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { turkeyPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [turkeyPackage] });

async function calculate(incomeSchedule, taxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "TR",
    taxYear,
    facts: { scopeConfirmed: true, incomeSchedule, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Türkiye exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(turkeyPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(turkeyPackage.manifest.storesUserPII, false);
  assert.equal(turkeyPackage.manifest.advisory, false);
  assert.equal(turkeyPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Türkiye applies the official 2026 general schedule", async () => {
  const cases = [
    [0, 0],
    [19_000_000, 2_850_000],
    [40_000_000, 7_050_000],
    [100_000_000, 23_250_000],
    [530_000_000, 173_750_000],
    [600_000_000, 201_750_000],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("general", taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.thirdThresholdMinor, 100_000_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("tr.gib.income-tax-tariff-2026")));
  }
});

test("Türkiye applies the separate 2026 wage schedule", async () => {
  const cases = [
    [40_000_000, 7_050_000],
    [100_000_000, 23_250_000],
    [150_000_000, 36_750_000],
    [530_000_000, 169_750_000],
    [600_000_000, 197_750_000],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("wage", taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.thirdThresholdMinor, 150_000_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("tr.gib.wage-income-2026")));
  }
});

test("Türkiye exposes both schedules through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/TR" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/TR/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "incomeSchedule", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TR",
      taxYear: "2026",
      facts: { scopeConfirmed: true, incomeSchedule: "wage", taxableIncomeMinor: 530_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 169_750_000);
});

test("Türkiye keeps exemptions, deductions and withholding outside the engine", () => {
  const coverage = turkeyPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("minimum-wage exemption")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("disability allowance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("withholding")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Türkiye rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "TR", taxYear: "2025", facts: { scopeConfirmed: true, incomeSchedule: "general", taxableIncomeMinor: 40_000_000 } },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TR",
      taxYear: "2026",
      facts: { scopeConfirmed: true, incomeSchedule: "general", taxableIncomeMinor: 40_000_000, name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
