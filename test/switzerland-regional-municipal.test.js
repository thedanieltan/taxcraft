import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { switzerlandPackage } from "@taxcraft/country-regional-municipal";

const engine = createTaxCraft({ countryPackages: [switzerlandPackage] });

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    canton: "ZH",
    municipality: "zurich-city",
    federalTariff: "single",
    zurichTariff: "basic",
    federalTaxableIncomeMinor: 10_000_000,
    zurichTaxableIncomeMinor: 10_000_000,
    federalChildDependentCount: 0,
    ...overrides,
  };
}

async function calculate(overrides = {}) {
  const result = await engine.calculate({
    jurisdiction: "CH",
    taxYear: "2026",
    facts: facts(overrides),
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Switzerland exposes a three-layer 2026 Zürich city model without storing PII", () => {
  assert.deepEqual(switzerlandPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(switzerlandPackage.manifest.storesUserPII, false);
  assert.equal(switzerlandPackage.manifest.advisory, false);
  assert.equal(switzerlandPackage.manifest.pit.taxUnit, "filing-status");
  assert.deepEqual(switzerlandPackage.manifest.pit.taxLayers, {
    national: true,
    subnational: true,
    local: true,
    subdivisionRequired: true,
  });
  assert.equal(switzerlandPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Switzerland reproduces the 2026 direct federal single-tariff transitions", async () => {
  const cases = [
    [1_520_000, 0],
    [1_850_000, 2_540],
    [3_320_000, 13_860],
    [4_350_000, 22_920],
    [5_800_000, 61_200],
    [10_000_000, 268_435],
    [79_400_000, 9_131_000],
    [100_000_000, 11_500_000],
  ];
  for (const [federalTaxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate({ federalTaxableIncomeMinor, zurichTaxableIncomeMinor: 0 });
    assert.equal(result.totals.federalIncomeTaxMinor, expectedTaxMinor);
  }
});

test("Switzerland reproduces the 2026 married tariff and federal child reduction", async () => {
  const married = await calculate({
    federalTariff: "married-or-single-parent",
    federalTaxableIncomeMinor: 5_340_000,
    zurichTaxableIncomeMinor: 0,
  });
  assert.equal(married.totals.federalIncomeTaxMinor, 23_700);

  const reduced = await calculate({
    federalTaxableIncomeMinor: 10_000_000,
    zurichTaxableIncomeMinor: 0,
    federalChildDependentCount: 2,
  });
  assert.equal(reduced.totals.federalTaxBeforeReductionMinor, 268_435);
  assert.equal(reduced.totals.federalReductionAppliedMinor, 52_600);
  assert.equal(reduced.totals.federalIncomeTaxMinor, 215_835);
});

test("Switzerland disregards income below CHF 100 and federal tax below CHF 25", async () => {
  const result = await calculate({
    federalTaxableIncomeMinor: 1_849_999,
    zurichTaxableIncomeMinor: 709_999,
  });
  assert.equal(result.totals.federalTaxableIncomeUsedMinor, 1_840_000);
  assert.equal(result.totals.federalIncomeTaxMinor, 0);
  assert.equal(result.totals.zurichTaxableIncomeUsedMinor, 700_000);
  assert.equal(result.totals.zurichSimpleStateTaxMinor, 0);
});

test("Switzerland calculates Zürich simple, cantonal and city income tax with statutory rounding", async () => {
  const result = await calculate({ federalTaxableIncomeMinor: 0 });
  assert.equal(result.totals.zurichSimpleStateTaxMinor, 617_000);
  assert.equal(result.totals.zurichCantonalIncomeTaxMinor, 586_150);
  assert.equal(result.totals.zurichCityIncomeTaxMinor, 734_230);
  assert.equal(result.totals.totalIncomeTaxMinor, 1_320_380);
  assert.equal(
    result.lines.reduce((sum, { amountMinor }) => sum + amountMinor, 0),
    result.totals.totalIncomeTaxMinor,
  );
  assert.ok(!result.lines.some(({ ruleId }) => ruleId.includes("simple-state-tax")));

  const married = await calculate({
    federalTaxableIncomeMinor: 0,
    zurichTariff: "married-or-single-parent",
  });
  assert.equal(married.totals.zurichSimpleStateTaxMinor, 474_300);
  assert.equal(married.totals.zurichCantonalIncomeTaxMinor, 450_585);
  assert.equal(married.totals.zurichCityIncomeTaxMinor, 564_415);
});

test("Switzerland is exposed through the catalogue API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/CH" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "MULTI_LAYER");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/CH/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "canton",
    "municipality",
    "federalTariff",
    "zurichTariff",
    "federalTaxableIncomeMinor",
    "zurichTaxableIncomeMinor",
    "federalChildDependentCount",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "CH", taxYear: "2026", facts: facts() },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.totalIncomeTaxMinor, 1_588_815);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ch.estv.circular-215-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ch.zurich-city.multiplier-2026"));
});

test("Switzerland keeps unsupported cantons, municipalities and identity fields outside scope", async () => {
  const api = createApi();
  const cases = [
    [facts({ canton: "GE" }), "facts.enum"],
    [facts({ municipality: "winterthur" }), "facts.enum"],
    [facts({ federalTariff: "concubinage" }), "facts.enum"],
    [{ ...facts(), name: "Private Person" }, "facts.pii-field"],
  ];
  for (const [submittedFacts, expectedCode] of cases) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: "CH", taxYear: "2026", facts: submittedFacts },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ code }) => code === expectedCode));
  }
});

test("Switzerland documents excluded tax layers and derivation decisions", () => {
  const coverage = switzerlandPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("other than Canton Zürich")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("church tax")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("wealth tax")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("taxable-income derivation")));
});
