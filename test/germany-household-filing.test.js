import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { germanyPackage } from "@taxcraft/country-household-filing";

const engine = createTaxCraft({ countryPackages: [germanyPackage] });

async function calculate(filingSchedule, taxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "DE",
    taxYear,
    facts: { scopeConfirmed: true, filingSchedule, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Germany exposes only assessment year 2026 without storing PII", () => {
  assert.deepEqual(germanyPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(germanyPackage.manifest.taxYears[0].status, "current");
  assert.equal(germanyPackage.manifest.storesUserPII, false);
  assert.equal(germanyPackage.manifest.advisory, false);
  assert.equal(germanyPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Germany applies every statutory 2026 individual tariff zone", async () => {
  const cases = [
    [0, 0, 0],
    [1_234_800, 12_348, 0],
    [1_300_000, 13_000, 9_500],
    [1_779_900, 17_799, 103_400],
    [1_780_000, 17_800, 103_500],
    [6_987_800, 69_878, 1_821_300],
    [6_987_900, 69_879, 1_821_300],
    [27_782_500, 277_825, 10_555_000],
    [27_782_600, 277_826, 10_555_100],
    [30_000_000, 300_000, 11_552_900],
  ];
  for (const [taxableIncomeMinor, expectedTariffIncomeEuro, expectedTaxMinor] of cases) {
    const result = await calculate("individual", taxableIncomeMinor);
    assert.equal(result.totals.filingDivisor, 1);
    assert.equal(result.totals.tariffIncomeEuro, expectedTariffIncomeEuro);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("de.law.estg-section-32a-2026")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("de.bmf.lst-handbook-section-32a-2026")));
  }
});

test("Germany floors taxable income and final tax to whole euro", async () => {
  const belowNextEuro = await calculate("individual", 1_300_099);
  assert.equal(belowNextEuro.totals.tariffIncomeEuro, 13_000);
  assert.equal(belowNextEuro.totals.unitTaxEuro, 95);
  assert.equal(belowNextEuro.totals.incomeTaxMinor, 9_500);

  const nextEuro = await calculate("individual", 1_300_100);
  assert.equal(nextEuro.totals.tariffIncomeEuro, 13_001);
  assert.equal(nextEuro.totals.incomeTaxMinor, 9_500);
});

test("Germany applies the statutory spouse-splitting procedure", async () => {
  const individual = await calculate("individual", 10_000_000);
  assert.equal(individual.totals.tariffIncomeEuro, 100_000);
  assert.equal(individual.totals.incomeTaxMinor, 3_086_400);

  const joint = await calculate("joint", 10_000_000);
  assert.equal(joint.totals.filingDivisor, 2);
  assert.equal(joint.totals.tariffIncomeEuro, 50_000);
  assert.equal(joint.totals.unitTaxEuro, 10_548);
  assert.equal(joint.totals.incomeTaxMinor, 2_109_600);

  const jointWithOddCents = await calculate("joint", 10_000_199);
  assert.equal(jointWithOddCents.totals.tariffIncomeEuro, 50_000);
  assert.equal(jointWithOddCents.totals.incomeTaxMinor, 2_109_600);
});

test("Germany exposes individual and joint schedules through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/DE" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "HOUSEHOLD_FILING");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/DE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "filingSchedule", "taxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "DE",
      taxYear: "2026",
      facts: { scopeConfirmed: true, filingSchedule: "joint", taxableIncomeMinor: 10_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 2_109_600);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "de.law.estg-section-32a-2026"));
});

test("Germany keeps surcharges, church tax and special-rate income outside the tariff engine", () => {
  const coverage = germanyPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("solidarity surcharge")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("church tax")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("child allowance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("special rates")));
});

test("Germany rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "DE",
      taxYear: "2025",
      facts: { scopeConfirmed: true, filingSchedule: "individual", taxableIncomeMinor: 5_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "DE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "joint",
        taxableIncomeMinor: 10_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
