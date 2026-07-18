import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { malaysiaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [malaysiaPackage] });

async function calculate(taxYear, individualRebateSchedule, chargeableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "MY",
    taxYear,
    facts: { scopeConfirmed: true, individualRebateSchedule, chargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Malaysia maintains assessment years 2023 through 2025", () => {
  assert.deepEqual(malaysiaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2023", "2024", "2025"]);
  assert.equal(malaysiaPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(malaysiaPackage.manifest.storesUserPII, false);
  assert.equal(malaysiaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Malaysia applies every resident progressive threshold", async () => {
  const cases = [
    [500_000, 0],
    [2_000_000, 15_000],
    [3_500_000, 60_000],
    [5_000_000, 150_000],
    [7_000_000, 370_000],
    [10_000_000, 940_000],
    [40_000_000, 8_440_000],
    [60_000_000, 13_640_000],
    [200_000_000, 52_840_000],
    [210_000_000, 55_840_000],
  ];
  for (const taxYear of ["2023", "2024", "2025"]) {
    for (const [chargeableIncomeMinor, expectedTaxMinor] of cases) {
      const result = await calculate(taxYear, "none", chargeableIncomeMinor);
      assert.equal(result.totals.grossIncomeTaxMinor, expectedTaxMinor);
      assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    }
  }
});

test("Malaysia applies the RM400 individual rebate non-refundably", async () => {
  const lowIncome = await calculate("2025", "individual", 2_000_000);
  assert.equal(lowIncome.totals.grossIncomeTaxMinor, 15_000);
  assert.equal(lowIncome.totals.availableIndividualRebateMinor, 40_000);
  assert.equal(lowIncome.totals.individualRebateAppliedMinor, 15_000);
  assert.equal(lowIncome.totals.incomeTaxMinor, 0);

  const ceiling = await calculate("2025", "individual", 3_500_000);
  assert.equal(ceiling.totals.grossIncomeTaxMinor, 60_000);
  assert.equal(ceiling.totals.individualRebateAppliedMinor, 40_000);
  assert.equal(ceiling.totals.incomeTaxMinor, 20_000);
});

test("Malaysia rejects an individual rebate above the chargeable-income ceiling", async () => {
  const api = createApi();
  const response = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MY",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        individualRebateSchedule: "individual",
        chargeableIncomeMinor: 3_500_100,
      },
    },
  });
  assert.equal(response.status, 400);
  assert.ok(response.body.issues.some(({ code }) => code === "facts.inconsistent"));
});

test("Malaysia is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MY" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2023", "2024", "2025"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MY/2025/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "individualRebateSchedule",
    "chargeableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MY",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        individualRebateSchedule: "individual",
        chargeableIncomeMinor: 3_500_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 20_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "my.hasil.individual-tax-rates-2023-2025"));
});

test("Malaysia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MY",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        individualRebateSchedule: "none",
        chargeableIncomeMinor: 3_500_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MY",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        individualRebateSchedule: "none",
        chargeableIncomeMinor: 3_500_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
