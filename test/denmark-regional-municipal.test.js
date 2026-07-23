import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import {
  denmarkPackage,
  regionalMunicipalPackages,
  regionalMunicipalPackagesByJurisdiction,
} from "@taxcraft/country-regional-municipal";

const engine = createTaxCraft({ countryPackages: [denmarkPackage] });

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    employmentIncomeSubjectToAmMinor: 50_000_000,
    municipalTaxableIncomeMinor: 39_000_000,
    municipalTaxRateBasisPoints: 2_500,
    ...overrides,
  };
}

async function calculate(overrides = {}) {
  const result = await engine.calculate({
    jurisdiction: "DK",
    taxYear: "2026",
    facts: facts(overrides),
  });
  assert.equal(result.status, "ok");
  return result;
}

test("regional-municipal registry retains Switzerland, Belgium and Denmark", () => {
  assert.deepEqual(
    regionalMunicipalPackages.map(({ manifest }) => manifest.jurisdiction),
    ["CH", "BE", "DK"],
  );
  assert.equal(regionalMunicipalPackagesByJurisdiction.DK, denmarkPackage);
  assert.ok(regionalMunicipalPackages.every(({ manifest }) => manifest.storesUserPII === false));
});

test("Denmark exposes a bounded national and municipal 2026 employment model", () => {
  assert.deepEqual(denmarkPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(denmarkPackage.manifest.storesUserPII, false);
  assert.equal(denmarkPackage.manifest.advisory, false);
  assert.deepEqual(denmarkPackage.manifest.pit.taxLayers, {
    national: true,
    subnational: false,
    local: true,
    subdivisionRequired: false,
  });
  assert.equal(denmarkPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.ok(denmarkPackage.sources.every(({ url }) => url.startsWith("https://skat.dk/") || url.startsWith("https://skm.dk/")));
});

test("Denmark calculates AM contribution, bottom tax and municipal tax", async () => {
  const result = await calculate();
  assert.equal(result.totals.labourMarketContributionMinor, 4_000_000);
  assert.equal(result.totals.personalIncomeAfterAmMinor, 46_000_000);
  assert.equal(result.totals.grossBottomTaxMinor, 5_524_600);
  assert.equal(result.totals.bottomAllowanceValueMinor, 649_741);
  assert.equal(result.totals.bottomTaxMinor, 4_874_859);
  assert.equal(result.totals.grossMunicipalTaxMinor, 9_750_000);
  assert.equal(result.totals.municipalAllowanceValueMinor, 1_352_500);
  assert.equal(result.totals.municipalIncomeTaxMinor, 8_397_500);
  assert.equal(result.totals.totalIncomeTaxMinor, 17_272_359);
  assert.equal(
    result.lines.reduce((sum, { amountMinor }) => sum + amountMinor, 0),
    result.totals.totalIncomeTaxMinor,
  );
});

test("Denmark limits both personal-allowance reductions to their tax layers", async () => {
  const result = await calculate({
    employmentIncomeSubjectToAmMinor: 5_000_000,
    municipalTaxableIncomeMinor: 4_000_000,
  });
  assert.equal(result.totals.labourMarketContributionMinor, 400_000);
  assert.equal(result.totals.bottomAllowanceAppliedMinor, 552_460);
  assert.equal(result.totals.bottomTaxMinor, 0);
  assert.equal(result.totals.municipalAllowanceAppliedMinor, 1_000_000);
  assert.equal(result.totals.municipalIncomeTaxMinor, 0);
  assert.equal(result.totals.totalIncomeTaxMinor, 400_000);
});

test("Denmark accepts the middle-tax boundary and rejects income one øre above it", async () => {
  const boundary = await calculate({
    employmentIncomeSubjectToAmMinor: 69_695_652,
    municipalTaxableIncomeMinor: 60_000_000,
  });
  assert.equal(boundary.totals.personalIncomeAfterAmMinor, 64_120_000);

  const api = createApi();
  const over = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "DK",
      taxYear: "2026",
      facts: facts({
        employmentIncomeSubjectToAmMinor: 69_695_653,
        municipalTaxableIncomeMinor: 60_000_000,
      }),
    },
  });
  assert.equal(over.status, 400);
  assert.ok(over.body.issues.some(({ code }) => code === "scope.middle-tax-threshold"));
});

test("Denmark is exposed through the catalogue API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/DK" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "MULTI_LAYER");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/DK/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "employmentIncomeSubjectToAmMinor",
    "municipalTaxableIncomeMinor",
    "municipalTaxRateBasisPoints",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "DK", taxYear: "2026", facts: facts() },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.totalIncomeTaxMinor, 17_272_359);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "dk.skat.am-contribution-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "dk.skm.personal-tax-act-rates-2026"));
});

test("Denmark rejects unsupported municipal bases, rates and identity fields", async () => {
  const api = createApi();
  const cases = [
    [facts({ municipalTaxableIncomeMinor: 46_000_001 }), "scope.municipal-base"],
    [facts({ municipalTaxRateBasisPoints: 3_001 }), "facts.maximum"],
    [{ ...facts(), name: "Private Person" }, "facts.pii-field"],
  ];
  for (const [submittedFacts, expectedCode] of cases) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: "DK", taxYear: "2026", facts: submittedFacts },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ code }) => code === expectedCode));
  }
});

test("Denmark documents the excluded higher brackets and derivation decisions", () => {
  const coverage = denmarkPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("middle, top or additional-top")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("capital income")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("municipal-rate lookup")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("tax ceiling")));
});
