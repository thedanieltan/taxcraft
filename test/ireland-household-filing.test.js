import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { irelandPackage } from "@taxcraft/country-household-filing";

const engine = createTaxCraft({ countryPackages: [irelandPackage] });

async function calculate(taxYear, facts) {
  const result = await engine.calculate({ jurisdiction: "IE", taxYear, facts: { scopeConfirmed: true, ...facts } });
  assert.equal(result.status, "ok");
  return result;
}

function singleFacts({ taxableIncomeMinor, payeIncomeMinor = taxableIncomeMinor, uscIncomeMinor = taxableIncomeMinor }) {
  return {
    filingSchedule: "single-paye",
    primaryTaxableIncomeMinor: taxableIncomeMinor,
    secondaryTaxableIncomeMinor: 0,
    lowerEarnerBandIncomeMinor: 0,
    primaryPayeIncomeMinor: payeIncomeMinor,
    secondaryPayeIncomeMinor: 0,
    primaryUscIncomeMinor: uscIncomeMinor,
    secondaryUscIncomeMinor: 0,
  };
}

test("Ireland maintains calendar years 2024 through 2026", () => {
  assert.deepEqual(irelandPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024", "2025", "2026"]);
  assert.equal(irelandPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(irelandPackage.manifest.storesUserPII, false);
  assert.equal(irelandPackage.manifest.pit.taxUnit, "household-or-filing-status");
  assert.deepEqual(irelandPackage.manifest.pit.incomeSchedules, ["income-tax", "universal-social-charge"]);
});

test("Ireland applies single PAYE bands, credits and year-specific USC", async () => {
  const cases = [
    ["2024", 15_600_00, 11_850_00, 170_462, 1_355_462],
    ["2025", 14_400_00, 10_400_00, 134_600, 1_174_600],
    ["2026", 14_400_00, 10_400_00, 133_282, 1_173_282],
  ];
  for (const [taxYear, grossIncomeTaxMinor, incomeTaxMinor, uscMinor, combinedMinor] of cases) {
    const result = await calculate(taxYear, singleFacts({ taxableIncomeMinor: 6_000_000 }));
    assert.equal(result.totals.grossIncomeTaxMinor, grossIncomeTaxMinor);
    assert.equal(result.totals.incomeTaxMinor, incomeTaxMinor);
    assert.equal(result.totals.primaryUscMinor, uscMinor);
    assert.equal(result.totals.incomeTaxAndUscMinor, combinedMinor);
  }
});

test("Ireland applies the married one-income standard-rate band and credits", async () => {
  const result = await calculate("2026", {
    filingSchedule: "married-one-paye",
    primaryTaxableIncomeMinor: 8_000_000,
    secondaryTaxableIncomeMinor: 0,
    lowerEarnerBandIncomeMinor: 0,
    primaryPayeIncomeMinor: 8_000_000,
    secondaryPayeIncomeMinor: 0,
    primaryUscIncomeMinor: 8_000_000,
    secondaryUscIncomeMinor: 0,
  });
  assert.equal(result.totals.standardRateBandMinor, 5_300_000);
  assert.equal(result.totals.grossIncomeTaxMinor, 2_140_000);
  assert.equal(result.totals.availablePersonalCreditMinor, 400_000);
  assert.equal(result.totals.availablePrimaryEmployeeCreditMinor, 200_000);
  assert.equal(result.totals.incomeTaxMinor, 1_540_000);
  assert.equal(result.totals.primaryUscMinor, 243_062);
  assert.equal(result.totals.incomeTaxAndUscMinor, 1_783_062);
});

test("Ireland applies the lower-earner increase and non-transferable credits for two PAYE incomes", async () => {
  const result = await calculate("2026", {
    filingSchedule: "married-two-paye",
    primaryTaxableIncomeMinor: 7_100_000,
    secondaryTaxableIncomeMinor: 2_250_000,
    lowerEarnerBandIncomeMinor: 2_250_000,
    primaryPayeIncomeMinor: 7_100_000,
    secondaryPayeIncomeMinor: 2_250_000,
    primaryUscIncomeMinor: 7_100_000,
    secondaryUscIncomeMinor: 2_250_000,
  });
  assert.equal(result.totals.combinedTaxableIncomeMinor, 9_350_000);
  assert.equal(result.totals.standardRateBandMinor, 7_550_000);
  assert.equal(result.totals.grossIncomeTaxMinor, 2_230_000);
  assert.equal(result.totals.availablePersonalCreditMinor, 400_000);
  assert.equal(result.totals.availablePrimaryEmployeeCreditMinor, 200_000);
  assert.equal(result.totals.availableSecondaryEmployeeCreditMinor, 200_000);
  assert.equal(result.totals.incomeTaxMinor, 1_430_000);
  assert.equal(result.totals.primaryUscMinor, 171_062);
  assert.equal(result.totals.secondaryUscMinor, 26_982);
  assert.equal(result.totals.uscMinor, 198_044);
  assert.equal(result.totals.incomeTaxAndUscMinor, 1_628_044);
});

test("Ireland caps the Employee Tax Credit at 20% of qualifying PAYE income", async () => {
  const result = await calculate("2026", singleFacts({
    taxableIncomeMinor: 2_000_000,
    payeIncomeMinor: 500_000,
    uscIncomeMinor: 500_000,
  }));
  assert.equal(result.totals.grossIncomeTaxMinor, 400_000);
  assert.equal(result.totals.availablePersonalCreditMinor, 200_000);
  assert.equal(result.totals.availablePrimaryEmployeeCreditMinor, 100_000);
  assert.equal(result.totals.incomeTaxMinor, 100_000);
  assert.equal(result.totals.uscMinor, 0);
});

test("Ireland applies the USC exemption threshold to each person independently", async () => {
  const exempt = await calculate("2026", singleFacts({
    taxableIncomeMinor: 1_300_000,
    payeIncomeMinor: 1_300_000,
    uscIncomeMinor: 1_300_000,
  }));
  const above = await calculate("2026", singleFacts({
    taxableIncomeMinor: 1_300_001,
    payeIncomeMinor: 1_300_001,
    uscIncomeMinor: 1_300_001,
  }));
  assert.equal(exempt.totals.primaryUscMinor, 0);
  assert.equal(above.totals.primaryUscMinor, 7_982);
});

test("Ireland rejects incompatible household facts", async () => {
  const api = createApi();
  const secondaryOnSingle = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "IE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "single-paye",
        primaryTaxableIncomeMinor: 5_000_000,
        secondaryTaxableIncomeMinor: 1,
        lowerEarnerBandIncomeMinor: 0,
        primaryPayeIncomeMinor: 5_000_000,
        secondaryPayeIncomeMinor: 0,
        primaryUscIncomeMinor: 5_000_000,
        secondaryUscIncomeMinor: 0,
      },
    },
  });
  assert.equal(secondaryOnSingle.status, 400);
  assert.ok(secondaryOnSingle.body.issues.some(({ code }) => code === "facts.inconsistent"));

  const missingSecondIncome = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "IE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        filingSchedule: "married-two-paye",
        primaryTaxableIncomeMinor: 5_000_000,
        secondaryTaxableIncomeMinor: 0,
        lowerEarnerBandIncomeMinor: 0,
        primaryPayeIncomeMinor: 5_000_000,
        secondaryPayeIncomeMinor: 0,
        primaryUscIncomeMinor: 5_000_000,
        secondaryUscIncomeMinor: 0,
      },
    },
  });
  assert.equal(missingSecondIncome.status, 400);
  assert.ok(missingSecondIncome.body.issues.some(({ code }) => code === "facts.inconsistent"));
});

test("Ireland is exposed through the global API with official sources", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/IE" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "HOUSEHOLD_FILING");
  assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/IE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.equal(schema.body.factsSchema.required.length, 9);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "IE",
      taxYear: "2026",
      facts: { scopeConfirmed: true, ...singleFacts({ taxableIncomeMinor: 6_000_000 }) },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxAndUscMinor, 1_173_282);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ie.revenue.rates-bands-reliefs-2024-2026"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ie.revenue.usc-standard-rates"));
});

test("Ireland rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "IE",
      taxYear: "2027",
      facts: { scopeConfirmed: true, ...singleFacts({ taxableIncomeMinor: 6_000_000 }) },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "IE",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        ...singleFacts({ taxableIncomeMinor: 6_000_000 }),
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
