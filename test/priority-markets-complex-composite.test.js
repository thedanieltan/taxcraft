import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import {
  indiaPackage,
  canadaPackage,
  japanPackage,
  spainPackage,
  italyPackage,
} from "@taxcraft/country-complex-composite";

const engine = createTaxCraft({
  countryPackages: [indiaPackage, canadaPackage, japanPackage, spainPackage, italyPackage],
});

async function calculate(jurisdiction, taxYear, facts) {
  const result = await engine.calculate({ jurisdiction, taxYear, facts: { scopeConfirmed: true, ...facts } });
  assert.equal(result.status, "ok");
  return result;
}

test("India applies AY 2026-27 new-regime rebate and cess", async () => {
  const fullyRebated = await calculate("IN", "2026-27", {
    taxRegime: "new",
    residentRebateSchedule: "resident",
    taxableIncomeMinor: 120_000_000,
  });
  assert.equal(fullyRebated.totals.slabTaxMinor, 6_000_000);
  assert.equal(fullyRebated.totals.rebateMinor, 6_000_000);
  assert.equal(fullyRebated.totals.cessMinor, 0);
  assert.equal(fullyRebated.totals.incomeTaxMinor, 0);

  const aboveThreshold = await calculate("IN", "2026-27", {
    taxRegime: "new",
    residentRebateSchedule: "not-applicable",
    taxableIncomeMinor: 130_000_000,
  });
  assert.equal(aboveThreshold.totals.slabTaxMinor, 7_500_000);
  assert.equal(aboveThreshold.totals.rebateMinor, 0);
  assert.equal(aboveThreshold.totals.cessMinor, 300_000);
  assert.equal(aboveThreshold.totals.incomeTaxMinor, 7_800_000);
});

test("India applies the supported old-regime under-60 rebate", async () => {
  const result = await calculate("IN", "2026-27", {
    taxRegime: "old-under-60",
    residentRebateSchedule: "resident",
    taxableIncomeMinor: 50_000_000,
  });
  assert.equal(result.totals.slabTaxMinor, 1_250_000);
  assert.equal(result.totals.rebateMinor, 1_250_000);
  assert.equal(result.totals.incomeTaxMinor, 0);
  assert.ok(result.sources.some(({ sourceId }) => sourceId === "in.income-tax.ay-2026-27-individual-rates"));
});

test("Canada calculates 2026 federal and Ontario bracket tax separately", async () => {
  const result = await calculate("CA", "2026", {
    province: "ON",
    federalTaxableIncomeMinor: 10_000_000,
    provincialTaxableIncomeMinor: 10_000_000,
  });
  assert.equal(result.totals.federalBracketTaxMinor, 1_669_600);
  assert.equal(result.totals.ontarioBracketTaxMinor, 694_046);
  assert.equal(result.totals.totalIncludedTaxMinor, 2_363_646);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountMinor, 0), result.totals.totalIncludedTaxMinor);
  assert.ok(result.sources.some(({ sourceId }) => sourceId === "ca.cra.tax-rates-2026"));
});

test("Japan rounds taxable income and combined tax at the statutory stages", async () => {
  const result = await calculate("JP", "2026", { taxableIncomeMinor: 5_000_999 });
  assert.equal(result.totals.roundedTaxableIncomeMinor, 5_000_000);
  assert.equal(result.totals.nationalIncomeTaxMinor, 572_500);
  assert.equal(result.totals.reconstructionTaxMinor, 12_022);
  assert.equal(result.totals.beforeFinalRoundingMinor, 584_522);
  assert.equal(result.totals.finalRoundingAdjustmentMinor, -22);
  assert.equal(result.totals.incomeTaxMinor, 584_500);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountMinor, 0), result.totals.incomeTaxMinor);
});

test("Spain subtracts state-scale tax attributable to the personal and family minimum", async () => {
  const result = await calculate("ES", "2026", {
    generalTaxableBaseMinor: 8_000_000,
    personalFamilyMinimumMinor: 555_000,
  });
  assert.equal(result.totals.stateTaxOnBaseMinor, 1_345_075);
  assert.equal(result.totals.stateTaxOnMinimumMinor, 52_725);
  assert.equal(result.totals.stateIncomeTaxMinor, 1_292_350);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountMinor, 0), result.totals.stateIncomeTaxMinor);
});

