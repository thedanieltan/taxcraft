import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackagesByJurisdiction } from "@taxcraft/country-simple-progressive";

const botswanaPackage = simpleProgressivePackagesByJurisdiction.BW;
const engine = createTaxCraft({ countryPackages: [botswanaPackage] });

async function calculate(individualTaxSchedule, annualTaxableIncomeMinor, taxYear = "2026-27") {
  const result = await engine.calculate({
    jurisdiction: "BW",
    taxYear,
    facts: {
      scopeConfirmed: true,
      individualTaxSchedule,
      annualTaxableIncomeMinor,
    },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Botswana package exposes the maintained tax-year window and closed facts schema", () => {
  assert.ok(botswanaPackage);
  assert.equal(botswanaPackage.manifest.storesUserPII, false);
  assert.equal(botswanaPackage.manifest.advisory, false);
  assert.equal(botswanaPackage.manifest.pit.taxYearBasis, "tax-year");
  assert.deepEqual(botswanaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), [
    "2024-25",
    "2025-26",
    "2026-27",
  ]);
  assert.equal(botswanaPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.deepEqual(botswanaPackage.manifest.pit.factsSchema.required, [
    "scopeConfirmed",
    "individualTaxSchedule",
    "annualTaxableIncomeMinor",
  ]);
  assert.ok(botswanaPackage.sources.some(({ sourceId }) => sourceId === "bw.burs.individual-tax-rates-subsequent-years"));
});

test("Botswana applies every resident individual breakpoint", async () => {
  const cases = [
    [0, 0],
    [3_600_000, 0],
    [7_200_000, 180_000],
    [10_800_000, 630_000],
    [14_400_000, 1_305_000],
    [20_000_000, 2_705_000],
  ];
  for (const [annualTaxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("resident", annualTaxableIncomeMinor);
    assert.equal(result.totals.annualTaxableIncomeMinor, annualTaxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.length > 0));
  }
});

test("Botswana applies every non-resident individual breakpoint", async () => {
  const cases = [
    [0, 0],
    [3_600_000, 180_000],
    [7_200_000, 360_000],
    [10_800_000, 810_000],
    [14_400_000, 1_485_000],
    [20_000_000, 2_885_000],
  ];
  for (const [annualTaxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("non-resident", annualTaxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("Botswana maintains the same official subsequent-years table across all supported versions", async () => {
  for (const taxYear of ["2024-25", "2025-26", "2026-27"]) {
    const result = await calculate("resident", 20_000_000, taxYear);
    assert.equal(result.totals.incomeTaxMinor, 2_705_000);
  }
});

test("Botswana is available through the global API with cited coverage", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/BW" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "SIMPLE_PROGRESSIVE");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2024-25", "2025-26", "2026-27"]);

  const coverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/BW/2026-27/coverage" });
  assert.equal(coverage.status, 200);
  assert.ok(coverage.body.sources.some(({ sourceId }) => sourceId === "bw.burs.individual-tax-rates-subsequent-years"));

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BW",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualTaxableIncomeMinor: 20_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 2_705_000);
});

test("Botswana rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BW",
      taxYear: "2027-28",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualTaxableIncomeMinor: 20_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BW",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualTaxableIncomeMinor: 20_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
