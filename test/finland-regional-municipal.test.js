import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import {
  finlandPackage,
  regionalMunicipalPackages,
  regionalMunicipalPackagesByJurisdiction,
} from "@taxcraft/country-regional-municipal";

const engine = createTaxCraft({ countryPackages: [finlandPackage] });

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    stateTaxableEarnedIncomeMinor: 5_000_000,
    municipalTaxableEarnedIncomeMinor: 4_500_000,
    municipalTaxRateBasisPoints: 800,
    ...overrides,
  };
}

async function calculate(overrides = {}) {
  const result = await engine.calculate({
    jurisdiction: "FI",
    taxYear: "2026",
    facts: facts(overrides),
  });
  assert.equal(result.status, "ok");
  return result;
}

test("regional-municipal registry retains Switzerland, Belgium, Denmark and Finland", () => {
  assert.deepEqual(
    regionalMunicipalPackages.map(({ manifest }) => manifest.jurisdiction),
    ["CH", "BE", "DK", "FI"],
  );
  assert.equal(regionalMunicipalPackagesByJurisdiction.FI, finlandPackage);
  assert.ok(regionalMunicipalPackages.every(({ manifest }) => manifest.storesUserPII === false));
});

test("Finland exposes national and municipal 2026 earned-income layers", () => {
  assert.deepEqual(finlandPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(finlandPackage.manifest.storesUserPII, false);
  assert.equal(finlandPackage.manifest.advisory, false);
  assert.deepEqual(finlandPackage.manifest.pit.taxLayers, {
    national: true,
    subnational: false,
    local: true,
    subdivisionRequired: false,
  });
  assert.equal(finlandPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.ok(finlandPackage.sources.every(({ url }) => url.startsWith("https://www.vero.fi/")));
});

test("Finland reproduces every 2026 state earned-income threshold", async () => {
  const cases = [
    [0, 0],
    [1_000_000, 126_400],
    [2_200_000, 278_080],
    [3_260_000, 479_480],
    [4_010_000, 706_355],
    [5_210_000, 1_105_355],
    [6_000_000, 1_401_605],
  ];
  for (const [stateTaxableEarnedIncomeMinor, expectedStateTaxMinor] of cases) {
    const result = await calculate({
      stateTaxableEarnedIncomeMinor,
      municipalTaxableEarnedIncomeMinor: 0,
      municipalTaxRateBasisPoints: 0,
    });
    assert.equal(result.totals.stateIncomeTaxMinor, expectedStateTaxMinor);
  }
});

test("Finland calculates and reconciles caller-confirmed municipal tax", async () => {
  const result = await calculate();
  assert.equal(result.totals.stateIncomeTaxMinor, 1_035_530);
  assert.equal(result.totals.municipalIncomeTaxMinor, 360_000);
  assert.equal(result.totals.totalIncomeTaxMinor, 1_395_530);
  assert.equal(
    result.lines.reduce((sum, { amountMinor }) => sum + amountMinor, 0),
    result.totals.totalIncomeTaxMinor,
  );
});

test("Finland is exposed through the catalogue API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/FI" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "MULTI_LAYER");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/FI/2026/input-schema" });
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
    body: { jurisdiction: "FI", taxYear: "2026", facts: facts() },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.totalIncomeTaxMinor, 1_395_530);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "fi.vero.state-earned-income-scale-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "fi.vero.tax-bases-2026"));
});

test("Finland rejects unsupported municipal rates and identity fields", async () => {
  const api = createApi();
  const cases = [
    [facts({ municipalTaxRateBasisPoints: 2_001 }), "facts.maximum"],
    [{ ...facts(), name: "Private Person" }, "facts.pii-field"],
  ];
  for (const [submittedFacts, expectedCode] of cases) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: "FI", taxYear: "2026", facts: submittedFacts },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ code }) => code === expectedCode));
  }
});

test("Finland documents excluded derivation and additional tax layers", () => {
  const coverage = finlandPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("taxable-income derivation")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("church tax")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("broadcasting tax")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("municipal-rate lookup")));
});
