import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { namibiaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [namibiaPackage] });

async function calculate(taxableIncomeMinor, taxYear = "2027") {
  const result = await engine.calculate({
    jurisdiction: "NA",
    taxYear,
    facts: { scopeConfirmed: true, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Namibia maintains assessment years 2025 through 2027 without storing PII", () => {
  assert.deepEqual(namibiaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2025", "2026", "2027"]);
  assert.equal(namibiaPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(namibiaPackage.manifest.storesUserPII, false);
  assert.equal(namibiaPackage.manifest.advisory, false);
  assert.equal(namibiaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Namibia applies every enacted individual normal-tax boundary", async () => {
  const cases = [
    [0, 0],
    [10_000_000, 0],
    [15_000_000, 900_000],
    [35_000_000, 5_900_000],
    [55_000_000, 11_500_000],
    [85_000_000, 20_500_000],
    [155_000_000, 42_900_000],
    [200_000_000, 59_550_000],
  ];
  for (const taxYear of ["2025", "2026", "2027"]) {
    for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
      const result = await calculate(taxableIncomeMinor, taxYear);
      assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
      assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("na.gazette.income-tax-amendment-2024")));
    }
  }
});

test("Namibia is exposed through the global API with the enacted source", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/NA" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2025", "2026", "2027"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/NA/2027/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "NA",
      taxYear: "2027",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 85_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 20_500_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "na.gazette.income-tax-amendment-2024"));
});

test("Namibia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "NA",
      taxYear: "2024",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 10_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "NA",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        taxableIncomeMinor: 10_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
