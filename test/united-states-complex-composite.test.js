import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { unitedStatesPackage } from "@taxcraft/country-complex-composite";

const engine = createTaxCraft({ countryPackages: [unitedStatesPackage] });

async function calculate(filingStatus, taxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "US",
    taxYear,
    facts: { scopeConfirmed: true, filingStatus, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("United States exposes the 2026 federal ordinary-income schedules without storing PII", () => {
  assert.deepEqual(unitedStatesPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(unitedStatesPackage.manifest.taxYears[0].status, "current");
  assert.equal(unitedStatesPackage.manifest.storesUserPII, false);
  assert.equal(unitedStatesPackage.manifest.advisory, false);
  assert.equal(unitedStatesPackage.manifest.pit.taxUnit, "filing-status");
  assert.equal(unitedStatesPackage.manifest.pit.taxYearBasis, "calendar-year");
  assert.deepEqual(unitedStatesPackage.manifest.pit.incomeSchedules, [
    "single",
    "married-filing-jointly",
    "married-filing-separately",
    "head-of-household",
  ]);
  assert.equal(unitedStatesPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.equal(unitedStatesPackage.manifest.pit.factsSchema.properties.taxableIncomeMinor.multipleOf, 100);
});

test("United States reproduces the official 2026 single-filer transition amounts", async () => {
  const cases = [
    [0, 0],
    [1_240_000, 124_000],
    [5_040_000, 580_000],
    [10_570_000, 1_796_600],
    [20_177_500, 4_102_400],
    [25_622_500, 5_844_800],
    [64_060_000, 19_297_925],
    [100_000_000, 32_595_725],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("single", taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("United States reproduces the official 2026 filing-status top-band formulas", async () => {
  const cases = [
    ["married-filing-jointly", 100_000_000, 29_216_450],
    ["married-filing-separately", 100_000_000, 33_108_225],
    ["head-of-household", 100_000_000, 32_414_900],
  ];
  for (const [filingStatus, taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(filingStatus, taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ ruleId }) => ruleId.includes(filingStatus)));
  }
});

test("United States rejects fractional-dollar taxable income rather than inferring rounding", async () => {
  const api = createApi();
  const response = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "US",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingStatus: "single",
        taxableIncomeMinor: 1_240_099,
      },
    },
  });
  assert.equal(response.status, 400);
  assert.ok(response.body.issues.some(({ code }) => code === "facts.multiple-of"));
});

test("United States is exposed through the global API with official IRS sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/US" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "COMPLEX_COMPOSITE");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/US/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "filingStatus",
    "taxableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "US",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingStatus: "married-filing-jointly",
        taxableIncomeMinor: 100_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 29_216_450);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "us.irs.rev-proc-2025-32.section-4-01"));
});

test("United States keeps deductions, preferential schedules and non-federal taxes outside scope", () => {
  const coverage = unitedStatesPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("deduction")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("capital gains")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("alternative minimum tax")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("state")));
});

test("United States rejects unsupported years, filing statuses and identity-bearing fields", async () => {
  const api = createApi();
  const unsupportedYear = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "US",
      taxYear: "2025",
      facts: { scopeConfirmed: true, filingStatus: "single", taxableIncomeMinor: 5_000_000 },
    },
  });
  assert.equal(unsupportedYear.status, 422);
  assert.equal(unsupportedYear.body.reasonCode, "tax-year-not-supported");

  const invalidStatus = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "US",
      taxYear: "2026",
      facts: { scopeConfirmed: true, filingStatus: "qualifying-widow", taxableIncomeMinor: 5_000_000 },
    },
  });
  assert.equal(invalidStatus.status, 400);
  assert.ok(invalidStatus.body.issues.some(({ code }) => code === "facts.enum"));

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "US",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingStatus: "single",
        taxableIncomeMinor: 5_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code, path }) => code === "facts.unknown-field" && path === "$.facts.name"));
});
