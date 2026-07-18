import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { flatRatePackages } from "@taxcraft/country-flat-rate";

const EXPECTED_CODES = ["BG", "EE", "HU", "RO"];

test("flat-rate bundle exposes four independent maintained packages", () => {
  assert.deepEqual(flatRatePackages.map(({ manifest }) => manifest.jurisdiction), EXPECTED_CODES);
  for (const countryPackage of flatRatePackages) {
    assert.equal(countryPackage.manifest.storesUserPII, false);
    assert.equal(countryPackage.manifest.advisory, false);
    assert.equal(countryPackage.manifest.taxYears.length, 3);
    assert.equal(countryPackage.manifest.taxYears.filter(({ status }) => status === "current").length, 1);
    assert.equal(countryPackage.manifest.pit.factsSchema.additionalProperties, false);
    assert.ok(countryPackage.sources.length > 0);
  }
});

test("confirmed-tax-base packages apply their enacted flat rates deterministically", async () => {
  const engine = createTaxCraft({ countryPackages: flatRatePackages });
  const cases = [
    ["BG", 10_000],
    ["HU", 15_000],
    ["RO", 10_000],
  ];

  for (const [jurisdiction, expectedTaxMinor] of cases) {
    const request = {
      jurisdiction,
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxBaseMinor: 100_000 },
    };
    const original = structuredClone(request);
    const first = await engine.calculate(request);
    const second = await engine.calculate(request);

    assert.deepEqual(request, original);
    assert.deepEqual(first, second);
    assert.equal(first.status, "ok");
    assert.equal(first.totals.taxBaseMinor, 100_000);
    assert.equal(first.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(first.sources.length > 0);
  }
});

test("Estonia applies the 2024 and 2025 income-dependent basic exemption", async () => {
  const engine = createTaxCraft({ countryPackages: flatRatePackages });
  const threshold = await engine.calculate({
    jurisdiction: "EE",
    taxYear: "2024",
    facts: {
      residentConfirmed: true,
      annualIncomeForExemptionMinor: 1_440_000,
      taxableIncomeBeforeBasicExemptionMinor: 1_440_000,
      pensionableAgeDuringYear: false,
    },
  });
  assert.equal(threshold.status, "ok");
  assert.equal(threshold.totals.basicExemptionEntitlementMinor, 784_800);
  assert.equal(threshold.totals.taxBaseMinor, 655_200);
  assert.equal(threshold.totals.incomeTaxMinor, 131_040);

  const midpoint2024 = await engine.calculate({
    jurisdiction: "EE",
    taxYear: "2024",
    facts: {
      residentConfirmed: true,
      annualIncomeForExemptionMinor: 1_980_000,
      taxableIncomeBeforeBasicExemptionMinor: 1_980_000,
      pensionableAgeDuringYear: false,
    },
  });
  assert.equal(midpoint2024.totals.basicExemptionEntitlementMinor, 392_400);
  assert.equal(midpoint2024.totals.taxBaseMinor, 1_587_600);
  assert.equal(midpoint2024.totals.incomeTaxMinor, 317_520);

  const midpoint2025 = await engine.calculate({
    jurisdiction: "EE",
    taxYear: "2025",
    facts: {
      residentConfirmed: true,
      annualIncomeForExemptionMinor: 1_980_000,
      taxableIncomeBeforeBasicExemptionMinor: 1_980_000,
      pensionableAgeDuringYear: false,
    },
  });
  assert.equal(midpoint2025.totals.basicExemptionEntitlementMinor, 392_400);
  assert.equal(midpoint2025.totals.incomeTaxMinor, 349_272);
});

test("Estonia applies the fixed 2026 general and pensionable-age exemptions", async () => {
  const engine = createTaxCraft({ countryPackages: flatRatePackages });
  const general = await engine.calculate({
    jurisdiction: "EE",
    taxYear: "2026",
    facts: {
      residentConfirmed: true,
      annualIncomeForExemptionMinor: 2_000_000,
      taxableIncomeBeforeBasicExemptionMinor: 2_000_000,
      pensionableAgeDuringYear: false,
    },
  });
  assert.equal(general.totals.basicExemptionEntitlementMinor, 840_000);
  assert.equal(general.totals.taxBaseMinor, 1_160_000);
  assert.equal(general.totals.incomeTaxMinor, 255_200);

  const pensionable = await engine.calculate({
    jurisdiction: "EE",
    taxYear: "2026",
    facts: {
      residentConfirmed: true,
      annualIncomeForExemptionMinor: 2_000_000,
      taxableIncomeBeforeBasicExemptionMinor: 2_000_000,
      pensionableAgeDuringYear: true,
    },
  });
  assert.equal(pensionable.totals.basicExemptionEntitlementMinor, 931_200);
  assert.equal(pensionable.totals.taxBaseMinor, 1_068_800);
  assert.equal(pensionable.totals.incomeTaxMinor, 235_136);
});

test("flat-rate packages require confirmed scope and reject undeclared facts", async () => {
  const engine = createTaxCraft({ countryPackages: flatRatePackages });
  const unconfirmed = await engine.calculate({
    jurisdiction: "BG",
    taxYear: "2026",
    facts: { scopeConfirmed: false, taxBaseMinor: 100_000 },
  });
  assert.equal(unconfirmed.status, "invalid");
  assert.ok(unconfirmed.issues.some(({ path }) => path === "$.facts.scopeConfirmed"));

  const identityBearing = await engine.calculate({
    jurisdiction: "RO",
    taxYear: "2026",
    facts: { scopeConfirmed: true, taxBaseMinor: 100_000, name: "Private Person" },
  });
  assert.equal(identityBearing.status, "invalid");
  assert.ok(identityBearing.issues.some(({ code }) => code === "facts.pii-field"));
});

test("global catalogue and API expose the first flat-rate wave", async () => {
  const api = createApi();
  const status = await api.handle({ method: "GET", path: "/v1/pit/status" });
  assert.equal(status.status, 200);
  assert.equal(status.body.counts.implemented, 14);
  assert.equal(status.body.counts["source-indexed"], 149);
  assert.equal(status.body.counts["source-discovery"], 86);

  for (const jurisdiction of EXPECTED_CODES) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${jurisdiction}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.implementationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);
    assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  }

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/EE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "residentConfirmed",
    "annualIncomeForExemptionMinor",
    "taxableIncomeBeforeBasicExemptionMinor",
    "pensionableAgeDuringYear",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BG",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxBaseMinor: 500_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 50_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "bg.minfin.personal-income-tax"));
});

test("flat-rate packages reject years outside the maintained support window", async () => {
  const api = createApi();
  const response = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "HU",
      taxYear: "2027",
      facts: { scopeConfirmed: true, taxBaseMinor: 100_000 },
    },
  });
  assert.equal(response.status, 422);
  assert.equal(response.body.status, "unsupported");
  assert.equal(response.body.reasonCode, "tax-year-not-supported");
  assert.deepEqual(response.body.supportedTaxYears, ["2024", "2025", "2026"]);
});
