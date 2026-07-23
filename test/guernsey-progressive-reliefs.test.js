import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { guernseyPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [guernseyPackage] });

async function calculate(chargeableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "GG",
    taxYear,
    facts: { scopeConfirmed: true, chargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Guernsey exposes only Year of Charge 2026 without storing PII", () => {
  assert.deepEqual(guernseyPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(guernseyPackage.manifest.taxYears[0].status, "current");
  assert.equal(guernseyPackage.manifest.storesUserPII, false);
  assert.equal(guernseyPackage.manifest.advisory, false);
  assert.equal(guernseyPackage.manifest.pit.taxYearBasis, "year-of-charge");
  assert.equal(guernseyPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Guernsey applies the enacted 22% individual standard rate", async () => {
  const cases = [
    [0, 0],
    [5, 1],
    [100_000, 22_000],
    [10_000_000, 2_200_000],
  ];
  for (const [chargeableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(chargeableIncomeMinor);
    assert.equal(result.totals.chargeableIncomeMinor, chargeableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.lines[0].ruleId, "gg.pit.2026.individual-standard-rate");
    assert.ok(result.lines[0].sourceIds.includes("gg.states.standard-rate-2025-2026"));
  }
});

test("Guernsey exposes the standard-rate calculation through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GG" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GG/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "chargeableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GG",
      taxYear: "2026",
      facts: { scopeConfirmed: true, chargeableIncomeMinor: 10_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 2_200_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "gg.states.standard-rate-2025-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "gg.states.allowances-year-of-charge-2026"));
});

test("Guernsey keeps allowances, standard charge and tax caps outside the rate engine", () => {
  const coverage = guernseyPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("allowance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("standard-charge")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("tax caps")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("social-insurance")));
});

test("Guernsey rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GG",
      taxYear: "2025",
      facts: { scopeConfirmed: true, chargeableIncomeMinor: 100_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GG",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        chargeableIncomeMinor: 100_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
