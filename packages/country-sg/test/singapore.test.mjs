import assert from "node:assert/strict";
import test from "node:test";

import { createTaxCraft } from "@taxcraft/core";
import { assertCountryPackageConformance } from "@taxcraft/country-sdk";
import { singaporePackage } from "../src/index.js";

const engine = createTaxCraft({ countryPackages: [singaporePackage] });

async function calculate(taxYear, dollars) {
  return engine.calculate({
    jurisdiction: "SG",
    taxYear,
    facts: { taxResident: true, chargeableIncomeMinor: dollars * 100 }
  });
}

test("exposes exactly three supported assessment years", () => {
  assert.deepEqual(
    singaporePackage.manifest.taxYears.map(({ taxYear, status }) => [taxYear, status]),
    [
      ["YA2024", "historical-supported"],
      ["YA2025", "historical-supported"],
      ["YA2026", "current"]
    ]
  );
});

test("matches the IRAS resident bracket boundary totals before rebates", async () => {
  const cases = [
    [20_000, 0],
    [30_000, 200],
    [40_000, 550],
    [80_000, 3_350],
    [120_000, 7_950],
    [160_000, 13_950],
    [200_000, 21_150],
    [240_000, 28_750],
    [280_000, 36_550],
    [320_000, 44_550],
    [500_000, 84_150],
    [1_000_000, 199_150],
    [1_100_000, 223_150]
  ];

  for (const [income, expectedTax] of cases) {
    const result = await calculate("YA2026", income);
    assert.equal(result.status, "ok");
    assert.equal(result.totals.grossTaxMinor, expectedTax * 100, `chargeable income ${income}`);
    assert.equal(result.totals.netTaxPayableMinor, expectedTax * 100, `chargeable income ${income}`);
  }
});

test("applies the YA 2024 rebate at 50% capped at 200 dollars", async () => {
  const belowCap = await calculate("YA2024", 30_000);
  assert.equal(belowCap.totals.grossTaxMinor, 20_000);
  assert.equal(belowCap.totals.personalIncomeTaxRebateMinor, 10_000);
  assert.equal(belowCap.totals.netTaxPayableMinor, 10_000);

  const capped = await calculate("YA2024", 40_000);
  assert.equal(capped.totals.grossTaxMinor, 55_000);
  assert.equal(capped.totals.personalIncomeTaxRebateMinor, 20_000);
  assert.equal(capped.totals.netTaxPayableMinor, 35_000);
});

test("applies the YA 2025 rebate at 60% capped at 200 dollars", async () => {
  const belowCap = await calculate("YA2025", 30_000);
  assert.equal(belowCap.totals.grossTaxMinor, 20_000);
  assert.equal(belowCap.totals.personalIncomeTaxRebateMinor, 12_000);
  assert.equal(belowCap.totals.netTaxPayableMinor, 8_000);

  const capped = await calculate("YA2025", 40_000);
  assert.equal(capped.totals.personalIncomeTaxRebateMinor, 20_000);
  assert.equal(capped.totals.netTaxPayableMinor, 35_000);
});

test("matches the IRAS YA 2026 worked examples at chargeable income", async () => {
  const first = await calculate("YA2026", 34_750);
  assert.equal(first.totals.netTaxPayableMinor, 36_625);

  const second = await calculate("YA2026", 234_100);
  assert.equal(second.totals.netTaxPayableMinor, 2_762_900);
});

test("rejects unconfirmed residency and non-whole-dollar chargeable income", async () => {
  const residency = await engine.calculate({
    jurisdiction: "SG",
    taxYear: "YA2026",
    facts: { taxResident: false, chargeableIncomeMinor: 5_000_000 }
  });
  assert.equal(residency.status, "invalid");
  assert.equal(residency.issues[0].code, "facts.tax-residency");

  const cents = await engine.calculate({
    jurisdiction: "SG",
    taxYear: "YA2026",
    facts: { taxResident: true, chargeableIncomeMinor: 5_000_001 }
  });
  assert.equal(cents.status, "invalid");
  assert.equal(cents.issues[0].code, "facts.chargeable-income-whole-dollar");
});

test("every calculation line links to a declared official source", async () => {
  const result = await calculate("YA2025", 40_000);
  const declared = new Set(singaporePackage.sources.map(({ sourceId }) => sourceId));
  assert.ok(result.lines.length > 0);
  for (const line of result.lines) {
    assert.ok(line.sourceIds.length > 0);
    assert.ok(line.sourceIds.every((sourceId) => declared.has(sourceId)));
  }
  assert.ok(result.sources.every(({ url }) => url.startsWith("https://www.iras.gov.sg/")));
});

test("passes the shared deterministic conformance runner", async () => {
  await assertCountryPackageConformance(singaporePackage, [
    {
      request: {
        jurisdiction: "SG",
        taxYear: "YA2026",
        facts: { taxResident: true, chargeableIncomeMinor: 23_410_000 }
      },
      expectedStatus: "ok",
      expectedTotals: {
        chargeableIncomeMinor: 23_410_000,
        grossTaxMinor: 2_762_900,
        personalIncomeTaxRebateMinor: 0,
        netTaxPayableMinor: 2_762_900
      }
    }
  ]);
});

test("rounds fractional-cent rate and rebate amounts deterministically", async () => {
  const ya2026 = await calculate("YA2026", 34_751);
  assert.equal(ya2026.totals.grossTaxMinor, 36_629);
  assert.equal(ya2026.totals.netTaxPayableMinor, 36_629);

  const ya2025 = await calculate("YA2025", 30_001);
  assert.equal(ya2025.totals.grossTaxMinor, 20_004);
  assert.equal(ya2025.totals.personalIncomeTaxRebateMinor, 12_002);
  assert.equal(ya2025.totals.netTaxPayableMinor, 8_002);
});
