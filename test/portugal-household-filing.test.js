import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { portugalPackage } from "@taxcraft/country-household-filing";

const engine = createTaxCraft({ countryPackages: [portugalPackage] });

async function calculate(filingSchedule, taxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "PT",
    taxYear,
    facts: { scopeConfirmed: true, filingSchedule, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Portugal exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(portugalPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(portugalPackage.manifest.storesUserPII, false);
  assert.equal(portugalPackage.manifest.advisory, false);
  assert.equal(portugalPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Portugal applies every 2026 separate-assessment general threshold", async () => {
  const cases = [
    [0, 0],
    [834_200, 104_275],
    [1_258_700, 170_922],
    [1_783_800, 282_243],
    [2_308_900, 408_792],
    [2_939_700, 604_971],
    [4_309_000, 1_082_856],
    [4_656_600, 1_232_672],
    [8_663_400, 3_019_705],
    [10_000_000, 3_661_273],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("separate", taxableIncomeMinor);
    assert.equal(result.totals.generalIncomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.filingDivisor, 1);
    assert.equal(
      result.lines.filter(({ ruleId }) => ruleId.includes("general-band")).reduce((sum, line) => sum + line.amountMinor, 0),
      expectedTaxMinor,
    );
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("pt.at.cirs-article-68-2026")));
  }
});

test("Portugal applies separate-assessment solidarity thresholds", async () => {
  const atThreshold = await calculate("separate", 8_000_000);
  assert.equal(atThreshold.totals.solidarityTaxMinor, 0);

  const firstRange = await calculate("separate", 10_000_000);
  assert.equal(firstRange.totals.firstSolidarityBaseMinor, 2_000_000);
  assert.equal(firstRange.totals.secondSolidarityBaseMinor, 0);
  assert.equal(firstRange.totals.solidarityTaxMinor, 50_000);
  assert.equal(firstRange.totals.incomeTaxAndSolidarityMinor, 3_711_273);

  const secondRange = await calculate("separate", 30_000_000);
  assert.equal(secondRange.totals.firstSolidarityBaseMinor, 17_000_000);
  assert.equal(secondRange.totals.secondSolidarityBaseMinor, 5_000_000);
  assert.equal(secondRange.totals.solidarityTaxMinor, 675_000);
  assert.equal(secondRange.totals.incomeTaxAndSolidarityMinor, 13_936_273);
});

test("Portugal applies the divisor of two to joint assessment and solidarity", async () => {
  const threshold = await calculate("joint", 16_000_000);
  assert.equal(threshold.totals.filingDivisor, 2);
  assert.equal(threshold.totals.generalIncomeTaxMinor, 5_447_657);
  assert.equal(threshold.totals.solidarityTaxMinor, 0);

  const household = await calculate("joint", 20_000_000);
  assert.equal(household.totals.generalIncomeTaxMinor, 7_322_545);
  assert.equal(household.totals.firstSolidarityBaseMinor, 4_000_000);
  assert.equal(household.totals.solidarityTaxMinor, 100_000);
  assert.equal(household.totals.incomeTaxAndSolidarityMinor, 7_422_545);

  const highIncome = await calculate("joint", 60_000_000);
  assert.equal(highIncome.totals.generalIncomeTaxMinor, 26_522_545);
  assert.equal(highIncome.totals.firstSolidarityBaseMinor, 34_000_000);
  assert.equal(highIncome.totals.secondSolidarityBaseMinor, 10_000_000);
  assert.equal(highIncome.totals.solidarityTaxMinor, 1_350_000);
  assert.equal(highIncome.totals.incomeTaxAndSolidarityMinor, 27_872_545);
});

test("Portugal exposes separate and joint schedules through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/PT" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "HOUSEHOLD_FILING");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/PT/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "filingSchedule", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PT",
      taxYear: "2026",
      facts: { scopeConfirmed: true, filingSchedule: "joint", taxableIncomeMinor: 20_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.generalIncomeTaxMinor, 7_322_545);
  assert.equal(calculation.body.totals.solidarityTaxMinor, 100_000);
});

test("Portugal keeps deductions and special regimes outside the engine", () => {
  const coverage = portugalPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("minimum-existence")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("collection deductions")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("special, autonomous")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("legal eligibility")));
});

test("Portugal rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "PT", taxYear: "2025", facts: { scopeConfirmed: true, filingSchedule: "separate", taxableIncomeMinor: 1_000_000 } },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PT",
      taxYear: "2026",
      facts: { scopeConfirmed: true, filingSchedule: "separate", taxableIncomeMinor: 1_000_000, name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
