import assert from "node:assert/strict";
import test from "node:test";

import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { netherlandsPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [netherlandsPackage] });

async function calculate(facts) {
  const result = await engine.calculate({ jurisdiction: "NL", taxYear: "2026", facts });
  assert.equal(result.status, "ok");
  return result;
}

function facts(overrides = {}) {
  return {
    scopeConfirmed: true,
    ageSchedule: "below-aow-all-year",
    box1TaxableIncomeMinor: 0,
    aggregateIncomeForGeneralCreditMinor: 0,
    employmentIncomeForEmploymentCreditMinor: 0,
    ...overrides,
  };
}

test("Netherlands package is non-advisory, non-PII and current for 2026", () => {
  assert.equal(netherlandsPackage.manifest.jurisdiction, "NL");
  assert.equal(netherlandsPackage.manifest.storesUserPII, false);
  assert.equal(netherlandsPackage.manifest.advisory, false);
  assert.deepEqual(netherlandsPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(netherlandsPackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.ok(netherlandsPackage.sources.every(({ url }) => url.startsWith("https://www.belastingdienst.nl/")));
});

test("Netherlands reproduces the published EUR 80,000 Box 1 gross-tax example", async () => {
  const result = await calculate(facts({
    box1TaxableIncomeMinor: 8_000_000,
    aggregateIncomeForGeneralCreditMinor: 8_000_000,
    employmentIncomeForEmploymentCreditMinor: 8_000_000,
  }));
  assert.equal(result.totals.grossBox1TaxMinor, 2_953_100);
  assert.equal(result.totals.availableGeneralCreditMinor, 0);
  assert.equal(result.totals.availableEmploymentCreditMinor, 344_500);
  assert.equal(result.totals.incomeTaxMinor, 2_608_600);
  assert.deepEqual(result.lines.slice(0, 3).map(({ amountMinor }) => amountMinor), [1_390_000, 1_485_200, 77_900]);
  assert.equal(result.lines.reduce((sum, { amountMinor }) => sum + amountMinor, 0), result.totals.incomeTaxMinor);
});

test("Netherlands limits standard credits to the included Box 1 liability", async () => {
  const result = await calculate(facts({
    box1TaxableIncomeMinor: 1_000_000,
    aggregateIncomeForGeneralCreditMinor: 1_000_000,
    employmentIncomeForEmploymentCreditMinor: 1_000_000,
  }));
  assert.equal(result.totals.grossBox1TaxMinor, 357_500);
  assert.equal(result.totals.availableGeneralCreditMinor, 311_500);
  assert.equal(result.totals.availableEmploymentCreditMinor, 83_200);
  assert.equal(result.totals.generalCreditAppliedMinor, 311_500);
  assert.equal(result.totals.employmentCreditAppliedMinor, 46_000);
  assert.equal(result.totals.incomeTaxMinor, 0);
});

test("Netherlands distinguishes both full-year AOW birth-cohort thresholds", async () => {
  const common = {
    box1TaxableIncomeMinor: 5_000_000,
    aggregateIncomeForGeneralCreditMinor: 8_000_000,
    employmentIncomeForEmploymentCreditMinor: 0,
  };
  const laterCohort = await calculate(facts({
    ...common,
    ageSchedule: "full-year-aow-born-1946-or-later",
  }));
  const earlierCohort = await calculate(facts({
    ...common,
    ageSchedule: "full-year-aow-born-before-1946",
  }));
  assert.equal(laterCohort.totals.firstBandUpperMinor, 3_888_300);
  assert.equal(laterCohort.totals.grossBox1TaxMinor, 1_111_500);
  assert.equal(earlierCohort.totals.firstBandUpperMinor, 4_112_300);
  assert.equal(earlierCohort.totals.grossBox1TaxMinor, 1_067_400);
  assert.equal(laterCohort.totals.incomeTaxMinor, laterCohort.totals.grossBox1TaxMinor);
  assert.equal(earlierCohort.totals.incomeTaxMinor, earlierCohort.totals.grossBox1TaxMinor);
});

test("Netherlands calculates the published maximum standard credits", async () => {
  const result = await calculate(facts({
    box1TaxableIncomeMinor: 20_000_000,
    aggregateIncomeForGeneralCreditMinor: 2_973_600,
    employmentIncomeForEmploymentCreditMinor: 4_559_200,
  }));
  assert.equal(result.totals.grossBox1TaxMinor, 8_893_100);
  assert.equal(result.totals.availableGeneralCreditMinor, 311_500);
  assert.equal(result.totals.availableEmploymentCreditMinor, 568_500);
  assert.equal(result.totals.totalCreditsAppliedMinor, 880_000);
  assert.equal(result.totals.incomeTaxMinor, 8_013_100);
});

test("Netherlands is available through the catalogue API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/NL" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/NL/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "ageSchedule",
    "box1TaxableIncomeMinor",
    "aggregateIncomeForGeneralCreditMinor",
    "employmentIncomeForEmploymentCreditMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "NL",
      taxYear: "2026",
      facts: facts({ box1TaxableIncomeMinor: 8_000_000, aggregateIncomeForGeneralCreditMinor: 8_000_000 }),
    },
  });
  assert.equal(calculation.status, 200);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "nl.belastingdienst.box-1-rates-2026"));
});

test("Netherlands rejects the unsupported AOW transition year and identity fields", async () => {
  const api = createApi();
  const transition = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "NL",
      taxYear: "2026",
      facts: facts({ ageSchedule: "reaches-aow-during-2026" }),
    },
  });
  assert.equal(transition.status, 400);
  assert.ok(transition.body.issues.some(({ code }) => code === "facts.enum"));

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "NL",
      taxYear: "2026",
      facts: { ...facts(), name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
