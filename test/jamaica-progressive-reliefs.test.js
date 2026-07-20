import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { jamaicaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [jamaicaPackage] });

async function calculate(exemptionSchedule, aggregateIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "JM",
    taxYear: "2026",
    facts: { scopeConfirmed: true, exemptionSchedule, aggregateIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Jamaica exposes only the evidence-backed 2026 calendar year", () => {
  assert.deepEqual(jamaicaPackage.manifest.taxYears, [{
    taxYear: "2026",
    modelVersion: "jm-2026-v1",
    status: "current",
    order: 2026,
  }]);
  assert.equal(jamaicaPackage.manifest.storesUserPII, false);
  assert.equal(jamaicaPackage.manifest.advisory, false);
  assert.equal(jamaicaPackage.manifest.pit.taxYearBasis, "calendar-year");
  assert.equal(jamaicaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Jamaica applies the effective 2026 standard threshold", async () => {
  const atThreshold = await calculate("standard", 187_661_400);
  const oneDollarAbove = await calculate("standard", 187_661_500);

  assert.equal(atThreshold.totals.applicableThresholdMinor, 187_661_400);
  assert.equal(atThreshold.totals.incomeTaxMinor, 0);
  assert.equal(oneDollarAbove.totals.incomeTaxMinor, 25);
});

test("Jamaica applies 25% through JMD 6 million and 30% above it", async () => {
  const atHighRateThreshold = await calculate("standard", 600_000_000);
  const aboveHighRateThreshold = await calculate("standard", 700_000_000);

  assert.equal(atHighRateThreshold.totals.incomeTaxMinor, 103_084_650);
  assert.equal(aboveHighRateThreshold.totals.incomeTaxMinor, 133_084_650);
  assert.ok(aboveHighRateThreshold.lines.some(({ label, amountMinor }) =>
    label.startsWith("30%") && amountMinor === 30_000_000));
});

test("Jamaica applies the pensioner and golden-age exemption schedules", async () => {
  for (const exemptionSchedule of ["pensioner", "golden-age"]) {
    const atThreshold = await calculate(exemptionSchedule, 212_665_400);
    const aboveThreshold = await calculate(exemptionSchedule, 212_665_800);
    assert.equal(atThreshold.totals.applicableThresholdMinor, 212_665_400);
    assert.equal(atThreshold.totals.incomeTaxMinor, 0);
    assert.equal(aboveThreshold.totals.incomeTaxMinor, 100);
  }
});

test("Jamaica preserves the expressly published combined threshold", async () => {
  const atThreshold = await calculate("pensioner-and-golden-age", 237_665_400);
  const aboveThreshold = await calculate("pensioner-and-golden-age", 237_665_800);

  assert.equal(atThreshold.totals.applicableThresholdMinor, 237_665_400);
  assert.equal(atThreshold.totals.incomeTaxMinor, 0);
  assert.equal(aboveThreshold.totals.incomeTaxMinor, 100);
  assert.ok(atThreshold.assumptions.some((entry) => entry.includes("expressly published JMD 2,376,654")));
});

test("Jamaica remains deterministic and keeps payroll contributions outside scope", async () => {
  const first = await calculate("standard", 345_678_900);
  const second = await calculate("standard", 345_678_900);

  assert.deepEqual(first, second);
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("National Insurance Scheme")));
  assert.ok(first.coverage.unsupported.some((entry) => entry.includes("PAYE periodic")));
});

test("Jamaica is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/JM" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/JM/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "exemptionSchedule", "aggregateIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JM",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        exemptionSchedule: "standard",
        aggregateIncomeMinor: 700_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 133_084_650);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "jm.taj.threshold-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "jm.jis.individual-rates"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "jm.mof.revenue-measures-2026-27"));
});

test("Jamaica rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JM",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        exemptionSchedule: "standard",
        aggregateIncomeMinor: 300_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JM",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        exemptionSchedule: "standard",
        aggregateIncomeMinor: 300_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
