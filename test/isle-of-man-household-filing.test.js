import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { isleOfManPackage } from "@taxcraft/country-household-filing";

const engine = createTaxCraft({ countryPackages: [isleOfManPackage] });

async function calculate({
  filingSchedule,
  assessableIncomePounds,
  totalIncomeForAllowanceTaperPounds = assessableIncomePounds,
  additionalAllowancesPounds = 0,
  taxYear = "2026-27",
}) {
  const result = await engine.calculate({
    jurisdiction: "IM",
    taxYear,
    facts: {
      scopeConfirmed: true,
      filingSchedule,
      assessableIncomePounds,
      totalIncomeForAllowanceTaperPounds,
      additionalAllowancesPounds,
    },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Isle of Man exposes only tax year 2026-27 without storing PII", () => {
  assert.deepEqual(isleOfManPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026-27"]);
  assert.equal(isleOfManPackage.manifest.taxYears[0].status, "current");
  assert.equal(isleOfManPackage.manifest.storesUserPII, false);
  assert.equal(isleOfManPackage.manifest.advisory, false);
  assert.equal(isleOfManPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Isle of Man applies the 2026-27 individual allowance and bands", async () => {
  const exempt = await calculate({ filingSchedule: "individual", assessableIncomePounds: 17_000 });
  assert.equal(exempt.totals.personalAllowancePounds, 17_000);
  assert.equal(exempt.totals.taxableIncomePounds, 0);
  assert.equal(exempt.totals.incomeTaxMinor, 0);

  const standardBand = await calculate({ filingSchedule: "individual", assessableIncomePounds: 23_500 });
  assert.equal(standardBand.totals.taxableIncomePounds, 6_500);
  assert.equal(standardBand.totals.standardRateTaxMinor, 65_000);
  assert.equal(standardBand.totals.higherRateTaxMinor, 0);
  assert.equal(standardBand.totals.incomeTaxMinor, 65_000);

  const higherBand = await calculate({ filingSchedule: "individual", assessableIncomePounds: 25_000 });
  assert.equal(higherBand.totals.taxableIncomePounds, 8_000);
  assert.equal(higherBand.totals.standardRateTaxMinor, 65_000);
  assert.equal(higherBand.totals.higherRateTaxMinor, 31_500);
  assert.equal(higherBand.totals.incomeTaxMinor, 96_500);
});

test("Isle of Man applies the personal-allowance taper in whole pounds", async () => {
  const oddExcess = await calculate({
    filingSchedule: "individual",
    assessableIncomePounds: 100_001,
    totalIncomeForAllowanceTaperPounds: 100_001,
  });
  assert.equal(oddExcess.totals.personalAllowanceReductionPounds, 0);
  assert.equal(oddExcess.totals.personalAllowancePounds, 17_000);

  const firstReduction = await calculate({
    filingSchedule: "individual",
    assessableIncomePounds: 100_002,
    totalIncomeForAllowanceTaperPounds: 100_002,
  });
  assert.equal(firstReduction.totals.personalAllowanceReductionPounds, 1);
  assert.equal(firstReduction.totals.personalAllowancePounds, 16_999);

  const exhausted = await calculate({
    filingSchedule: "individual",
    assessableIncomePounds: 134_000,
    totalIncomeForAllowanceTaperPounds: 134_000,
  });
  assert.equal(exhausted.totals.personalAllowanceReductionPounds, 17_000);
  assert.equal(exhausted.totals.personalAllowancePounds, 0);
  assert.equal(exhausted.totals.standardRateTaxMinor, 65_000);
  assert.equal(exhausted.totals.higherRateTaxMinor, 2_677_500);
  assert.equal(exhausted.totals.incomeTaxMinor, 2_742_500);
});

test("Isle of Man applies the joint allowance, taper threshold and standard band", async () => {
  const standardBand = await calculate({ filingSchedule: "joint", assessableIncomePounds: 47_000 });
  assert.equal(standardBand.totals.basePersonalAllowancePounds, 34_000);
  assert.equal(standardBand.totals.taxableIncomePounds, 13_000);
  assert.equal(standardBand.totals.incomeTaxMinor, 130_000);

  const higherBand = await calculate({ filingSchedule: "joint", assessableIncomePounds: 50_000 });
  assert.equal(higherBand.totals.standardRateTaxMinor, 130_000);
  assert.equal(higherBand.totals.higherRateTaxMinor, 63_000);
  assert.equal(higherBand.totals.incomeTaxMinor, 193_000);

  const firstReduction = await calculate({
    filingSchedule: "joint",
    assessableIncomePounds: 200_002,
    totalIncomeForAllowanceTaperPounds: 200_002,
  });
  assert.equal(firstReduction.totals.personalAllowanceReductionPounds, 1);
  assert.equal(firstReduction.totals.personalAllowancePounds, 33_999);
});

test("Isle of Man accepts caller-confirmed additional allowances", async () => {
  const result = await calculate({
    filingSchedule: "individual",
    assessableIncomePounds: 30_000,
    additionalAllowancesPounds: 6_400,
  });
  assert.equal(result.totals.personalAllowancePounds, 17_000);
  assert.equal(result.totals.totalAllowancesPounds, 23_400);
  assert.equal(result.totals.taxableIncomePounds, 6_600);
  assert.equal(result.totals.standardRateTaxMinor, 65_000);
  assert.equal(result.totals.higherRateTaxMinor, 2_100);
  assert.equal(result.totals.incomeTaxMinor, 67_100);
});

test("Isle of Man exposes resident schedules through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/IM" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "HOUSEHOLD_FILING");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026-27"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/IM/2026-27/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "filingSchedule",
    "assessableIncomePounds",
    "totalIncomeForAllowanceTaperPounds",
    "additionalAllowancesPounds",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "IM",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "individual",
        assessableIncomePounds: 25_000,
        totalIncomeForAllowanceTaperPounds: 25_000,
        additionalAllowancesPounds: 0,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 96_500);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "im.gov.rates-and-allowances-2026-27"));
});

test("Isle of Man keeps cap elections, non-resident tax and NI outside the engine", () => {
  const coverage = isleOfManPackage.coverage("2026-27");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("tax cap")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("non-resident")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("National Insurance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("eligibility")));
});

test("Isle of Man rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "IM",
      taxYear: "2025-26",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "individual",
        assessableIncomePounds: 25_000,
        totalIncomeForAllowanceTaperPounds: 25_000,
        additionalAllowancesPounds: 0,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "IM",
      taxYear: "2026-27",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "joint",
        assessableIncomePounds: 50_000,
        totalIncomeForAllowanceTaperPounds: 50_000,
        additionalAllowancesPounds: 0,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
