import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { czechRepublicPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [czechRepublicPackage] });

async function calculate(taxYear, basicTaxpayerCreditSchedule, reducedTaxBaseMinor) {
  const result = await engine.calculate({
    jurisdiction: "CZ",
    taxYear,
    facts: { scopeConfirmed: true, basicTaxpayerCreditSchedule, reducedTaxBaseMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Czech Republic maintains calendar years 2024 through 2026", () => {
  assert.deepEqual(czechRepublicPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024", "2025", "2026"]);
  assert.equal(czechRepublicPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(czechRepublicPackage.manifest.storesUserPII, false);
  assert.equal(czechRepublicPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Czech Republic rounds the annual reduced tax base down to whole hundreds", async () => {
  const result = await calculate("2026", "none", 100_009_999);
  assert.equal(result.totals.reducedTaxBaseMinor, 100_009_999);
  assert.equal(result.totals.roundedTaxBaseMinor, 100_000_000);
  assert.equal(result.totals.grossIncomeTaxMinor, 15_000_000);
});

test("Czech Republic applies year-specific 15% and 23% thresholds and rounds gross tax up", async () => {
  const cases = [
    ["2024", 158_281_200, 23_742_200],
    ["2025", 167_605_200, 25_140_800],
    ["2026", 176_281_200, 26_442_200],
  ];
  for (const [taxYear, thresholdMinor, expectedGrossTaxMinor] of cases) {
    const threshold = await calculate(taxYear, "none", thresholdMinor);
    assert.equal(threshold.totals.grossIncomeTaxBeforeRoundingMinor, expectedGrossTaxMinor - 20);
    assert.equal(threshold.totals.grossIncomeTaxMinor, expectedGrossTaxMinor);

    const above = await calculate(taxYear, "none", thresholdMinor + 10_000);
    assert.equal(above.totals.grossIncomeTaxMinor, expectedGrossTaxMinor + 2_300);
  }
});

test("Czech Republic applies the standard taxpayer credit non-refundably", async () => {
  const lowIncome = await calculate("2026", "standard", 10_000_000);
  assert.equal(lowIncome.totals.grossIncomeTaxMinor, 1_500_000);
  assert.equal(lowIncome.totals.availableBasicTaxpayerCreditMinor, 3_084_000);
  assert.equal(lowIncome.totals.basicTaxpayerCreditAppliedMinor, 1_500_000);
  assert.equal(lowIncome.totals.incomeTaxMinor, 0);

  const standard = await calculate("2026", "standard", 100_000_000);
  assert.equal(standard.totals.grossIncomeTaxMinor, 15_000_000);
  assert.equal(standard.totals.basicTaxpayerCreditAppliedMinor, 3_084_000);
  assert.equal(standard.totals.incomeTaxMinor, 11_916_000);
});

test("Czech Republic is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/CZ" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/CZ/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "basicTaxpayerCreditSchedule",
    "reducedTaxBaseMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "CZ",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        basicTaxpayerCreditSchedule: "standard",
        reducedTaxBaseMinor: 100_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 11_916_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "cz.fs.pit-rates-and-credit-2026"));
});

test("Czech Republic rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "CZ",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        basicTaxpayerCreditSchedule: "standard",
        reducedTaxBaseMinor: 100_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "CZ",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        basicTaxpayerCreditSchedule: "standard",
        reducedTaxBaseMinor: 100_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
