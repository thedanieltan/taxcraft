import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import {
  complexCompositePackages,
  complexCompositePackagesByJurisdiction,
  norwayPackage,
} from "@taxcraft/country-complex-composite";

const engine = createTaxCraft({ countryPackages: [norwayPackage] });

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    standardOrdinaryIncomeRateConfirmed: true,
    salaryNationalInsuranceScheduleConfirmed: true,
    ordinaryIncomeTaxBaseMinor: 60_000_000,
    personalIncomeMinor: 80_000_000,
    salaryIncomeForNationalInsuranceMinor: 80_000_000,
    ...overrides,
  };
}

async function calculate(overrides = {}) {
  const result = await engine.calculate({
    jurisdiction: "NO",
    taxYear: "2026",
    facts: facts(overrides),
  });
  assert.equal(result.status, "ok");
  return result;
}

test("complex-composite registry retains Hong Kong, United States and Norway", () => {
  assert.deepEqual(
    complexCompositePackages.map(({ manifest }) => manifest.jurisdiction),
    ["HK", "US", "NO"],
  );
  assert.equal(complexCompositePackagesByJurisdiction.NO, norwayPackage);
  assert.ok(complexCompositePackages.every(({ manifest }) => manifest.storesUserPII === false));
});

test("Norway exposes a bounded 2026 ordinary-income, bracket-tax and salary-contribution model", () => {
  assert.deepEqual(norwayPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(norwayPackage.manifest.storesUserPII, false);
  assert.equal(norwayPackage.manifest.advisory, false);
  assert.deepEqual(norwayPackage.manifest.pit.taxLayers, {
    national: true,
    subnational: false,
    local: false,
    subdivisionRequired: false,
  });
  assert.equal(norwayPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.ok(norwayPackage.sources.every(({ url }) => (
    url.startsWith("https://www.regjeringen.no/")
    || url.startsWith("https://www.skatteetaten.no/")
  )));
});

test("Norway reproduces every 2026 bracket-tax threshold", async () => {
  const cases = [
    [0, 0],
    [22_610_000, 0],
    [31_830_000, 156_740],
    [72_505_000, 1_783_740],
    [98_010_000, 5_277_925],
    [146_720_000, 13_461_205],
    [160_000_000, 15_825_045],
  ];
  for (const [personalIncomeMinor, expectedBracketTaxMinor] of cases) {
    const result = await calculate({
      ordinaryIncomeTaxBaseMinor: 0,
      personalIncomeMinor,
      salaryIncomeForNationalInsuranceMinor: 0,
    });
    assert.equal(result.totals.bracketTaxMinor, expectedBracketTaxMinor);
  }
});

test("Norway applies the National Insurance lower limit and 25% contribution cap", async () => {
  const cases = [
    [0, 0],
    [9_965_000, 0],
    [10_000_000, 8_750],
    [14_317_500, 1_088_125],
    [14_317_600, 1_088_137],
    [80_000_000, 6_080_000],
  ];
  for (const [salaryIncomeForNationalInsuranceMinor, expectedContributionMinor] of cases) {
    const result = await calculate({
      ordinaryIncomeTaxBaseMinor: 0,
      personalIncomeMinor: 0,
      salaryIncomeForNationalInsuranceMinor,
    });
    assert.equal(result.totals.nationalInsuranceContributionMinor, expectedContributionMinor);
  }
});

test("Norway calculates and reconciles all included 2026 layers", async () => {
  const result = await calculate();
  assert.equal(result.totals.ordinaryIncomeTaxMinor, 13_200_000);
  assert.equal(result.totals.bracketTaxMinor, 2_810_555);
  assert.equal(result.totals.nationalInsuranceContributionMinor, 6_080_000);
  assert.equal(result.totals.incomeTaxMinor, 16_010_555);
  assert.equal(result.totals.totalLiabilityMinor, 22_090_555);
  assert.equal(
    result.lines.reduce((sum, { amountMinor }) => sum + amountMinor, 0),
    result.totals.totalLiabilityMinor,
  );
});

test("Norway is exposed through the catalogue API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/NO" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "COMPLEX_COMPOSITE");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/NO/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "standardOrdinaryIncomeRateConfirmed",
    "salaryNationalInsuranceScheduleConfirmed",
    "ordinaryIncomeTaxBaseMinor",
    "personalIncomeMinor",
    "salaryIncomeForNationalInsuranceMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "NO", taxYear: "2026", facts: facts() },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.totalLiabilityMinor, 22_090_555);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "no.finance-ministry.tax-rates-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "no.skatteetaten.national-insurance-2026"));
});

test("Norway rejects unsupported schedules and identity-bearing facts", async () => {
  const api = createApi();
  const cases = [
    [facts({ standardOrdinaryIncomeRateConfirmed: false }), "facts.const"],
    [facts({ salaryNationalInsuranceScheduleConfirmed: false }), "facts.const"],
    [{ ...facts(), name: "Private Person" }, "facts.pii-field"],
  ];
  for (const [submittedFacts, expectedCode] of cases) {
    const response = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: "NO", taxYear: "2026", facts: submittedFacts },
    });
    assert.equal(response.status, 400);
    assert.ok(response.body.issues.some(({ code }) => code === expectedCode));
  }
});

test("Norway documents excluded derivation, priority-zone and ancillary-tax decisions", () => {
  const coverage = norwayPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("allowance derivation")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("priority zone")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("wealth tax")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("foreign-worker PAYE")));
});
