import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackages } from "@taxcraft/country-simple-progressive";

const EXPECTED_CODES = ["NZ", "PY", "CY", "PA", "HN", "DO", "BB", "TT", "SC", "UG", "GT", "RW"];
const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });

async function calculate(jurisdiction, taxYear, facts) {
  const result = await engine.calculate({ jurisdiction, taxYear, facts });
  assert.equal(result.status, "ok");
  return result;
}

test("simple-progressive bundle exposes twelve independent maintained packages", () => {
  assert.deepEqual(simpleProgressivePackages.map(({ manifest }) => manifest.jurisdiction), EXPECTED_CODES);
  for (const countryPackage of simpleProgressivePackages) {
    assert.equal(countryPackage.manifest.storesUserPII, false);
    assert.equal(countryPackage.manifest.advisory, false);
    assert.equal(countryPackage.manifest.taxYears.length, 3);
    assert.equal(countryPackage.manifest.taxYears.filter(({ status }) => status === "current").length, 1);
    assert.equal(countryPackage.manifest.pit.factsSchema.additionalProperties, false);
    assert.ok(countryPackage.sources.length > 0);
  }
});

test("previous simple-progressive fixtures remain stable", async () => {
  const cases = [
    ["NZ", { scopeConfirmed: true, taxableIncomeMinor: 10_000_000 }, 2_287_750],
    ["CY", { scopeConfirmed: true, taxableIncomeMinor: 7_000_000 }, 1_290_000],
    ["PA", { scopeConfirmed: true, taxableIncomeMinor: 6_000_000 }, 835_000],
    ["HN", { scopeConfirmed: true, taxableIncomeMinor: 100_000_000 }, 15_786_061],
    ["DO", { scopeConfirmed: true, taxableIncomeMinor: 100_000_000 }, 11_299_525],
    ["BB", { scopeConfirmed: true, taxableIncomeMinor: 6_000_000 }, 850_000],
    ["TT", { scopeConfirmed: true, taxableIncomeMinor: 110_000_000 }, 28_000_000],
  ];
  for (const [jurisdiction, facts, expectedTax] of cases) {
    const result = await calculate(jurisdiction, "2026", facts);
    assert.equal(result.totals.incomeTaxMinor, expectedTax);
  }

  const paraguay = await calculate("PY", "2026", {
    scopeConfirmed: true,
    grossPersonalServiceIncomeMinor: 200_000_000,
    netPersonalServiceIncomeMinor: 200_000_000,
  });
  assert.equal(paraguay.totals.incomeTaxMinor, 18_000_000);

  const seychelles = await calculate("SC", "2026", {
    scopeConfirmed: true,
    employmentTaxSchedule: "citizen",
    monthlyGrossEmolumentsMinor: 8_333_300,
  });
  assert.equal(seychelles.totals.incomeTaxMinor, 1_488_328);
});

test("Uganda applies resident and non-resident schedules", async () => {
  const exempt = await calculate("UG", "2026", {
    scopeConfirmed: true,
    individualTaxSchedule: "resident",
    annualChargeableIncomeMinor: 2_820_000,
  });
  const residentHigh = await calculate("UG", "2026", {
    scopeConfirmed: true,
    individualTaxSchedule: "resident",
    annualChargeableIncomeMinor: 121_000_000,
  });
  const nonResident = await calculate("UG", "2026", {
    scopeConfirmed: true,
    individualTaxSchedule: "non-resident",
    annualChargeableIncomeMinor: 4_920_000,
  });
  assert.equal(exempt.totals.incomeTaxMinor, 0);
  assert.equal(residentHigh.totals.incomeTaxMinor, 35_224_000);
  assert.equal(nonResident.totals.incomeTaxMinor, 582_000);
});

test("Guatemala applies the statutory 5% and 7% employment-income scale", async () => {
  const firstThreshold = await calculate("GT", "2026", {
    scopeConfirmed: true,
    annualTaxableEmploymentIncomeMinor: 30_000_000,
  });
  const aboveThreshold = await calculate("GT", "2026", {
    scopeConfirmed: true,
    annualTaxableEmploymentIncomeMinor: 40_000_000,
  });
  assert.equal(firstThreshold.totals.incomeTaxMinor, 1_500_000);
  assert.equal(aboveThreshold.totals.incomeTaxMinor, 2_200_000);
});

test("Rwanda applies the annual employment-income bands", async () => {
  const cases = [
    [720_000, 0],
    [1_200_000, 48_000],
    [2_400_000, 288_000],
    [3_000_000, 468_000],
  ];
  for (const [taxableEmploymentIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("RW", "2026", {
      scopeConfirmed: true,
      incomePeriod: "annual",
      taxableEmploymentIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("Rwanda annualizes monthly income and rounds monthly PAYE up", async () => {
  const cases = [
    [60_000, 0],
    [100_000, 4_000],
    [100_001, 4_001],
    [200_000, 24_000],
  ];
  for (const [taxableEmploymentIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("RW", "2026", {
      scopeConfirmed: true,
      incomePeriod: "monthly",
      taxableEmploymentIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.annualizedTaxableEmploymentIncomeMinor, taxableEmploymentIncomeMinor * 12);
  }
});

test("global catalogue and API expose every accepted simple-progressive package", async () => {
  const api = createApi();
  const status = await api.handle({ method: "GET", path: "/v1/pit/status" });
  assert.equal(status.status, 200);
  assert.equal(status.body.jurisdictionCount, 249);
  assert.ok(status.body.counts.implemented >= 32);
  assert.equal(Object.values(status.body.counts).reduce((sum, value) => sum + value, 0), 249);

  for (const jurisdiction of EXPECTED_CODES) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${jurisdiction}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.implementationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);
    assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  }

  const schemaCases = [
    ["UG", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["GT", ["scopeConfirmed", "annualTaxableEmploymentIncomeMinor"]],
    ["RW", ["scopeConfirmed", "incomePeriod", "taxableEmploymentIncomeMinor"]],
  ];
  for (const [code, required] of schemaCases) {
    const schema = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}/2026/input-schema` });
    assert.equal(schema.status, 200);
    assert.deepEqual(schema.body.factsSchema.required, required);
  }
});

test("simple-progressive packages reject unsupported years and identity fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "RW",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        incomePeriod: "monthly",
        taxableEmploymentIncomeMinor: 100_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "RW",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        incomePeriod: "monthly",
        taxableEmploymentIncomeMinor: 100_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
