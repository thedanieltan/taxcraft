import assert from "node:assert/strict";
import test from "node:test";

import { calculateChargeableIncomeWorksheet } from "../src/index.js";

function facts(overrides = {}) {
  return {
    employmentIncomeMinor: 10_000_000,
    otherTaxableIncomeMinor: 1_000_000,
    allowableDeductionsMinor: 500_000,
    personalReliefsMinor: 2_000_000,
    eligibilityConfirmed: true,
    ...overrides
  };
}

test("derives chargeable income from user-confirmed totals", () => {
  const result = calculateChargeableIncomeWorksheet(facts());
  assert.equal(result.status, "ok");
  assert.deepEqual(result.totals, {
    employmentIncomeMinor: 10_000_000,
    otherTaxableIncomeMinor: 1_000_000,
    totalIncomeMinor: 11_000_000,
    allowableDeductionsMinor: 500_000,
    assessableIncomeMinor: 10_500_000,
    personalReliefsMinor: 2_000_000,
    chargeableIncomeMinor: 8_500_000
  });
  assert.deepEqual(new Set(result.lines.flatMap((line) => line.sourceIds)), new Set([
    "sg-iras-what-is-taxable",
    "sg-iras-reliefs-rebates-deductions"
  ]));
});

test("floors chargeable income at zero", () => {
  const result = calculateChargeableIncomeWorksheet(facts({ personalReliefsMinor: 20_000_000 }));
  assert.equal(result.status, "ok");
  assert.equal(result.totals.chargeableIncomeMinor, 0);
});

test("requires eligibility confirmation", () => {
  const result = calculateChargeableIncomeWorksheet(facts({ eligibilityConfirmed: false }));
  assert.equal(result.status, "invalid");
  assert.match(result.issues[0].code, /confirmation/);
});

test("rejects deductions above entered income", () => {
  const result = calculateChargeableIncomeWorksheet(facts({ allowableDeductionsMinor: 12_000_000 }));
  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some((issue) => issue.code === "worksheet.deductions-exceed-income"));
});

test("rejects identity-bearing and unknown fields", () => {
  const result = calculateChargeableIncomeWorksheet(facts({ fullName: "Example Person" }));
  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some((issue) => issue.code === "worksheet.field-not-allowed"));
});
