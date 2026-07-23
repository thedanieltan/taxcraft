import assert from "node:assert/strict";
import test from "node:test";

import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { luxembourgPackage } from "@taxcraft/country-household-filing";

const engine = createTaxCraft({ countryPackages: [luxembourgPackage] });

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    taxClass: "1",
    adjustedTaxableIncomeMinor: 5_000_000,
    ...overrides,
  };
}

async function calculate(overrides = {}) {
  const result = await engine.calculate({
    jurisdiction: "LU",
    taxYear: "2026",
    facts: facts(overrides),
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Luxembourg exposes a non-PII resident tax-class model", () => {
  assert.deepEqual(luxembourgPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(luxembourgPackage.manifest.storesUserPII, false);
  assert.equal(luxembourgPackage.manifest.advisory, false);
  assert.equal(luxembourgPackage.manifest.pit.taxUnit, "household-or-filing-status");
  assert.deepEqual(luxembourgPackage.manifest.pit.taxLayers, {
    national: true,
    subnational: false,
    local: false,
    subdivisionRequired: false,
  });
  assert.equal(luxembourgPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Luxembourg calculates the Article 118 class 1 tariff and employment-fund contribution", async () => {
  const result = await calculate();
  assert.equal(result.totals.adjustedTaxableIncomeUsedMinor, 5_000_000);
  assert.equal(result.totals.incomeTaxMinor, 734_100);
  assert.equal(result.totals.employmentFundRateBasisPoints, 700);
  assert.equal(result.totals.employmentFundContributionMinor, 51_387);
  assert.equal(result.totals.totalIncomeTaxMinor, 785_487);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountMinor, 0), result.totals.totalIncomeTaxMinor);

  const high = await calculate({ adjustedTaxableIncomeMinor: 15_000_000 });
  assert.equal(high.totals.incomeTaxMinor, 4_659_000);
  assert.equal(high.totals.employmentFundRateBasisPoints, 700);
});

test("Luxembourg applies the Article 120bis class 1a transformation and marginal-rate cap", async () => {
  const transformed = await calculate({ taxClass: "1a" });
  assert.equal(transformed.totals.incomeTaxMinor, 497_000);
  assert.equal(transformed.totals.employmentFundContributionMinor, 34_790);
  assert.equal(transformed.totals.totalIncomeTaxMinor, 531_790);

  const beforeCap = await calculate({ taxClass: "1a", adjustedTaxableIncomeMinor: 5_180_000 });
  assert.equal(beforeCap.totals.incomeTaxMinor, 564_500);

  const afterCap = await calculate({ taxClass: "1a", adjustedTaxableIncomeMinor: 5_185_000 });
  assert.equal(afterCap.totals.incomeTaxMinor, 566_400);
});

test("Luxembourg applies the Article 121 class 2 splitting procedure", async () => {
  const result = await calculate({ taxClass: "2", adjustedTaxableIncomeMinor: 10_000_000 });
  assert.equal(result.totals.incomeTaxMinor, 1_468_200);
  assert.equal(result.totals.employmentFundContributionMinor, 102_774);
  assert.equal(result.totals.totalIncomeTaxMinor, 1_570_974);
});

test("Luxembourg floors adjusted taxable income to EUR 50 and enforces the EUR 12 minimum tax", async () => {
  const rounded = await calculate({ adjustedTaxableIncomeMinor: 5_004_999 });
  assert.equal(rounded.totals.adjustedTaxableIncomeUsedMinor, 5_000_000);
  assert.equal(rounded.totals.incomeTaxMinor, 734_100);

  const belowMinimum = await calculate({ adjustedTaxableIncomeMinor: 1_325_000 });
  assert.equal(belowMinimum.totals.tariffTaxRoundedMinor, 100);
  assert.equal(belowMinimum.totals.incomeTaxMinor, 0);
  assert.equal(belowMinimum.totals.totalIncomeTaxMinor, 0);

  const collected = await calculate({ adjustedTaxableIncomeMinor: 1_340_000 });
  assert.equal(collected.totals.incomeTaxMinor, 1_300);
  assert.equal(collected.totals.employmentFundContributionMinor, 91);
  assert.equal(collected.totals.totalIncomeTaxMinor, 1_391);
});

test("Luxembourg switches the employment-fund contribution to 9% above the statutory thresholds", async () => {
  const class1 = await calculate({ adjustedTaxableIncomeMinor: 15_005_000 });
  assert.equal(class1.totals.incomeTaxMinor, 4_661_000);
  assert.equal(class1.totals.employmentFundRateBasisPoints, 900);
  assert.equal(class1.totals.employmentFundContributionMinor, 419_490);

  const class2AtThreshold = await calculate({ taxClass: "2", adjustedTaxableIncomeMinor: 30_000_000 });
  assert.equal(class2AtThreshold.totals.incomeTaxMinor, 9_318_000);
  assert.equal(class2AtThreshold.totals.employmentFundRateBasisPoints, 700);
  assert.equal(class2AtThreshold.totals.employmentFundContributionMinor, 652_260);

  const class2AboveThreshold = await calculate({ taxClass: "2", adjustedTaxableIncomeMinor: 30_005_000 });
  assert.equal(class2AboveThreshold.totals.incomeTaxMinor, 9_320_000);
  assert.equal(class2AboveThreshold.totals.employmentFundRateBasisPoints, 900);
  assert.equal(class2AboveThreshold.totals.employmentFundContributionMinor, 838_800);
});

test("Luxembourg is exposed through the catalogue API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LU" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "HOUSEHOLD_FILING");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "LU", taxYear: "2026", facts: facts() },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.totalIncomeTaxMinor, 785_487);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "lu.acd.lir-2026-articles-118-126"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "lu.acd.employment-fund-contribution"));
});

test("Luxembourg rejects unsupported classes and identity-bearing facts", async () => {
  const api = createApi();
  const cases = [
    [facts({ taxClass: "3" }), "facts.enum"],
    [{ ...facts(), name: "Private Person" }, "facts.pii-field"],
  ];
  for (const [submittedFacts, expectedCode] of cases) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: "LU", taxYear: "2026", facts: submittedFacts },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ code }) => code === expectedCode));
  }
});

test("Luxembourg documents excluded derivation, credits and non-resident calculations", () => {
  const coverage = luxembourgPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("adjusted-taxable-income derivation")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("single-parent credit")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("non-resident")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("social-security")));
});
