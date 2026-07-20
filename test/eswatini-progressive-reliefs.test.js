import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { eswatiniPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [eswatiniPackage] });

async function calculate(rebateSchedule, taxableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "SZ",
    taxYear: "2025-26",
    facts: { scopeConfirmed: true, rebateSchedule, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Eswatini exposes only the evidence-backed current income year", () => {
  assert.deepEqual(eswatiniPackage.manifest.taxYears, [{
    taxYear: "2025-26",
    modelVersion: "sz-2025-26-v1",
    status: "current",
    order: 2026,
  }]);
  assert.equal(eswatiniPackage.manifest.storesUserPII, false);
  assert.equal(eswatiniPackage.manifest.advisory, false);
  assert.equal(eswatiniPackage.manifest.pit.taxYearBasis, "income-year");
  assert.equal(eswatiniPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Eswatini standard rebate reproduces the effective E41,000 threshold", async () => {
  const below = await calculate("standard", 4_000_000);
  const atThreshold = await calculate("standard", 4_100_000);
  const above = await calculate("standard", 4_100_100);

  assert.equal(below.totals.grossIncomeTaxMinor, 800_000);
  assert.equal(below.totals.rebateAppliedMinor, 800_000);
  assert.equal(below.totals.incomeTaxMinor, 0);

  assert.equal(atThreshold.totals.grossIncomeTaxMinor, 820_000);
  assert.equal(atThreshold.totals.rebateAppliedMinor, 820_000);
  assert.equal(atThreshold.totals.incomeTaxMinor, 0);

  assert.equal(above.totals.grossIncomeTaxMinor, 820_020);
  assert.equal(above.totals.rebateAppliedMinor, 820_000);
  assert.equal(above.totals.incomeTaxMinor, 20);
});

test("Eswatini applies every normal individual progressive boundary", async () => {
  const cases = [
    [10_000_000, 2_000_000, 1_180_000],
    [15_000_000, 3_250_000, 2_430_000],
    [20_000_000, 4_750_000, 3_930_000],
    [30_000_000, 8_050_000, 7_230_000],
  ];
  for (const [taxableIncomeMinor, grossIncomeTaxMinor, incomeTaxMinor] of cases) {
    const result = await calculate("standard", taxableIncomeMinor);
    assert.equal(result.totals.grossIncomeTaxMinor, grossIncomeTaxMinor);
    assert.equal(result.totals.availableRebateMinor, 820_000);
    assert.equal(result.totals.incomeTaxMinor, incomeTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("sz.ers.individual-rates-and-rebates")));
  }
});

test("Eswatini applies the additional over-60 rebate non-refundably", async () => {
  const atThreshold = await calculate("over-60", 5_450_000);
  assert.equal(atThreshold.totals.grossIncomeTaxMinor, 1_090_000);
  assert.equal(atThreshold.totals.availableRebateMinor, 1_090_000);
  assert.equal(atThreshold.totals.rebateAppliedMinor, 1_090_000);
  assert.equal(atThreshold.totals.incomeTaxMinor, 0);

  const highIncome = await calculate("over-60", 10_000_000);
  assert.equal(highIncome.totals.grossIncomeTaxMinor, 2_000_000);
  assert.equal(highIncome.totals.rebateAppliedMinor, 1_090_000);
  assert.equal(highIncome.totals.incomeTaxMinor, 910_000);

  const lowIncome = await calculate("over-60", 1_000_000);
  assert.equal(lowIncome.totals.grossIncomeTaxMinor, 200_000);
  assert.equal(lowIncome.totals.rebateAppliedMinor, 200_000);
  assert.equal(lowIncome.totals.incomeTaxMinor, 0);
});

test("Eswatini calculations disclose excluded concessionary and PAYE scopes", async () => {
  const result = await calculate("standard", 10_000_000);
  assert.ok(result.coverage.unsupported.some((entry) => entry.includes("redundant and retiring-person")));
  assert.ok(result.coverage.unsupported.some((entry) => entry.includes("cumulative PAYE")));
  assert.ok(result.assumptions.some((entry) => entry.includes("normal individual schedule")));
});

test("Eswatini is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SZ" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2025-26"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SZ/2025-26/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "rebateSchedule", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SZ",
      taxYear: "2025-26",
      facts: { scopeConfirmed: true, rebateSchedule: "standard", taxableIncomeMinor: 10_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 1_180_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "sz.ers.individual-rates-and-rebates"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "sz.ers.paye-tool-2026"));
});

test("Eswatini rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SZ",
      taxYear: "2024-25",
      facts: { scopeConfirmed: true, rebateSchedule: "standard", taxableIncomeMinor: 10_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "SZ",
      taxYear: "2025-26",
      facts: {
        scopeConfirmed: true,
        rebateSchedule: "standard",
        taxableIncomeMinor: 10_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