test("Spain rejects a personal minimum above the taxable base", async () => {
  const api = createApi();
  const response = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ES",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        generalTaxableBaseMinor: 500_000,
        personalFamilyMinimumMinor: 600_000,
      },
    },
  });
  assert.equal(response.status, 400);
  assert.ok(response.body.issues.some(({ code }) => code === "facts.inconsistent"));
});

test("Italy calculates national IRPEF and caller-confirmed local additions", async () => {
  const result = await calculate("IT", "2026", {
    nationalTaxableIncomeMinor: 10_000_000,
    regionalTaxableIncomeMinor: 10_000_000,
    municipalTaxableIncomeMinor: 10_000_000,
    regionalRateBasisPoints: 200,
    municipalRateBasisPoints: 80,
  });
  assert.equal(result.totals.nationalIncomeTaxMinor, 3_520_000);
  assert.equal(result.totals.regionalAdditionMinor, 200_000);
  assert.equal(result.totals.municipalAdditionMinor, 80_000);
  assert.equal(result.totals.totalIncludedTaxMinor, 3_800_000);
  assert.equal(result.lines.reduce((sum, line) => sum + line.amountMinor, 0), result.totals.totalIncludedTaxMinor);
});

test("priority-market packages expose closed schemas and reject identity fields", async () => {
  const api = createApi();
  const cases = [
    ["IN", "2026-27", ["scopeConfirmed", "taxRegime", "residentRebateSchedule", "taxableIncomeMinor"], { taxRegime: "new", residentRebateSchedule: "resident", taxableIncomeMinor: 1_000_000 }],
    ["CA", "2026", ["scopeConfirmed", "province", "federalTaxableIncomeMinor", "provincialTaxableIncomeMinor"], { province: "ON", federalTaxableIncomeMinor: 1_000_000, provincialTaxableIncomeMinor: 1_000_000 }],
    ["JP", "2026", ["scopeConfirmed", "taxableIncomeMinor"], { taxableIncomeMinor: 1_000_000 }],
    ["ES", "2026", ["scopeConfirmed", "generalTaxableBaseMinor", "personalFamilyMinimumMinor"], { generalTaxableBaseMinor: 1_000_000, personalFamilyMinimumMinor: 100_000 }],
    ["IT", "2026", ["scopeConfirmed", "nationalTaxableIncomeMinor", "regionalTaxableIncomeMinor", "municipalTaxableIncomeMinor", "regionalRateBasisPoints", "municipalRateBasisPoints"], { nationalTaxableIncomeMinor: 1_000_000, regionalTaxableIncomeMinor: 1_000_000, municipalTaxableIncomeMinor: 1_000_000, regionalRateBasisPoints: 100, municipalRateBasisPoints: 50 }],
  ];

  for (const [code, year, required, facts] of cases) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.calculationFamily, "COMPLEX_COMPOSITE");
    assert.equal(detail.body.calculator.available, true);

    const schema = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}/${year}/input-schema` });
    assert.equal(schema.status, 200);
    assert.equal(schema.body.factsSchema.additionalProperties, false);
    assert.deepEqual(schema.body.factsSchema.required, required);

    const privateFact = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: { jurisdiction: code, taxYear: year, facts: { scopeConfirmed: true, ...facts, name: "Private Person" } },
    });
    assert.equal(privateFact.status, 400);
    assert.ok(privateFact.body.issues.some(({ code: issueCode }) => issueCode === "facts.pii-field"));
  }
});

test("priority-market coverage makes exclusions explicit", () => {
  assert.ok(indiaPackage.coverage("2026-27").unsupported.some((entry) => entry.includes("surcharge")));
  assert.ok(canadaPackage.coverage("2026").unsupported.some((entry) => entry.includes("credits")));
  assert.ok(japanPackage.coverage("2026").unsupported.some((entry) => entry.includes("local inhabitant tax")));
  assert.ok(spainPackage.coverage("2026").unsupported.some((entry) => entry.includes("autonomous-community")));
  assert.ok(italyPackage.coverage("2026").unsupported.some((entry) => entry.includes("rate lookup")));
});
