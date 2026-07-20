import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { guyanaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [guyanaPackage] });

async function calculate(annualChargeableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "GY",
    taxYear: "2026",
    facts: { scopeConfirmed: true, annualChargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Guyana exposes only the evidence-backed 2026 calendar year", () => {
  assert.deepEqual(guyanaPackage.manifest.taxYears, [{
    taxYear: "2026",
    modelVersion: "gy-2026-v1",
    status: "current",
    order: 2026,
  }]);
  assert.equal(guyanaPackage.manifest.storesUserPII, false);
  assert.equal(guyanaPackage.manifest.advisory, false);
  assert.equal(guyanaPackage.manifest.pit.taxYearBasis, "calendar-year");
  assert.equal(guyanaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Guyana applies 25% to the first GYD 3.36 million of chargeable income", async () => {
  const zero = await calculate(0);
  const atThreshold = await calculate(336_000_000);

  assert.equal(zero.totals.incomeTaxMinor, 0);
  assert.equal(atThreshold.totals.incomeTaxMinor, 84_000_000);
  assert.ok(atThreshold.lines.every(({ sourceIds }) =>
    sourceIds.length === 1 && sourceIds[0] === "gy.gra.revised-allowance-rates-2026"));
});

test("Guyana applies 35% to chargeable income above GYD 3.36 million", async () => {
  const result = await calculate(400_000_000);

  assert.equal(result.totals.incomeTaxMinor, 106_400_000);
  assert.ok(result.lines.some(({ label, amountMinor }) =>
    label.startsWith("35%") && amountMinor === 22_400_000));
});

test("Guyana remains deterministic and leaves statutory deduction derivation outside scope", async () => {
  const first = await calculate(543_210_000);
  const second = await calculate(543_210_000);

  assert.deepEqual(first, second);
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("greater of GYD 1,680,000")));
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("National Insurance Scheme")));
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("child, second-job and overtime")));
  assert.ok(first.assumptions.some((entry) => entry.includes("after all legally applicable personal deductions")));
});

test("Guyana is exposed through the global API with the 2026 authority notice", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GY" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GY/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "annualChargeableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GY",
      taxYear: "2026",
      facts: { scopeConfirmed: true, annualChargeableIncomeMinor: 400_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 106_400_000);
  assert.deepEqual(
    calculation.body.sources.map(({ sourceId }) => sourceId),
    ["gy.gra.revised-allowance-rates-2026"],
  );
});

test("Guyana rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GY",
      taxYear: "2025",
      facts: { scopeConfirmed: true, annualChargeableIncomeMinor: 400_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GY",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        annualChargeableIncomeMinor: 400_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
