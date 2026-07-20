import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { lesothoPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [lesothoPackage] });

async function calculate(individualTaxSchedule, annualChargeableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "LS",
    taxYear: "2026-27",
    facts: { scopeConfirmed: true, individualTaxSchedule, annualChargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Lesotho exposes only the evidence-backed 2026-27 income year", () => {
  assert.deepEqual(lesothoPackage.manifest.taxYears, [{
    taxYear: "2026-27",
    modelVersion: "ls-2026-27-v1",
    status: "current",
    order: 2027,
  }]);
  assert.equal(lesothoPackage.manifest.storesUserPII, false);
  assert.equal(lesothoPackage.manifest.advisory, false);
  assert.equal(lesothoPackage.manifest.pit.taxYearBasis, "income-year");
  assert.equal(lesothoPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Lesotho resident credit reproduces the effective LSL 61,200 threshold", async () => {
  const below = await calculate("resident", 6_000_000);
  const atThreshold = await calculate("resident", 6_120_000);
  const above = await calculate("resident", 6_120_100);

  assert.equal(below.totals.grossIncomeTaxMinor, 1_200_000);
  assert.equal(below.totals.personalCreditAppliedMinor, 1_200_000);
  assert.equal(below.totals.incomeTaxMinor, 0);

  assert.equal(atThreshold.totals.grossIncomeTaxMinor, 1_224_000);
  assert.equal(atThreshold.totals.personalCreditAppliedMinor, 1_224_000);
  assert.equal(atThreshold.totals.incomeTaxMinor, 0);

  assert.equal(above.totals.grossIncomeTaxMinor, 1_224_020);
  assert.equal(above.totals.personalCreditAppliedMinor, 1_224_000);
  assert.equal(above.totals.incomeTaxMinor, 20);
});

test("Lesotho applies the resident 20% and 30% marginal schedule", async () => {
  const firstBand = await calculate("resident", 7_776_000);
  const secondBand = await calculate("resident", 10_000_000);

  assert.equal(firstBand.totals.grossIncomeTaxMinor, 1_555_200);
  assert.equal(firstBand.totals.availablePersonalCreditMinor, 1_224_000);
  assert.equal(firstBand.totals.incomeTaxMinor, 331_200);

  assert.equal(secondBand.totals.grossIncomeTaxMinor, 2_222_400);
  assert.equal(secondBand.totals.personalCreditAppliedMinor, 1_224_000);
  assert.equal(secondBand.totals.incomeTaxMinor, 998_400);
  assert.ok(secondBand.lines.some(({ label, amountMinor }) =>
    label.startsWith("30%") && amountMinor === 667_200));
});

test("Lesotho applies the non-resident 25% schedule without resident credit", async () => {
  const result = await calculate("non-resident", 10_000_000);

  assert.equal(result.totals.grossIncomeTaxMinor, 2_500_000);
  assert.equal(result.totals.availablePersonalCreditMinor, 0);
  assert.equal(result.totals.personalCreditAppliedMinor, 0);
  assert.equal(result.totals.incomeTaxMinor, 2_500_000);
});

test("Lesotho calculations are deterministic and exclude PAYE period mechanics", async () => {
  const first = await calculate("resident", 12_345_600);
  const second = await calculate("resident", 12_345_600);

  assert.deepEqual(first, second);
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("cumulative PAYE")));
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("fringe-benefit")));
  assert.ok(first.assumptions.some((entry) => entry.includes("after all legally applicable expenses")));
});

test("Lesotho is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LS" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2026-27"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/LS/2026-27/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LS",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualChargeableIncomeMinor: 10_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 998_400);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ls.rsl.income-tax-2026-27"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ls.rsl.tax-table-2026-27"));
});

test("Lesotho rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LS",
      taxYear: "2025-26",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualChargeableIncomeMinor: 10_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "LS",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        individualTaxSchedule: "resident",
        annualChargeableIncomeMinor: 10_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
