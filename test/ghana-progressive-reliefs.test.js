import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { ghanaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [ghanaPackage] });

async function calculate(incomePeriod, individualTaxSchedule, chargeableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "GH",
    taxYear,
    facts: { scopeConfirmed: true, incomePeriod, individualTaxSchedule, chargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Ghana maintains calendar years 2024 through 2026 without storing PII", () => {
  assert.deepEqual(ghanaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024", "2025", "2026"]);
  assert.equal(ghanaPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(ghanaPackage.manifest.storesUserPII, false);
  assert.equal(ghanaPackage.manifest.advisory, false);
  assert.equal(ghanaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Ghana applies every unambiguous resident monthly threshold", async () => {
  const cases = [
    [49_000, 0],
    [60_000, 550],
    [73_000, 1_850],
    [389_667, 57_267],
    [1_989_667, 457_267],
  ];
  for (const taxYear of ["2024", "2025", "2026"]) {
    for (const [chargeableIncomeMinor, expectedTaxMinor] of cases) {
      const result = await calculate("monthly", "resident", chargeableIncomeMinor, taxYear);
      assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    }
  }
});

test("Ghana applies every unambiguous resident annual threshold", async () => {
  const cases = [
    [588_000, 0],
    [720_000, 6_600],
    [876_000, 22_200],
    [4_676_000, 687_200],
    [23_876_000, 5_487_200],
  ];
  for (const [chargeableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("annual", "resident", chargeableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("gh.parliament.income-tax-amendment-1111")));
  }
});

test("Ghana applies the full non-resident 25% schedule", async () => {
  const monthly = await calculate("monthly", "non-resident", 1_000_000);
  const annual = await calculate("annual", "non-resident", 100_000_000);
  assert.equal(monthly.totals.incomeTaxMinor, 250_000);
  assert.equal(annual.totals.incomeTaxMinor, 25_000_000);
  assert.deepEqual(monthly.lines[0].sourceIds, ["gh.gra.paye-rates-2024", "gh.gra.personal-income-tax"]);
});

test("Ghana rejects resident income in the contradictory upper-band scope", async () => {
  const api = createApi();
  for (const [incomePeriod, chargeableIncomeMinor] of [
    ["monthly", 1_989_668],
    ["annual", 23_876_001],
  ]) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: {
        jurisdiction: "GH",
        taxYear: "2026",
        facts: { scopeConfirmed: true, incomePeriod, individualTaxSchedule: "resident", chargeableIncomeMinor },
      },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ code }) => code === "facts.unsupported-scope"));
  }
});

test("Ghana is exposed through the global API with conflict disclosure", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GH" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GH/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "incomePeriod",
    "individualTaxSchedule",
    "chargeableIncomeMinor",
  ]);

  const coverage = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GH/2026/coverage" });
  assert.equal(coverage.status, 200);
  assert.ok(coverage.body.coverage.unsupported.some((entry) => entry.includes("official 30% band width and 35% threshold overlap")));
});

test("Ghana rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GH",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        incomePeriod: "annual",
        individualTaxSchedule: "non-resident",
        chargeableIncomeMinor: 1_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GH",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        incomePeriod: "annual",
        individualTaxSchedule: "resident",
        chargeableIncomeMinor: 1_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
