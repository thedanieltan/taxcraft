import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { greecePackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [greecePackage] });

async function calculate({
  incomeSchedule = "employment-pension",
  ageSchedule = "31-plus",
  dependentChildrenCount = 0,
  taxableIncomeMinor,
}, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "GR",
    taxYear,
    facts: {
      scopeConfirmed: true,
      incomeSchedule,
      ageSchedule,
      dependentChildrenCount,
      taxableIncomeMinor,
    },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Greece exposes only tax year 2026 without storing PII", () => {
  assert.deepEqual(greecePackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(greecePackage.manifest.storesUserPII, false);
  assert.equal(greecePackage.manifest.advisory, false);
  assert.equal(greecePackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Greece applies age-specific first-two-band rates", async () => {
  const standard = await calculate({ taxableIncomeMinor: 2_000_000 });
  assert.equal(standard.totals.grossIncomeTaxMinor, 290_000);
  assert.equal(standard.totals.article16CreditAppliedMinor, 61_700);
  assert.equal(standard.totals.incomeTaxMinor, 228_300);

  const youngAdult = await calculate({ ageSchedule: "26-to-30", taxableIncomeMinor: 2_000_000 });
  assert.equal(youngAdult.totals.firstBandRateBasisPoints, 900);
  assert.equal(youngAdult.totals.secondBandRateBasisPoints, 900);
  assert.equal(youngAdult.totals.grossIncomeTaxMinor, 180_000);
  assert.equal(youngAdult.totals.incomeTaxMinor, 118_300);

  const under26 = await calculate({ ageSchedule: "up-to-25", taxableIncomeMinor: 2_000_000 });
  assert.equal(under26.totals.firstBandRateBasisPoints, 0);
  assert.equal(under26.totals.secondBandRateBasisPoints, 0);
  assert.equal(under26.totals.grossIncomeTaxMinor, 0);
  assert.equal(under26.totals.article16CreditAppliedMinor, 0);
  assert.equal(under26.totals.incomeTaxMinor, 0);
});

test("Greece applies dependent-child rate reductions and credits", async () => {
  const fourChildren = await calculate({ dependentChildrenCount: 4, taxableIncomeMinor: 2_000_000 });
  assert.equal(fourChildren.totals.firstBandRateBasisPoints, 0);
  assert.equal(fourChildren.totals.secondBandRateBasisPoints, 0);
  assert.equal(fourChildren.totals.thirdBandRateBasisPoints, 1_800);
  assert.equal(fourChildren.totals.grossIncomeTaxMinor, 0);
  assert.equal(fourChildren.totals.initialArticle16CreditMinor, 158_000);
  assert.equal(fourChildren.totals.incomeTaxMinor, 0);

  const fiveChildren = await calculate({ dependentChildrenCount: 5, taxableIncomeMinor: 3_000_000 });
  assert.equal(fiveChildren.totals.thirdBandRateBasisPoints, 1_600);
  assert.equal(fiveChildren.totals.grossIncomeTaxMinor, 160_000);
  assert.equal(fiveChildren.totals.initialArticle16CreditMinor, 178_000);
  assert.equal(fiveChildren.totals.article16TaperMinor, 36_000);
  assert.equal(fiveChildren.totals.article16CreditAppliedMinor, 142_000);
  assert.equal(fiveChildren.totals.incomeTaxMinor, 18_000);

  const sixChildren = await calculate({ dependentChildrenCount: 6, taxableIncomeMinor: 3_000_000 });
  assert.equal(sixChildren.totals.thirdBandRateBasisPoints, 1_400);
  assert.equal(sixChildren.totals.initialArticle16CreditMinor, 200_000);
  assert.equal(sixChildren.totals.article16CreditAvailableMinor, 164_000);
  assert.equal(sixChildren.totals.article16CreditAppliedMinor, 140_000);
  assert.equal(sixChildren.totals.incomeTaxMinor, 0);
});

test("Greece applies no article 16 credit to business profits", async () => {
  const result = await calculate({ incomeSchedule: "business-profit", taxableIncomeMinor: 2_000_000 });
  assert.equal(result.totals.grossIncomeTaxMinor, 290_000);
  assert.equal(result.totals.initialArticle16CreditMinor, 0);
  assert.equal(result.totals.article16CreditAvailableMinor, 0);
  assert.equal(result.totals.article16CreditAppliedMinor, 0);
  assert.equal(result.totals.incomeTaxMinor, 290_000);
});

test("Greece exposes its profile schema and calculation through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GR" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/GR/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "incomeSchedule",
    "ageSchedule",
    "dependentChildrenCount",
    "taxableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GR",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        incomeSchedule: "employment-pension",
        ageSchedule: "31-plus",
        dependentChildrenCount: 3,
        taxableIncomeMinor: 2_500_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.grossIncomeTaxMinor, 280_000);
  assert.equal(calculation.body.totals.article16CreditAppliedMinor, 108_000);
  assert.equal(calculation.body.totals.incomeTaxMinor, 172_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "gr.minfin.income-taxation-2026"));
});

test("Greece keeps presumptive income and other schedules outside the engine", () => {
  const coverage = greecePackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("presumptive business income")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("mixed employment")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("property, investment")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("eligibility")));
});

test("Greece rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GR",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        incomeSchedule: "employment-pension",
        ageSchedule: "31-plus",
        dependentChildrenCount: 0,
        taxableIncomeMinor: 2_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "GR",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        incomeSchedule: "employment-pension",
        ageSchedule: "31-plus",
        dependentChildrenCount: 0,
        taxableIncomeMinor: 2_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
