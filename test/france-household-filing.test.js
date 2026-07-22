import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { francePackage } from "@taxcraft/country-household-filing";

const engine = createTaxCraft({ countryPackages: [francePackage] });

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    filingSchedule: "single",
    territorySchedule: "metropolitan",
    standardQuotientCapConfirmed: true,
    quotientHalfParts: 2,
    taxableIncomeMinor: 0,
    ...overrides,
  };
}

async function calculate(inputFacts, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "FR",
    taxYear,
    facts: inputFacts,
  });
  assert.equal(result.status, "ok");
  return result;
}

test("France exposes only the 2026 assessment without storing PII", () => {
  assert.deepEqual(francePackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(francePackage.manifest.taxYears[0].status, "current");
  assert.equal(francePackage.manifest.storesUserPII, false);
  assert.equal(francePackage.manifest.advisory, false);
  assert.equal(francePackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("France applies the Article 197 scale and decote for a single taxpayer", async () => {
  const exempt = await calculate(facts({ taxableIncomeMinor: 1_000_000 }));
  assert.equal(exempt.totals.incomeTaxMinor, 0);

  const result = await calculate(facts({ taxableIncomeMinor: 2_000_000 }));
  assert.equal(result.totals.grossTaxWithActualPartsMinor, 92_400);
  assert.equal(result.totals.availableDecoteMinor, 47_900);
  assert.equal(result.totals.decoteAppliedMinor, 47_900);
  assert.equal(result.totals.incomeTaxMinor, 44_500);
  assert.ok(result.lines.some(({ ruleId }) => ruleId.endsWith(".single.decote")));
});

test("France reproduces the official five-part quotient-cap example", async () => {
  const result = await calculate(facts({
    filingSchedule: "joint",
    quotientHalfParts: 10,
    taxableIncomeMinor: 13_000_000,
  }));
  assert.equal(result.totals.grossTaxWithActualPartsMinor, 792_000);
  assert.equal(result.totals.grossTaxWithBaselinePartsMinor, 2_520_800);
  assert.equal(result.totals.availableGeneralQuotientCapMinor, 1_084_200);
  assert.equal(result.totals.quotientCapAdjustmentMinor, 644_600);
  assert.equal(result.totals.taxAfterQuotientCapMinor, 1_436_600);
  assert.equal(result.totals.incomeTaxMinor, 1_436_600);
  assert.ok(result.lines.some(({ ruleId }) => ruleId.endsWith(".general-quotient-cap")));
});

test("France applies the overseas-department reductions after the quotient cap", async () => {
  const common = {
    filingSchedule: "joint",
    quotientHalfParts: 6,
    taxableIncomeMinor: 20_000_000,
  };
  const antilles = await calculate(facts({
    ...common,
    territorySchedule: "guadeloupe-martinique-reunion",
  }));
  assert.equal(antilles.totals.taxAfterQuotientCapMinor, 4_598_700);
  assert.equal(antilles.totals.territorialReductionMinor, 245_000);
  assert.equal(antilles.totals.incomeTaxMinor, 4_353_700);

  const guyane = await calculate(facts({
    ...common,
    territorySchedule: "guyane-mayotte",
  }));
  assert.equal(guyane.totals.taxAfterQuotientCapMinor, 4_598_700);
  assert.equal(guyane.totals.territorialReductionMinor, 405_000);
  assert.equal(guyane.totals.incomeTaxMinor, 4_193_700);
});

test("France rounds taxable income and gross tax to whole euro", async () => {
  const below = await calculate(facts({ taxableIncomeMinor: 2_000_049 }));
  const above = await calculate(facts({ taxableIncomeMinor: 2_000_050 }));
  assert.equal(below.totals.roundedTaxableIncomeMinor, 2_000_000);
  assert.equal(above.totals.roundedTaxableIncomeMinor, 2_000_100);
  assert.equal(below.totals.grossTaxWithActualPartsMinor, 92_400);
  assert.equal(above.totals.grossTaxWithActualPartsMinor, 92_400);
});

test("France exposes the household quotient calculator through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/FR" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "HOUSEHOLD_FILING");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/FR/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "filingSchedule",
    "territorySchedule",
    "standardQuotientCapConfirmed",
    "quotientHalfParts",
    "taxableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "FR",
      taxYear: "2026",
      facts: facts({ taxableIncomeMinor: 2_000_000 }),
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 44_500);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "fr.legifrance.cgi-article-197-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "fr.bofip.quotient-cap-2026"));
});

test("France keeps special quotient rules, credits and non-resident minima outside scope", () => {
  const coverage = francePackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("quarter-parts")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("special quotient-family")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("tax credits")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("non-resident minimum")));
});

test("France rejects inconsistent half-parts, unsupported years and identity fields", async () => {
  const api = createApi();
  const inconsistent = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "FR",
      taxYear: "2026",
      facts: facts({ filingSchedule: "joint", quotientHalfParts: 2 }),
    },
  });
  assert.equal(inconsistent.status, 400);
  assert.ok(inconsistent.body.issues.some(({ code }) => code === "facts.inconsistent"));

  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "FR",
      taxYear: "2025",
      facts: facts({ taxableIncomeMinor: 2_000_000 }),
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "FR",
      taxYear: "2026",
      facts: { ...facts({ taxableIncomeMinor: 2_000_000 }), name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
