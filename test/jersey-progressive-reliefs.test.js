import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { jerseyPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [jerseyPackage] });

async function calculate(
  liableIncomeAfterDeductionsPounds,
  totalExemptionThresholdPounds = 21_250,
  taxYear = "2026",
) {
  const result = await engine.calculate({
    jurisdiction: "JE",
    taxYear,
    facts: {
      scopeConfirmed: true,
      liableIncomeAfterDeductionsPounds,
      totalExemptionThresholdPounds,
    },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Jersey exposes only year of assessment 2026 without storing PII", () => {
  assert.deepEqual(jerseyPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(jerseyPackage.manifest.taxYears[0].status, "current");
  assert.equal(jerseyPackage.manifest.storesUserPII, false);
  assert.equal(jerseyPackage.manifest.advisory, false);
  assert.equal(jerseyPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Jersey applies the 2026 low-income threshold and marginal calculation", async () => {
  const exempt = await calculate(21_250);
  assert.equal(exempt.totals.standardTaxMinor, 425_000);
  assert.equal(exempt.totals.marginalTaxBasePounds, 0);
  assert.equal(exempt.totals.marginalTaxMinor, 0);
  assert.equal(exempt.totals.incomeTaxMinor, 0);
  assert.equal(exempt.totals.marginalIncomeDeductionMinor, 425_000);

  const marginal = await calculate(25_000);
  assert.equal(marginal.totals.standardTaxMinor, 500_000);
  assert.equal(marginal.totals.marginalTaxBasePounds, 3_750);
  assert.equal(marginal.totals.marginalTaxMinor, 97_500);
  assert.equal(marginal.totals.incomeTaxMinor, 97_500);
  assert.equal(marginal.totals.marginalIncomeDeductionMinor, 402_500);
});

test("Jersey changes to the lower standard calculation at the crossover", async () => {
  const marginalStillLower = await calculate(92_083);
  assert.equal(marginalStillLower.totals.standardTaxMinor, 1_841_660);
  assert.equal(marginalStillLower.totals.marginalTaxMinor, 1_841_658);
  assert.equal(marginalStillLower.totals.incomeTaxMinor, 1_841_658);

  const standardLower = await calculate(92_084);
  assert.equal(standardLower.totals.standardTaxMinor, 1_841_680);
  assert.equal(standardLower.totals.marginalTaxMinor, 1_841_684);
  assert.equal(standardLower.totals.incomeTaxMinor, 1_841_680);
  assert.equal(standardLower.totals.marginalIncomeDeductionMinor, 0);
});

test("Jersey accepts a caller-confirmed threshold containing eligible additions", async () => {
  const result = await calculate(30_000, 25_200);
  assert.equal(result.totals.standardTaxMinor, 600_000);
  assert.equal(result.totals.marginalTaxBasePounds, 4_800);
  assert.equal(result.totals.marginalTaxMinor, 124_800);
  assert.equal(result.totals.incomeTaxMinor, 124_800);
});

test("Jersey exposes the standard and marginal calculation through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/JE" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/JE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "liableIncomeAfterDeductionsPounds",
    "totalExemptionThresholdPounds",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        liableIncomeAfterDeductionsPounds: 25_000,
        totalExemptionThresholdPounds: 21_250,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 97_500);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "je.revenue.tax-allowances-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "je.revenue.marginal-income-deduction"));
});

test("Jersey keeps relief eligibility, LTC and ITIS outside the engine", () => {
  const coverage = jerseyPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("eligibility for child")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("long-term care")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("ITIS")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Jersey rejects unsupported years, sub-threshold inputs and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JE",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        liableIncomeAfterDeductionsPounds: 25_000,
        totalExemptionThresholdPounds: 21_250,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const lowThreshold = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        liableIncomeAfterDeductionsPounds: 25_000,
        totalExemptionThresholdPounds: 21_249,
      },
    },
  });
  assert.equal(lowThreshold.status, 400);

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "JE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        liableIncomeAfterDeductionsPounds: 25_000,
        totalExemptionThresholdPounds: 21_250,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
