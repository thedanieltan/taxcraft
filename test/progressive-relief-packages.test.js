import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { progressiveReliefPackages } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: progressiveReliefPackages });

async function calculate(facts, taxYear = "2026") {
  const result = await engine.calculate({ jurisdiction: "KE", taxYear, facts });
  assert.equal(result.status, "ok");
  return result;
}

test("progressive-reliefs bundle retains every maintained package", () => {
  assert.deepEqual(progressiveReliefPackages.map(({ manifest }) => manifest.jurisdiction), ["KE", "ZA", "MY", "CZ", "ID", "GH", "MU", "LK", "SZ", "JM", "LS", "GY", "LR", "LC"]);
  const kenyaPackage = progressiveReliefPackages.find(({ manifest }) => manifest.jurisdiction === "KE");
  assert.equal(kenyaPackage.manifest.storesUserPII, false);
  assert.equal(kenyaPackage.manifest.advisory, false);
  assert.deepEqual(kenyaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024", "2025", "2026"]);
  assert.equal(kenyaPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.ok(kenyaPackage.sources.length >= 4);
});

test("Kenya applies monthly bands and non-refundable resident personal relief", async () => {
  const firstBand = await calculate({
    scopeConfirmed: true,
    incomePeriod: "monthly",
    individualTaxSchedule: "resident",
    taxableEmploymentIncomeMinor: 2_400_000,
  });
  assert.equal(firstBand.totals.grossIncomeTaxMinor, 240_000);
  assert.equal(firstBand.totals.personalReliefAppliedMinor, 240_000);
  assert.equal(firstBand.totals.incomeTaxMinor, 0);

  const secondBand = await calculate({
    scopeConfirmed: true,
    incomePeriod: "monthly",
    individualTaxSchedule: "resident",
    taxableEmploymentIncomeMinor: 3_233_300,
  });
  assert.equal(secondBand.totals.grossIncomeTaxMinor, 448_325);
  assert.equal(secondBand.totals.personalReliefAppliedMinor, 240_000);
  assert.equal(secondBand.totals.incomeTaxMinor, 208_325);
});

test("Kenya applies annual bands and resident personal relief", async () => {
  const cases = [
    [28_800_000, 2_880_000, 0],
    [38_800_000, 5_380_000, 2_500_000],
    [600_000_000, 173_740_000, 170_860_000],
    [960_000_000, 290_740_000, 287_860_000],
    [1_000_000_000, 304_740_000, 301_860_000],
  ];
  for (const [taxableEmploymentIncomeMinor, grossTaxMinor, netTaxMinor] of cases) {
    const result = await calculate({
      scopeConfirmed: true,
      incomePeriod: "annual",
      individualTaxSchedule: "resident",
      taxableEmploymentIncomeMinor,
    });
    assert.equal(result.totals.grossIncomeTaxMinor, grossTaxMinor);
    assert.equal(result.totals.availablePersonalReliefMinor, 2_880_000);
    assert.equal(result.totals.incomeTaxMinor, netTaxMinor);
  }
});

test("Kenya does not apply resident personal relief to the non-resident schedule", async () => {
  const result = await calculate({
    scopeConfirmed: true,
    incomePeriod: "annual",
    individualTaxSchedule: "non-resident",
    taxableEmploymentIncomeMinor: 38_800_000,
  });
  assert.equal(result.totals.grossIncomeTaxMinor, 5_380_000);
  assert.equal(result.totals.availablePersonalReliefMinor, 0);
  assert.equal(result.totals.personalReliefAppliedMinor, 0);
  assert.equal(result.totals.incomeTaxMinor, 5_380_000);
});

test("Kenya is available through the global API with cited sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/KE" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/KE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "incomePeriod",
    "individualTaxSchedule",
    "taxableEmploymentIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        incomePeriod: "annual",
        individualTaxSchedule: "resident",
        taxableEmploymentIncomeMinor: 38_800_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 2_500_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ke.kra.paye-rates-and-relief"));
});

test("Kenya rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KE",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        incomePeriod: "annual",
        individualTaxSchedule: "resident",
        taxableEmploymentIncomeMinor: 38_800_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "KE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        incomePeriod: "annual",
        individualTaxSchedule: "resident",
        taxableEmploymentIncomeMinor: 38_800_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
