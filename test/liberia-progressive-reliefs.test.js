import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { liberiaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [liberiaPackage] });

async function calculate(annualGrossTaxableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "LR",
    taxYear: "2026",
    facts: { scopeConfirmed: true, annualGrossTaxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Liberia exposes only the evidence-backed 2026 calendar year", () => {
  assert.deepEqual(liberiaPackage.manifest.taxYears, [{
    taxYear: "2026",
    modelVersion: "lr-2026-v1",
    status: "current",
    order: 2026,
  }]);
  assert.equal(liberiaPackage.manifest.storesUserPII, false);
  assert.equal(liberiaPackage.manifest.advisory, false);
  assert.equal(liberiaPackage.manifest.pit.taxYearBasis, "calendar-year");
  assert.equal(liberiaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Liberia applies every employee PIT boundary", async () => {
  const cases = [
    [7_000_000, 0],
    [20_000_000, 650_000],
    [80_000_000, 9_650_000],
    [100_000_000, 14_650_000],
  ];
  for (const [annualGrossTaxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(annualGrossTaxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) =>
      sourceIds.length === 1 && sourceIds[0] === "lr.lra.employee-pit-table"));
  }
});

test("Liberia preserves the published fixed-tax transition amounts", async () => {
  const aboveSecondThreshold = await calculate(20_000_100);
  const aboveThirdThreshold = await calculate(80_000_100);

  assert.equal(aboveSecondThreshold.totals.incomeTaxMinor, 650_015);
  assert.equal(aboveThirdThreshold.totals.incomeTaxMinor, 9_650_025);
});

test("Liberia remains deterministic and excludes contractor and benefit derivation", async () => {
  const first = await calculate(45_678_900);
  const second = await calculate(45_678_900);

  assert.deepEqual(first, second);
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("LRD 100,000 exemption")));
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("contractor payments")));
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("monthly payroll withholding")));
  assert.ok(first.assumptions.some((entry) => entry.includes("after applying any legally available exemption")));
});

test("Liberia is exposed through the global API with the employee PIT source", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LR" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LR/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "annualGrossTaxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LR",
      taxYear: "2026",
      facts: { scopeConfirmed: true, annualGrossTaxableIncomeMinor: 100_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 14_650_000);
  assert.deepEqual(
    calculation.body.sources.map(({ sourceId }) => sourceId),
    ["lr.lra.employee-pit-table"],
  );
});

test("Liberia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LR",
      taxYear: "2025",
      facts: { scopeConfirmed: true, annualGrossTaxableIncomeMinor: 100_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LR",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        annualGrossTaxableIncomeMinor: 100_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
