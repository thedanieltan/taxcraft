import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { indonesiaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [indonesiaPackage] });

async function calculate(nonTaxableIncomeSchedule, annualNetIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "ID",
    taxYear,
    facts: { scopeConfirmed: true, nonTaxableIncomeSchedule, annualNetIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Indonesia maintains calendar years 2024 through 2026 without storing PII", () => {
  assert.deepEqual(indonesiaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024", "2025", "2026"]);
  assert.equal(indonesiaPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(indonesiaPackage.manifest.storesUserPII, false);
  assert.equal(indonesiaPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.equal(indonesiaPackage.manifest.pit.factsSchema.properties.nonTaxableIncomeSchedule.enum.length, 12);
});

test("Indonesia applies the statutory PTKP schedules", async () => {
  const cases = [
    ["individual-0", 54_000_000],
    ["individual-3", 67_500_000],
    ["married-0", 58_500_000],
    ["married-3", 72_000_000],
    ["married-combined-income-0", 112_500_000],
    ["married-combined-income-3", 126_000_000],
  ];
  for (const [schedule, allowance] of cases) {
    const result = await calculate(schedule, allowance);
    assert.equal(result.totals.nonTaxableIncomeMinor, allowance);
    assert.equal(result.totals.taxableIncomeMinor, 0);
    assert.equal(result.totals.incomeTaxMinor, 0);
  }
});

test("Indonesia floors taxable income to the nearest IDR 1,000", async () => {
  const below = await calculate("individual-0", 54_000_999);
  assert.equal(below.totals.taxableIncomeBeforeRoundingMinor, 999);
  assert.equal(below.totals.taxableIncomeMinor, 0);
  assert.equal(below.totals.incomeTaxMinor, 0);

  const firstUnit = await calculate("individual-0", 54_001_000);
  assert.equal(firstUnit.totals.taxableIncomeMinor, 1_000);
  assert.equal(firstUnit.totals.incomeTaxMinor, 50);
});

test("Indonesia applies every ordinary progressive rate band", async () => {
  const cases = [
    [114_000_000, 60_000_000, 3_000_000],
    [304_000_000, 250_000_000, 31_500_000],
    [554_000_000, 500_000_000, 94_000_000],
    [5_054_000_000, 5_000_000_000, 1_444_000_000],
    [5_154_000_000, 5_100_000_000, 1_479_000_000],
  ];
  for (const [annualNetIncomeMinor, taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("individual-0", annualNetIncomeMinor);
    assert.equal(result.totals.taxableIncomeMinor, taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("Indonesia is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/ID" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/ID/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "nonTaxableIncomeSchedule",
    "annualNetIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ID",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        nonTaxableIncomeSchedule: "individual-0",
        annualNetIncomeMinor: 304_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 31_500_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "id.djp.individual-income-tax-calculation"));
});

test("Indonesia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ID",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        nonTaxableIncomeSchedule: "individual-0",
        annualNetIncomeMinor: 304_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ID",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        nonTaxableIncomeSchedule: "individual-0",
        annualNetIncomeMinor: 304_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
