import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackagesByJurisdiction } from "@taxcraft/country-simple-progressive";

const thailandPackage = simpleProgressivePackagesByJurisdiction.TH;
const engine = createTaxCraft({ countryPackages: [thailandPackage] });

async function calculate(taxYear, taxableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "TH",
    taxYear,
    facts: { scopeConfirmed: true, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Thailand maintains calendar years 2024 through 2026", () => {
  assert.deepEqual(thailandPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024", "2025", "2026"]);
  assert.equal(thailandPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(thailandPackage.manifest.storesUserPII, false);
  assert.equal(thailandPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Thailand applies every ordinary progressive threshold", async () => {
  const cases = [
    [15_000_000, 0],
    [30_000_000, 750_000],
    [50_000_000, 2_750_000],
    [75_000_000, 6_500_000],
    [100_000_000, 11_500_000],
    [200_000_000, 36_500_000],
    [400_000_000, 96_500_000],
    [500_000_000, 131_500_000],
  ];
  for (const taxYear of ["2024", "2025", "2026"]) {
    for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
      const result = await calculate(taxYear, taxableIncomeMinor);
      assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    }
  }
});

test("Thailand exposes ordinary-schedule scope and official sources through the API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/TH" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "SIMPLE_PROGRESSIVE");
  assert.equal(detail.body.calculator.available, true);
  assert.ok(detail.body.calculator.pit.factsSchema.properties.scopeConfirmed.description.includes("minimum-tax"));

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TH",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 500_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 131_500_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "th.rd.personal-income-tax-rates"));
  assert.ok(calculation.body.coverage.unsupported.some((item) => item.includes("0.5% minimum-tax")));
});

test("Thailand rejects unsupported years and identity-bearing facts", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TH",
      taxYear: "2027",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 50_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TH",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        taxableIncomeMinor: 50_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
