import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import {
  regionalMunicipalPackages,
  regionalMunicipalPackagesByJurisdiction,
  swedenPackage,
} from "@taxcraft/country-regional-municipal";

const engine = createTaxCraft({ countryPackages: [swedenPackage] });

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    stateTaxableEarnedIncomeMinor: 80_000_000,
    municipalTaxableEarnedIncomeMinor: 70_000_000,
    municipalTaxRateBasisPoints: 3_238,
    ...overrides,
  };
}

async function calculate(overrides = {}) {
  const result = await engine.calculate({
    jurisdiction: "SE",
    taxYear: "2026",
    facts: facts(overrides),
  });
  assert.equal(result.status, "ok");
  return result;
}

test("regional-municipal registry retains Switzerland, Belgium, Denmark, Finland and Sweden", () => {
  assert.deepEqual(
    regionalMunicipalPackages.map(({ manifest }) => manifest.jurisdiction),
    ["CH", "BE", "DK", "FI", "SE"],
  );
  assert.equal(regionalMunicipalPackagesByJurisdiction.SE, swedenPackage);
  assert.ok(regionalMunicipalPackages.every(({ manifest }) => manifest.storesUserPII === false));
});

test("Sweden exposes national and municipal 2026 earned-income layers", () => {
  assert.deepEqual(swedenPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(swedenPackage.manifest.storesUserPII, false);
  assert.equal(swedenPackage.manifest.advisory, false);
  assert.deepEqual(swedenPackage.manifest.pit.taxLayers, {
    national: true,
    subnational: false,
    local: true,
    subdivisionRequired: false,
  });
  assert.equal(swedenPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.ok(swedenPackage.sources.every(({ url }) => url.startsWith("https://www.skatteverket.se/")));
});

test("Sweden calculates state tax above the threshold and caller-confirmed municipal tax", async () => {
  const result = await calculate();
  assert.equal(result.totals.stateTaxThresholdMinor, 64_300_000);
  assert.equal(result.totals.stateTaxableExcessMinor, 15_700_000);
  assert.equal(result.totals.stateIncomeTaxMinor, 3_140_000);
  assert.equal(result.totals.municipalIncomeTaxMinor, 22_666_000);
  assert.equal(result.totals.totalIncomeTaxMinor, 25_806_000);
  assert.equal(
    result.lines.reduce((sum, { amountMinor }) => sum + amountMinor, 0),
    result.totals.totalIncomeTaxMinor,
  );
});

test("Sweden applies the state threshold exactly and floors to öre", async () => {
  const atThreshold = await calculate({
    stateTaxableEarnedIncomeMinor: 64_300_000,
    municipalTaxableEarnedIncomeMinor: 0,
    municipalTaxRateBasisPoints: 0,
  });
  assert.equal(atThreshold.totals.stateIncomeTaxMinor, 0);

  const fiveOreAbove = await calculate({
    stateTaxableEarnedIncomeMinor: 64_300_005,
    municipalTaxableEarnedIncomeMinor: 0,
    municipalTaxRateBasisPoints: 0,
  });
  assert.equal(fiveOreAbove.totals.stateIncomeTaxMinor, 1);
});

test("Sweden is exposed through the catalogue API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SE" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "MULTI_LAYER");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "stateTaxableEarnedIncomeMinor",
    "municipalTaxableEarnedIncomeMinor",
    "municipalTaxRateBasisPoints",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "SE", taxYear: "2026", facts: facts() },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.totalIncomeTaxMinor, 25_806_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "se.skatteverket.state-income-tax-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "se.skatteverket.amounts-percentages-2026"));
});

test("Sweden rejects unsupported municipal rates and identity fields", async () => {
  const api = createApi();
  const cases = [
    [facts({ municipalTaxRateBasisPoints: 4_001 }), "facts.maximum"],
    [{ ...facts(), name: "Private Person" }, "facts.pii-field"],
  ];
  for (const [submittedFacts, expectedCode] of cases) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: "SE", taxYear: "2026", facts: submittedFacts },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ code }) => code === expectedCode));
  }
});

test("Sweden documents excluded allowances, credits and ancillary fees", () => {
  const coverage = swedenPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("basic-allowance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("earned-income tax credit")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("public-service fee")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("municipal-rate lookup")));
});
