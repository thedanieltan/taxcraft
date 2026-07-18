import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackages } from "@taxcraft/country-simple-progressive";

const EXPECTED_CODES = ["NZ", "PY", "CY", "PA", "HN", "DO"];

test("simple-progressive bundle exposes six independent maintained packages", () => {
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

test("New Zealand calculates the maintained annual schedules", async () => {
  const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });
  const year2026 = await engine.calculate({
    jurisdiction: "NZ",
    taxYear: "2026",
    facts: { scopeConfirmed: true, taxableIncomeMinor: 10_000_000 },
  });
  assert.equal(year2026.status, "ok");
  assert.equal(year2026.totals.incomeTaxMinor, 2_287_750);

  const transitionYear = await engine.calculate({
    jurisdiction: "NZ",
    taxYear: "2025",
    facts: { scopeConfirmed: true, taxableIncomeMinor: 7_810_000 },
  });
  assert.equal(transitionYear.status, "ok");
  assert.equal(transitionYear.totals.incomeTaxMinor, 1_599_551);
  assert.equal(transitionYear.lines.length, 6);
});

test("New Zealand requires whole-dollar taxable income", async () => {
  const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });
  const result = await engine.calculate({
    jurisdiction: "NZ",
    taxYear: "2026",
    facts: { scopeConfirmed: true, taxableIncomeMinor: 1_000_001 },
  });
  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some(({ path }) => path === "$.facts.taxableIncomeMinor"));
});

test("Paraguay applies the gross-income payment threshold and progressive net-income rates", async () => {
  const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });
  const belowThreshold = await engine.calculate({
    jurisdiction: "PY",
    taxYear: "2026",
    facts: {
      scopeConfirmed: true,
      grossPersonalServiceIncomeMinor: 80_000_000,
      netPersonalServiceIncomeMinor: 60_000_000,
    },
  });
  assert.equal(belowThreshold.status, "ok");
  assert.equal(belowThreshold.totals.incomeTaxMinor, 0);

  const aboveThreshold = await engine.calculate({
    jurisdiction: "PY",
    taxYear: "2026",
    facts: {
      scopeConfirmed: true,
      grossPersonalServiceIncomeMinor: 200_000_000,
      netPersonalServiceIncomeMinor: 200_000_000,
    },
  });
  assert.equal(aboveThreshold.status, "ok");
  assert.equal(aboveThreshold.totals.incomeTaxMinor, 18_000_000);

  const inconsistent = await engine.calculate({
    jurisdiction: "PY",
    taxYear: "2026",
    facts: {
      scopeConfirmed: true,
      grossPersonalServiceIncomeMinor: 100_000_000,
      netPersonalServiceIncomeMinor: 110_000_000,
    },
  });
  assert.equal(inconsistent.status, "invalid");
  assert.ok(inconsistent.issues.some(({ code }) => code === "py.net-income.exceeds-gross"));
});

test("Cyprus applies pre-reform and 2026 reform brackets", async () => {
  const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });
  const year2025 = await engine.calculate({
    jurisdiction: "CY",
    taxYear: "2025",
    facts: { scopeConfirmed: true, taxableIncomeMinor: 7_000_000 },
  });
  assert.equal(year2025.status, "ok");
  assert.equal(year2025.totals.incomeTaxMinor, 1_438_500);

  const year2026 = await engine.calculate({
    jurisdiction: "CY",
    taxYear: "2026",
    facts: { scopeConfirmed: true, taxableIncomeMinor: 7_000_000 },
  });
  assert.equal(year2026.status, "ok");
  assert.equal(year2026.totals.incomeTaxMinor, 1_290_000);
});

test("Panama applies the statutory 0%, 15% and 25% schedule", async () => {
  const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });
  const cases = [
    [1_100_000, 0],
    [5_000_000, 585_000],
    [6_000_000, 835_000],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await engine.calculate({
      jurisdiction: "PA",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor },
    });
    assert.equal(result.status, "ok");
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("Honduras applies each year's officially indexed progressive table", async () => {
  const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });
  const exemptThresholds = {
    "2024": 20_936_962,
    "2025": 21_749_316,
    "2026": 22_832_432,
  };
  for (const [taxYear, taxableIncomeMinor] of Object.entries(exemptThresholds)) {
    const result = await engine.calculate({
      jurisdiction: "HN",
      taxYear,
      facts: { scopeConfirmed: true, taxableIncomeMinor },
    });
    assert.equal(result.status, "ok");
    assert.equal(result.totals.incomeTaxMinor, 0);
  }

  const highIncome = await engine.calculate({
    jurisdiction: "HN",
    taxYear: "2026",
    facts: { scopeConfirmed: true, taxableIncomeMinor: 100_000_000 },
  });
  assert.equal(highIncome.status, "ok");
  assert.equal(highIncome.totals.incomeTaxMinor, 15_786_061);
});

test("Dominican Republic applies published accumulated-tax amounts", async () => {
  const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });
  const cases = [
    [41_622_000, 0],
    [62_432_901, 3_121_600],
    [86_712_301, 7_977_600],
    [100_000_000, 11_299_525],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await engine.calculate({
      jurisdiction: "DO",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor },
    });
    assert.equal(result.status, "ok");
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("global catalogue and API retain all accepted simple-progressive packages", async () => {
  const api = createApi();
  const status = await api.handle({ method: "GET", path: "/v1/pit/status" });
  assert.equal(status.status, 200);
  assert.equal(status.body.jurisdictionCount, 249);
  assert.ok(status.body.counts.implemented >= 26);
  assert.equal(Object.values(status.body.counts).reduce((sum, value) => sum + value, 0), 249);

  for (const jurisdiction of EXPECTED_CODES) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${jurisdiction}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.implementationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);
    assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  }

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PA",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 5_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 585_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "pa.dgi.individual-income-tax-rates"));
});

test("simple-progressive packages reject unsupported years and identity fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "HN",
      taxYear: "2027",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 10_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "DO",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 50_000_000, name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
