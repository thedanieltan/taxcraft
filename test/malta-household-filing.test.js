import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { maltaPackage } from "@taxcraft/country-household-filing";

const engine = createTaxCraft({ countryPackages: [maltaPackage] });

async function calculate(filingSchedule, chargeableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "MT",
    taxYear,
    facts: { scopeConfirmed: true, filingSchedule, chargeableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Malta exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(maltaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(maltaPackage.manifest.taxYears[0].status, "current");
  assert.equal(maltaPackage.manifest.storesUserPII, false);
  assert.equal(maltaPackage.manifest.advisory, false);
  assert.equal(maltaPackage.manifest.pit.taxUnit, "household-or-filing-status");
  assert.equal(maltaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Malta applies every 2026 filing schedule at its statutory boundaries", async () => {
  const cases = [
    ["single", 1_200_000, 0, 1_600_000, 60_000, 6_000_000, 1_160_000, 10_000_000, 2_560_000],
    ["married", 1_500_000, 0, 2_300_000, 120_000, 6_000_000, 1_045_000, 10_000_000, 2_445_000],
    ["married-one-child", 1_750_000, 0, 2_650_000, 135_000, 6_000_000, 972_500, 10_000_000, 2_372_500],
    ["married-two-or-more-children", 2_250_000, 0, 3_200_000, 142_500, 6_000_000, 842_500, 10_000_000, 2_242_500],
    ["parent", 1_300_000, 0, 1_750_000, 67_500, 6_000_000, 1_130_000, 10_000_000, 2_530_000],
    ["parent-one-child", 1_450_000, 0, 2_100_000, 97_500, 6_000_000, 1_072_500, 10_000_000, 2_472_500],
    ["parent-two-or-more-children", 1_850_000, 0, 2_550_000, 105_000, 6_000_000, 967_500, 10_000_000, 2_367_500],
  ];
  for (const [schedule, zeroThreshold, zeroTax, secondThreshold, secondTax, thirdThreshold, thirdTax, topIncome, topTax] of cases) {
    assert.equal((await calculate(schedule, zeroThreshold)).totals.incomeTaxMinor, zeroTax);
    assert.equal((await calculate(schedule, secondThreshold)).totals.incomeTaxMinor, secondTax);
    assert.equal((await calculate(schedule, thirdThreshold)).totals.incomeTaxMinor, thirdTax);
    const top = await calculate(schedule, topIncome);
    assert.equal(top.totals.incomeTaxMinor, topTax);
    assert.ok(top.lines.every(({ sourceIds }) => sourceIds.includes("mt.mtca.individual-tax-rates-2026")));
  }
});

test("Malta is exposed through the global API with its seven schedules", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MT" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "HOUSEHOLD_FILING");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/MT/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "filingSchedule", "chargeableIncomeMinor"]);
  assert.equal(schema.body.factsSchema.properties.filingSchedule.enum.length, 7);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MT",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "married-two-or-more-children",
        chargeableIncomeMinor: 6_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 842_500);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "mt.mtca.individual-tax-rates-2026"));
});

test("Malta rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MT",
      taxYear: "2025",
      facts: { scopeConfirmed: true, filingSchedule: "single", chargeableIncomeMinor: 1_200_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "MT",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "parent-one-child",
        chargeableIncomeMinor: 2_100_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
