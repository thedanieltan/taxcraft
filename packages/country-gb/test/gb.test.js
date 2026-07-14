import assert from "node:assert/strict";
import test from "node:test";

import { createTaxCraft } from "@taxcraft/core";
import { assertCountryPackageConformance } from "@taxcraft/country-sdk";
import { calculatePersonalAllowance, UK_MODEL_DATA, ukPackage } from "../src/index.js";

const engine = createTaxCraft({ countryPackages: [ukPackage] });
const currentModel = UK_MODEL_DATA.taxYears.at(-1);
const SOURCE_ID = "gb-hmrc-income-tax-rates-current-and-past";

async function calculate(incomePounds, adjustedNetIncomePounds = incomePounds, taxYear = "2026-27", territory = "England") {
  return engine.calculate({
    jurisdiction: "GB",
    taxYear,
    facts: {
      territory,
      nonSavingsIncomeMinor: incomePounds * 100,
      adjustedNetIncomeMinor: adjustedNetIncomePounds * 100
    }
  });
}

test("exposes exactly three UK tax years", () => {
  assert.deepEqual(ukPackage.manifest.taxYears.map(({ taxYear, status }) => [taxYear, status]), [
    ["2024-25", "historical-supported"],
    ["2025-26", "historical-supported"],
    ["2026-27", "current"]
  ]);
});

test("applies the Personal Allowance taper at whole-pound boundaries", () => {
  assert.equal(calculatePersonalAllowance(currentModel, 100_000 * 100), 12_570 * 100);
  assert.equal(calculatePersonalAllowance(currentModel, 100_001 * 100), 12_570 * 100);
  assert.equal(calculatePersonalAllowance(currentModel, 100_002 * 100), 12_569 * 100);
  assert.equal(calculatePersonalAllowance(currentModel, 125_139 * 100), 1 * 100);
  assert.equal(calculatePersonalAllowance(currentModel, 125_140 * 100), 0);
});

test("matches the HMRC £35,000 standard-allowance example", async () => {
  const result = await calculate(35_000);
  assert.equal(result.status, "ok");
  assert.equal(result.totals.personalAllowanceMinor, 12_570 * 100);
  assert.equal(result.totals.taxableIncomeMinor, 22_430 * 100);
  assert.equal(result.totals.incomeTaxMinor, 4_486 * 100);
});

test("calculates taper and additional-rate boundaries deterministically", async () => {
  assert.equal((await calculate(100_000)).totals.incomeTaxMinor, 27_432 * 100);
  assert.equal((await calculate(125_140)).totals.incomeTaxMinor, 42_516 * 100);
  assert.equal((await calculate(150_000)).totals.incomeTaxMinor, 53_703 * 100);
});

test("all three maintained years use independently selectable models", async () => {
  for (const taxYear of ["2024-25", "2025-26", "2026-27"]) {
    const result = await calculate(35_000, 35_000, taxYear, "Wales");
    assert.equal(result.status, "ok");
    assert.equal(result.totals.incomeTaxMinor, 4_486 * 100);
    assert.equal(result.taxYear, taxYear);
  }
});

test("fails closed for Scotland and unsupported fields", async () => {
  const scotland = await calculate(35_000, 35_000, "2026-27", "Scotland");
  assert.equal(scotland.status, "invalid");
  assert.ok(scotland.issues.some((issue) => issue.code === "facts.territory"));

  const unknown = await engine.calculate({
    jurisdiction: "GB",
    taxYear: "2026-27",
    facts: {
      territory: "England",
      nonSavingsIncomeMinor: 35_000 * 100,
      adjustedNetIncomeMinor: 35_000 * 100,
      marriageAllowanceMinor: 1
    }
  });
  assert.equal(unknown.status, "invalid");
  assert.ok(unknown.issues.some((issue) => issue.code === "facts.unknown-field"));
});

test("every UK tax line cites the declared HMRC source", async () => {
  const result = await calculate(150_000);
  assert.deepEqual(new Set(result.lines.flatMap((line) => line.sourceIds)), new Set([SOURCE_ID]));
  assert.deepEqual(result.sources.map((source) => source.sourceId), [SOURCE_ID]);
});

test("passes country package conformance", async () => {
  await assertCountryPackageConformance(ukPackage, [{
    request: {
      jurisdiction: "GB",
      taxYear: "2026-27",
      facts: {
        territory: "Northern Ireland",
        nonSavingsIncomeMinor: 35_000 * 100,
        adjustedNetIncomeMinor: 35_000 * 100
      }
    },
    expectedStatus: "ok",
    expectedTotals: {
      nonSavingsIncomeMinor: 35_000 * 100,
      adjustedNetIncomeMinor: 35_000 * 100,
      personalAllowanceMinor: 12_570 * 100,
      taxableIncomeMinor: 22_430 * 100,
      incomeTaxMinor: 4_486 * 100
    }
  }]);
});
