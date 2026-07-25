import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackagesByJurisdiction } from "@taxcraft/country-simple-progressive";

const chinaPackage = simpleProgressivePackagesByJurisdiction.CN;
const taiwanPackage = simpleProgressivePackagesByJurisdiction.TW;
const mexicoPackage = simpleProgressivePackagesByJurisdiction.MX;
const engine = createTaxCraft({ countryPackages: [chinaPackage, taiwanPackage, mexicoPackage] });

async function calculate(jurisdiction, facts) {
  const result = await engine.calculate({ jurisdiction, taxYear: "2026", facts: { scopeConfirmed: true, ...facts } });
  assert.equal(result.status, "ok");
  return result;
}

test("China calculates the 2026 resident comprehensive-income schedule", async () => {
  const result = await calculate("CN", { annualTaxableComprehensiveIncomeMinor: 50_000_000 });
  assert.equal(result.totals.incomeTaxMinor, 9_708_000);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountMinor, 0), result.totals.incomeTaxMinor);
  assert.ok(result.sources.some(({ sourceId }) => sourceId === "cn.sta.individual-income-tax-law-comprehensive"));
});

test("China preserves exact marginal transitions", async () => {
  const threshold = await calculate("CN", { annualTaxableComprehensiveIncomeMinor: 3_600_000 });
  const above = await calculate("CN", { annualTaxableComprehensiveIncomeMinor: 3_600_100 });
  assert.equal(threshold.totals.incomeTaxMinor, 108_000);
  assert.equal(above.totals.incomeTaxMinor, 108_010);
});

test("Taiwan calculates the official 2026 resident progressive schedule", async () => {
  const result = await calculate("TW", { netTaxableIncomeMinor: 300_000_000 });
  assert.equal(result.totals.incomeTaxMinor, 46_990_000);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountMinor, 0), result.totals.incomeTaxMinor);
  assert.ok(result.sources.some(({ sourceId }) => sourceId === "tw.mof.progressive-tax-rate-2026"));
});

test("Taiwan preserves the first 2026 band transition", async () => {
  const threshold = await calculate("TW", { netTaxableIncomeMinor: 61_000_000 });
  const above = await calculate("TW", { netTaxableIncomeMinor: 61_000_100 });
  assert.equal(threshold.totals.incomeTaxMinor, 3_050_000);
  assert.equal(above.totals.incomeTaxMinor, 3_050_012);
});

test("Mexico applies the official 2026 annual fixed-quota tariff", async () => {
  const result = await calculate("MX", { annualTaxableIncomeMinor: 150_000_000 });
  assert.equal(result.totals.tariffRow, 9);
  assert.equal(result.totals.fixedTaxMinor, 30_791_081);
  assert.equal(result.totals.marginalTaxMinor, 7_138_368);
  assert.equal(result.totals.incomeTaxMinor, 37_929_449);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountMinor, 0), result.totals.incomeTaxMinor);
  assert.ok(result.sources.some(({ sourceId }) => sourceId === "mx.dof.rmf-2026-annex-8"));
});

test("Mexico preserves official fixed quotas at tariff boundaries", async () => {
  const first = await calculate("MX", { annualTaxableIncomeMinor: 1_013_511 });
  const second = await calculate("MX", { annualTaxableIncomeMinor: 1_013_512 });
  assert.equal(first.totals.incomeTaxMinor, 19_459);
  assert.equal(second.totals.incomeTaxMinor, 19_459);
  assert.equal(second.totals.tariffRow, 2);
});

test("all three packages expose closed non-PII schemas and global API coverage", async () => {
  const api = createApi();
  const cases = [
    ["CN", "annualTaxableComprehensiveIncomeMinor", "cn.sta.individual-income-tax-law-comprehensive"],
    ["TW", "netTaxableIncomeMinor", "tw.mof.progressive-tax-rate-2026"],
    ["MX", "annualTaxableIncomeMinor", "mx.sat.rmf-2026-annex-8-annual-tariff"],
  ];
  for (const [code, incomeField, sourceId] of cases) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);

    const schema = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}/2026/input-schema` });
    assert.equal(schema.status, 200);
    assert.equal(schema.body.factsSchema.additionalProperties, false);
    assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", incomeField]);

    const privateFact = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: code, taxYear: "2026", facts: { scopeConfirmed: true, [incomeField]: 1_000_000, name: "Private Person" } },
    });
    assert.equal(privateFact.status, 400);
    assert.ok(privateFact.body.issues.some(({ code: issueCode }) => issueCode === "facts.pii-field"));

    const coverage = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}/2026/coverage` });
    assert.equal(coverage.status, 200);
    assert.ok(coverage.body.sources.some(({ sourceId: actual }) => actual === sourceId));
  }
});
