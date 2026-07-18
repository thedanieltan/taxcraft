import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackagesByJurisdiction } from "@taxcraft/country-simple-progressive";

const engine = createTaxCraft({ countryPackages: [
  simpleProgressivePackagesByJurisdiction.AU,
  simpleProgressivePackagesByJurisdiction.PH,
] });

async function calculate(jurisdiction, taxYear, taxableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction,
    taxYear,
    facts: { scopeConfirmed: true, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Australia maintains 2024-25 through 2026-27 resident schedules", () => {
  const australia = simpleProgressivePackagesByJurisdiction.AU;
  assert.deepEqual(australia.manifest.taxYears.map(({ taxYear }) => taxYear), ["2024-25", "2025-26", "2026-27"]);
  assert.equal(australia.manifest.taxYears.at(-1).status, "current");
  assert.equal(australia.manifest.storesUserPII, false);
  assert.equal(australia.manifest.pit.factsSchema.additionalProperties, false);
});

test("Australia applies the 2024-25 and 2025-26 resident bands", async () => {
  const cases = [
    [1_820_000, 0],
    [4_500_000, 428_800],
    [13_500_000, 3_128_800],
    [19_000_000, 5_163_800],
    [20_000_000, 5_613_800],
  ];
  for (const taxYear of ["2024-25", "2025-26"]) {
    for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
      const result = await calculate("AU", taxYear, taxableIncomeMinor);
      assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    }
  }
});

test("Australia applies the legislated 15% first band from 2026-27", async () => {
  const threshold = await calculate("AU", "2026-27", 4_500_000);
  const middleIncome = await calculate("AU", "2026-27", 10_000_000);
  assert.equal(threshold.totals.incomeTaxMinor, 402_000);
  assert.equal(middleIncome.totals.incomeTaxMinor, 2_052_000);
});

test("Philippines applies every 2023-onwards graduated breakpoint", async () => {
  const cases = [
    [25_000_000, 0],
    [40_000_000, 2_250_000],
    [80_000_000, 10_250_000],
    [200_000_000, 40_250_000],
    [800_000_000, 220_250_000],
    [900_000_000, 255_250_000],
  ];
  for (const taxYear of ["2024", "2025", "2026"]) {
    for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
      const result = await calculate("PH", taxYear, taxableIncomeMinor);
      assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    }
  }
});

test("Australia and Philippines are exposed through the global API with official sources", async () => {
  const api = createApi();
  const cases = [
    ["AU", "2026-27", "au.treasury.new-tax-cuts-2026-27", 10_000_000, 2_052_000],
    ["PH", "2026", "ph.lawphil.train-act-individual-rates", 900_000_000, 255_250_000],
  ];

  for (const [jurisdiction, taxYear, sourceId, taxableIncomeMinor, expectedTaxMinor] of cases) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${jurisdiction}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.calculationFamily, "SIMPLE_PROGRESSIVE");
    assert.equal(detail.body.calculator.available, true);

    const calculation = await api.handle({
      method: "POST",
      path: "/v1/pit/calculate",
      body: {
        jurisdiction,
        taxYear,
        facts: { scopeConfirmed: true, taxableIncomeMinor },
      },
    });
    assert.equal(calculation.status, 200);
    assert.equal(calculation.body.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(calculation.body.sources.some((source) => source.sourceId === sourceId));
  }
});

test("wave 6 rejects unsupported years and identity-bearing facts", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "AU",
      taxYear: "2027-28",
      facts: { scopeConfirmed: true, taxableIncomeMinor: 10_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "PH",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        taxableIncomeMinor: 40_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
