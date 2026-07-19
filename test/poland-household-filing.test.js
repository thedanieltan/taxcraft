import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { polandPackage } from "@taxcraft/country-household-filing";

const engine = createTaxCraft({ countryPackages: [polandPackage] });

async function calculate(filingSchedule, primaryTaxableIncomeMinor, secondaryTaxableIncomeMinor = 0, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "PL",
    taxYear,
    facts: {
      scopeConfirmed: true,
      filingSchedule,
      primaryTaxableIncomeMinor,
      secondaryTaxableIncomeMinor,
    },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Poland maintains calendar years 2024 through 2026 without storing PII", () => {
  assert.deepEqual(polandPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024", "2025", "2026"]);
  assert.equal(polandPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(polandPackage.manifest.storesUserPII, false);
  assert.equal(polandPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Poland applies the individual 12% and 32% scale with the PLN 3,600 reduction", async () => {
  const taxFree = await calculate("individual", 3_000_000);
  assert.equal(taxFree.totals.incomeTaxMinor, 0);

  const threshold = await calculate("individual", 12_000_000);
  assert.equal(threshold.totals.incomeTaxMinor, 1_080_000);

  const upperBand = await calculate("individual", 13_000_000);
  assert.equal(upperBand.totals.incomeTaxMinor, 1_400_000);
});

test("Poland reproduces the official joint-spouse example", async () => {
  const result = await calculate("joint-spouses", 12_000_000, 10_000_000);
  assert.equal(result.totals.combinedTaxableIncomeMinor, 22_000_000);
  assert.equal(result.totals.quotientFactor, 2);
  assert.equal(result.totals.quotientIncomeMinor, 11_000_000);
  assert.equal(result.totals.unitTaxBeforeMultiplicationMinor, 960_000);
  assert.equal(result.totals.incomeTaxMinor, 1_920_000);
});

test("Poland reproduces the official single-parent example", async () => {
  const result = await calculate("single-parent", 18_000_000);
  assert.equal(result.totals.quotientFactor, 2);
  assert.equal(result.totals.quotientIncomeMinor, 9_000_000);
  assert.equal(result.totals.unitTaxBeforeMultiplicationMinor, 720_000);
  assert.equal(result.totals.incomeTaxMinor, 1_440_000);
});

test("Poland rounds the tax base and final tax to whole zloty half-up", async () => {
  const down = await calculate("individual", 12_000_049);
  assert.equal(down.totals.roundedTaxBaseMinor, 12_000_000);
  assert.equal(down.totals.incomeTaxMinor, 1_080_000);

  const up = await calculate("individual", 12_000_150);
  assert.equal(up.totals.roundedTaxBaseMinor, 12_000_200);
  assert.equal(up.totals.taxBeforeFinalRoundingMinor, 1_080_064);
  assert.equal(up.totals.incomeTaxMinor, 1_080_100);
});

test("Poland rejects secondary income outside joint-spouse filing", async () => {
  const result = await engine.calculate({
    jurisdiction: "PL",
    taxYear: "2026",
    facts: {
      scopeConfirmed: true,
      filingSchedule: "single-parent",
      primaryTaxableIncomeMinor: 18_000_000,
      secondaryTaxableIncomeMinor: 100,
    },
  });
  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some(({ code }) => code === "facts.inconsistent"));
});

test("Poland is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/PL" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "HOUSEHOLD_FILING");
  assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/PL/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "filingSchedule",
    "primaryTaxableIncomeMinor",
    "secondaryTaxableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PL",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "joint-spouses",
        primaryTaxableIncomeMinor: 12_000_000,
        secondaryTaxableIncomeMinor: 10_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 1_920_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "pl.mf.joint-spouse-calculation"));
});

test("Poland rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PL",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "individual",
        primaryTaxableIncomeMinor: 12_000_000,
        secondaryTaxableIncomeMinor: 0,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PL",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "individual",
        primaryTaxableIncomeMinor: 12_000_000,
        secondaryTaxableIncomeMinor: 0,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
