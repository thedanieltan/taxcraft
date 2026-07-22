import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { macaoPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [macaoPackage] });

async function calculate(annualProfessionalIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "MO",
    taxYear,
    facts: { scopeConfirmed: true, annualProfessionalIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Macao exposes economic year 2026 without storing PII", () => {
  assert.deepEqual(macaoPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(macaoPackage.manifest.taxYears[0].status, "current");
  assert.equal(macaoPackage.manifest.storesUserPII, false);
  assert.equal(macaoPackage.manifest.advisory, false);
  assert.equal(macaoPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Macao applies the standard exemption, progressive bands and budget deduction", async () => {
  const cases = [
    [0, 0],
    [14_400_000, 0],
    [14_400_100, 100],
    [16_400_000, 98_000],
    [18_400_000, 210_000],
    [22_400_000, 462_000],
    [30_400_000, 1_022_000],
    [42_400_000, 1_946_000],
    [44_400_000, 2_114_000],
  ];
  for (const [annualProfessionalIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(annualProfessionalIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.standardExemptionMinor, 14_400_000);
    assert.equal(result.totals.incomeTaxMinor % 100, 0);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("mo.budget-2026-professional-tax-relief")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("mo.law.professional-tax-article-7")));
  }
});

test("Macao exposes professional tax through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MO" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MO/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "annualProfessionalIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MO",
      taxYear: "2026",
      facts: { scopeConfirmed: true, annualProfessionalIncomeMinor: 44_400_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.grossAssessmentMinor, 3_020_000);
  assert.equal(calculation.body.totals.budgetDeductionCalculatedMinor, 906_000);
  assert.equal(calculation.body.totals.incomeTaxMinor, 2_114_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "mo.dsf.professional-tax-overview"));
});

test("Macao keeps enhanced exemptions and administration outside the calculator", () => {
  const coverage = macaoPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("aged over 65")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("self-employed accounting-profit")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("withholding-period")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Macao rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MO",
      taxYear: "2025",
      facts: { scopeConfirmed: true, annualProfessionalIncomeMinor: 18_400_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MO",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        annualProfessionalIncomeMinor: 18_400_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
