import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackagesByJurisdiction } from "@taxcraft/country-simple-progressive";

const fijiPackage = simpleProgressivePackagesByJurisdiction.FJ;
const engine = createTaxCraft({ countryPackages: [fijiPackage] });

async function calculate(individualTaxSchedule, annualChargeableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "FJ",
    taxYear,
    facts: { scopeConfirmed: true, individualTaxSchedule, annualChargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Fiji maintains calendar years 2024 through 2026 without storing PII", () => {
  assert.deepEqual(fijiPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024", "2025", "2026"]);
  assert.equal(fijiPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(fijiPackage.manifest.storesUserPII, false);
  assert.equal(fijiPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Fiji applies every resident individual breakpoint", async () => {
  const cases = [
    [3_000_000, 0],
    [5_000_000, 360_000],
    [27_000_000, 4_760_000],
    [30_000_000, 5_750_000],
    [35_000_000, 7_450_000],
    [40_000_000, 9_200_000],
    [45_000_000, 11_000_000],
    [50_000_000, 12_850_000],
    [100_000_000, 31_850_000],
    [110_000_000, 35_750_000],
  ];
  for (const [annualChargeableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("resident", annualChargeableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("Fiji applies every non-resident individual breakpoint", async () => {
  const cases = [
    [3_000_000, 600_000],
    [5_000_000, 1_000_000],
    [27_000_000, 5_400_000],
    [30_000_000, 6_390_000],
    [35_000_000, 8_090_000],
    [40_000_000, 9_840_000],
    [45_000_000, 11_640_000],
    [50_000_000, 13_490_000],
    [100_000_000, 32_490_000],
    [110_000_000, 36_390_000],
  ];
  for (const [annualChargeableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("non-resident", annualChargeableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("Fiji is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/FJ" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "SIMPLE_PROGRESSIVE");
  assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/FJ/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "individualTaxSchedule",
    "annualChargeableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "FJ",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualChargeableIncomeMinor: 30_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 5_750_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "fj.frcs.paye-structure-2024"));
});

test("Fiji rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "FJ",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualChargeableIncomeMinor: 30_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "FJ",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualChargeableIncomeMinor: 30_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
