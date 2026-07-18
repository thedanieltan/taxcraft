import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackages } from "@taxcraft/country-simple-progressive";

const EXPECTED_CODES = ["NZ", "PY", "CY", "PA", "HN", "DO", "BB", "TT", "SC"];
const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });

async function calculate(jurisdiction, taxYear, facts) {
  const result = await engine.calculate({ jurisdiction, taxYear, facts });
  assert.equal(result.status, "ok");
  return result;
}

test("simple-progressive bundle exposes nine independent maintained packages", () => {
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
  const newZealand = await calculate("NZ", "2026", {
    scopeConfirmed: true,
    taxableIncomeMinor: 10_000_000,
  });
  assert.equal(newZealand.totals.incomeTaxMinor, 2_287_750);

  const paraguay = await calculate("PY", "2026", {
    scopeConfirmed: true,
    grossPersonalServiceIncomeMinor: 200_000_000,
    netPersonalServiceIncomeMinor: 200_000_000,
  });
  assert.equal(paraguay.totals.incomeTaxMinor, 18_000_000);

  const cyprus2025 = await calculate("CY", "2025", {
    scopeConfirmed: true,
    taxableIncomeMinor: 7_000_000,
  });
  const cyprus2026 = await calculate("CY", "2026", {
    scopeConfirmed: true,
    taxableIncomeMinor: 7_000_000,
  });
  assert.equal(cyprus2025.totals.incomeTaxMinor, 1_438_500);
  assert.equal(cyprus2026.totals.incomeTaxMinor, 1_290_000);

  const panama = await calculate("PA", "2026", {
    scopeConfirmed: true,
    taxableIncomeMinor: 6_000_000,
  });
  assert.equal(panama.totals.incomeTaxMinor, 835_000);

  const honduras = await calculate("HN", "2026", {
    scopeConfirmed: true,
    taxableIncomeMinor: 100_000_000,
  });
  assert.equal(honduras.totals.incomeTaxMinor, 15_786_061);

  const dominican = await calculate("DO", "2026", {
    scopeConfirmed: true,
    taxableIncomeMinor: 100_000_000,
  });
  assert.equal(dominican.totals.incomeTaxMinor, 11_299_525);
});

test("Barbados applies the 2026 rate reduction", async () => {
  const year2025 = await calculate("BB", "2025", {
    scopeConfirmed: true,
    taxableIncomeMinor: 6_000_000,
  });
  const year2026 = await calculate("BB", "2026", {
    scopeConfirmed: true,
    taxableIncomeMinor: 6_000_000,
  });
  assert.equal(year2025.totals.incomeTaxMinor, 910_000);
  assert.equal(year2026.totals.incomeTaxMinor, 850_000);
  assert.ok(year2026.sources.some(({ sourceId }) => sourceId === "bb.bra.personal-income-tax-rates-2026"));
});

test("Trinidad and Tobago applies the 25% and 30% chargeable-income bands", async () => {
  const threshold = await calculate("TT", "2026", {
    scopeConfirmed: true,
    taxableIncomeMinor: 100_000_000,
  });
  const aboveThreshold = await calculate("TT", "2026", {
    scopeConfirmed: true,
    taxableIncomeMinor: 110_000_000,
  });
  assert.equal(threshold.totals.incomeTaxMinor, 25_000_000);
  assert.equal(aboveThreshold.totals.incomeTaxMinor, 28_000_000);
});

test("Seychelles applies separate citizen and non-citizen monthly schedules", async () => {
  const citizenExempt = await calculate("SC", "2026", {
    scopeConfirmed: true,
    citizenshipStatus: "citizen",
    monthlyGrossEmolumentsMinor: 855_550,
  });
  const citizenTopThreshold = await calculate("SC", "2026", {
    scopeConfirmed: true,
    citizenshipStatus: "citizen",
    monthlyGrossEmolumentsMinor: 8_333_300,
  });
  const nonCitizenTopThreshold = await calculate("SC", "2026", {
    scopeConfirmed: true,
    citizenshipStatus: "non-citizen",
    monthlyGrossEmolumentsMinor: 8_333_300,
  });
  assert.equal(citizenExempt.totals.incomeTaxMinor, 0);
  assert.equal(citizenTopThreshold.totals.incomeTaxMinor, 1_488_328);
  assert.equal(nonCitizenTopThreshold.totals.incomeTaxMinor, 1_616_660);
  assert.equal(citizenTopThreshold.totals.citizenshipStatus, "citizen");
});

test("global catalogue and API expose every accepted simple-progressive package", async () => {
  const api = createApi();
  const status = await api.handle({ method: "GET", path: "/v1/pit/status" });
  assert.equal(status.status, 200);
  assert.equal(status.body.jurisdictionCount, 249);
  assert.ok(status.body.counts.implemented >= 29);
  assert.equal(Object.values(status.body.counts).reduce((sum, value) => sum + value, 0), 249);

  for (const jurisdiction of EXPECTED_CODES) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${jurisdiction}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.implementationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);
    assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  }

  const seychellesSchema = await api.handle({
    method: "GET",
    path: "/v1/pit/jurisdictions/SC/2026/input-schema",
  });
  assert.equal(seychellesSchema.status, 200);
  assert.deepEqual(seychellesSchema.body.factsSchema.required, [
    "scopeConfirmed",
    "citizenshipStatus",
    "monthlyGrossEmolumentsMinor",
  ]);
});

test("simple-progressive packages reject unsupported years and identity fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BB",
      taxYear: "2027",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 5_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TT",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 50_000_000, name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
