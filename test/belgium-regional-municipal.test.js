import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import {
  belgiumPackage,
  regionalMunicipalPackages,
  regionalMunicipalPackagesByJurisdiction,
} from "@taxcraft/country-regional-municipal";

const engine = createTaxCraft({ countryPackages: [belgiumPackage] });

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    taxableIncomeMinor: 0,
    municipalSurchargeBasisPoints: 700,
    ...overrides,
  };
}

async function calculate(overrides = {}) {
  const result = await engine.calculate({
    jurisdiction: "BE",
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
  assert.equal(regionalMunicipalPackagesByJurisdiction.BE, belgiumPackage);
  assert.ok(regionalMunicipalPackages.every(({ manifest }) => manifest.storesUserPII === false));
});

test("Belgium exposes a national and local 2026 model without storing PII", () => {
  assert.deepEqual(belgiumPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(belgiumPackage.manifest.storesUserPII, false);
  assert.equal(belgiumPackage.manifest.advisory, false);
  assert.deepEqual(belgiumPackage.manifest.pit.taxLayers, {
    national: true,
    subnational: false,
    local: true,
    subdivisionRequired: false,
  });
  assert.equal(belgiumPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Belgium applies the 2026 bands and basic tax-free amount", async () => {
  const cases = [
    [0, 0],
    [1_118_000, 0],
    [1_672_000, 138_500],
    [2_951_000, 650_100],
    [5_107_000, 1_620_300],
    [6_000_000, 2_066_800],
  ];
  for (const [taxableIncomeMinor, expectedPersonalIncomeTaxMinor] of cases) {
    const result = await calculate({
      taxableIncomeMinor,
      municipalSurchargeBasisPoints: 0,
    });
    assert.equal(result.totals.personalIncomeTaxMinor, expectedPersonalIncomeTaxMinor);
  }
});

test("Belgium calculates and reconciles a caller-confirmed municipal addition", async () => {
  const result = await calculate({ taxableIncomeMinor: 5_000_000 });
  assert.equal(result.totals.grossPersonalIncomeTaxMinor, 1_851_650);
  assert.equal(result.totals.basicTaxFreeReductionAppliedMinor, 279_500);
  assert.equal(result.totals.personalIncomeTaxMinor, 1_572_150);
  assert.equal(result.totals.municipalIncomeTaxMinor, 110_051);
  assert.equal(result.totals.totalIncomeTaxMinor, 1_682_201);
  assert.equal(
    result.lines.reduce((sum, { amountMinor }) => sum + amountMinor, 0),
    result.totals.totalIncomeTaxMinor,
  );
});

test("Belgium is exposed through the catalogue API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/BE" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "MULTI_LAYER");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/BE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "taxableIncomeMinor",
    "municipalSurchargeBasisPoints",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BE",
      taxYear: "2026",
      facts: facts({ taxableIncomeMinor: 5_000_000 }),
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.totalIncomeTaxMinor, 1_682_201);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "be.fps-finance.pit-rates-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "be.fps-finance.municipal-addition"));
});

test("Belgium rejects unsupported municipal rates and identity fields", async () => {
  const api = createApi();
  const cases = [
    [facts({ municipalSurchargeBasisPoints: 2_001 }), "facts.maximum"],
    [{ ...facts(), name: "Private Person" }, "facts.pii-field"],
  ];
  for (const [submittedFacts, expectedCode] of cases) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: "BE", taxYear: "2026", facts: submittedFacts },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ code }) => code === expectedCode));
  }
});

test("Belgium documents excluded derivation and relief decisions", () => {
  const coverage = belgiumPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("taxable-income derivation")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("regional tax reductions")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("municipal-rate lookup")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("social-security")));
});
