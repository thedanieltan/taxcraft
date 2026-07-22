import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { egyptPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [egyptPackage] });

async function calculate(netTaxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "EG",
    taxYear,
    facts: { scopeConfirmed: true, netTaxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Egypt exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(egyptPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(egyptPackage.manifest.taxYears[0].status, "current");
  assert.equal(egyptPackage.manifest.storesUserPII, false);
  assert.equal(egyptPackage.manifest.advisory, false);
  assert.equal(egyptPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Egypt applies the full Article 8 income-dependent matrix", async () => {
  const cases = [
    [0, 0, "net-income-up-to-600000"],
    [4_000_000, 0, "net-income-up-to-600000"],
    [5_500_000, 150_000, "net-income-up-to-600000"],
    [7_000_000, 375_000, "net-income-up-to-600000"],
    [20_000_000, 2_975_000, "net-income-up-to-600000"],
    [40_000_000, 7_475_000, "net-income-up-to-600000"],
    [60_000_000, 12_475_000, "net-income-up-to-600000"],
    [60_001_000, 12_875_250, "net-income-600000-to-700000"],
    [70_000_000, 15_375_000, "net-income-600000-to-700000"],
    [70_001_000, 15_650_250, "net-income-700000-to-800000"],
    [80_000_000, 18_150_000, "net-income-700000-to-800000"],
    [80_001_000, 18_500_250, "net-income-800000-to-900000"],
    [90_000_000, 21_000_000, "net-income-800000-to-900000"],
    [90_001_000, 21_500_250, "net-income-900000-to-1200000"],
    [120_000_000, 29_000_000, "net-income-900000-to-1200000"],
    [120_001_000, 30_000_275, "net-income-above-1200000"],
    [150_000_000, 38_250_000, "net-income-above-1200000"],
  ];
  for (const [netTaxableIncomeMinor, expectedTaxMinor, expectedSchedule] of cases) {
    const result = await calculate(netTaxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.incomeMatrixSchedule, expectedSchedule);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("eg.eta.income-tax-law-7-2024-article-8")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("eg.eta.current-payroll-tax-faq-2026")));
  }
});

test("Egypt floors annual net taxable income to the nearest EGP 10", async () => {
  const result = await calculate(6_000_999);
  assert.equal(result.totals.suppliedNetTaxableIncomeMinor, 6_000_999);
  assert.equal(result.totals.roundedNetTaxableIncomeMinor, 6_000_000);
  assert.equal(result.totals.incomeTaxMinor, 225_000);
});

test("Egypt exposes the Article 8 matrix through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/EG" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/EG/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "netTaxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "EG",
      taxYear: "2026",
      facts: { scopeConfirmed: true, netTaxableIncomeMinor: 150_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 38_250_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "eg.eta.income-tax-law-7-2024-article-8"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "eg.eta.income-tax-laws-register"));
});

test("Egypt keeps exemptions, payroll administration and separate regimes outside the engine", () => {
  const coverage = egyptPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("personal exemption")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("payroll withholding")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("small-project")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Egypt rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "EG",
      taxYear: "2025",
      facts: { scopeConfirmed: true, netTaxableIncomeMinor: 60_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "EG",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        netTaxableIncomeMinor: 60_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
