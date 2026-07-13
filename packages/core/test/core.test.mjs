import assert from "node:assert/strict";
import test from "node:test";

import { createTaxCraft, createRegistry } from "../src/index.js";

function fixturePackage(overrides = {}) {
  const packageValue = {
    manifest: {
      jurisdiction: "ZZ",
      name: "Fixture jurisdiction",
      storesUserPII: false,
      advisory: false,
      taxYears: [{ taxYear: "2026", modelVersion: "1.0.0", status: "current" }],
    },
    sources: [
      {
        sourceId: "zz-rates-2026",
        publisher: "Fixture Revenue Authority",
        publisherType: "tax-authority",
        title: "Personal income tax rates 2026",
        url: "https://revenue.example.gov/rates-2026",
        retrievedAt: "2026-07-13",
      },
    ],
    async validateFacts({ facts }) {
      if (!Number.isSafeInteger(facts.incomeMinor) || facts.incomeMinor < 0) {
        return {
          ok: false,
          issues: [{ code: "facts.income", path: "$.facts.incomeMinor", message: "Income must use non-negative integer minor units." }],
        };
      }
      return { ok: true, facts };
    },
    async calculate({ facts }) {
      const taxMinor = Math.trunc(facts.incomeMinor / 10);
      return {
        currency: "ZZD",
        totals: { taxableIncomeMinor: facts.incomeMinor, taxMinor },
        lines: [
          {
            ruleId: "zz.pit.flat-rate",
            label: "Personal income tax",
            amountMinor: taxMinor,
            sourceIds: ["zz-rates-2026"],
          },
        ],
        assumptions: [],
        coverage: { employmentIncome: true },
      };
    },
  };
  return Object.assign(packageValue, overrides);
}

test("calculates deterministically without mutating the request", async () => {
  const taxcraft = createTaxCraft({ countryPackages: [fixturePackage()] });
  const request = { jurisdiction: "ZZ", taxYear: "2026", facts: { incomeMinor: 100_000 } };
  const snapshot = structuredClone(request);

  const first = await taxcraft.calculate(request);
  const second = await taxcraft.calculate(request);

  assert.deepEqual(first, second);
  assert.deepEqual(request, snapshot);
  assert.equal(first.status, "ok");
  assert.equal(first.totals.taxMinor, 10_000);
  assert.equal(first.sources[0].sourceId, "zz-rates-2026");
  assert.equal(Object.isFrozen(first), true);
});

test("returns an explicit unsupported result for an unavailable tax year", async () => {
  const taxcraft = createTaxCraft({ countryPackages: [fixturePackage()] });
  const result = await taxcraft.calculate({ jurisdiction: "ZZ", taxYear: "2024", facts: { incomeMinor: 100_000 } });

  assert.equal(result.status, "unsupported");
  assert.equal(result.reasonCode, "tax-year-not-supported");
  assert.deepEqual(result.supportedTaxYears, ["2026"]);
});

test("rejects identity fields before invoking a country package", async () => {
  const taxcraft = createTaxCraft({ countryPackages: [fixturePackage()] });
  const result = await taxcraft.calculate({
    jurisdiction: "ZZ",
    taxYear: "2026",
    facts: { incomeMinor: 100_000, emailAddress: "not-retained@example.com" },
  });

  assert.equal(result.status, "invalid");
  assert.equal(result.issues[0].code, "facts.pii-field");
  assert.doesNotMatch(JSON.stringify(result), /not-retained/);
});

test("rejects a package exposing more than three tax years", () => {
  const countryPackage = fixturePackage();
  countryPackage.manifest.taxYears = [
    { taxYear: "2023", modelVersion: "1.0.0", status: "historical-supported" },
    { taxYear: "2024", modelVersion: "1.0.0", status: "historical-supported" },
    { taxYear: "2025", modelVersion: "1.0.0", status: "historical-supported" },
    { taxYear: "2026", modelVersion: "1.0.0", status: "current" },
  ];

  assert.throws(() => createRegistry([countryPackage]), /more than three tax years/);
});

test("rejects calculation lines without an official source", async () => {
  const countryPackage = fixturePackage();
  countryPackage.calculate = async () => ({
    currency: "ZZD",
    totals: { taxMinor: 100 },
    lines: [{ ruleId: "zz.bad", amountMinor: 100, sourceIds: [] }],
  });
  const result = await createTaxCraft({ countryPackages: [countryPackage] }).calculate({
    jurisdiction: "ZZ",
    taxYear: "2026",
    facts: { incomeMinor: 1_000 },
  });

  assert.equal(result.status, "invalid");
  assert.equal(result.issues[0].code, "output.source");
});

test("rejects non-integer money outputs", async () => {
  const countryPackage = fixturePackage();
  countryPackage.calculate = async () => ({
    currency: "ZZD",
    totals: { taxMinor: 10.5 },
    lines: [{ ruleId: "zz.bad-money", amountMinor: 10.5, sourceIds: ["zz-rates-2026"] }],
  });
  const result = await createTaxCraft({ countryPackages: [countryPackage] }).calculate({
    jurisdiction: "ZZ",
    taxYear: "2026",
    facts: { incomeMinor: 100 },
  });

  assert.equal(result.status, "invalid");
  assert.ok(result.issues.every(({ code }) => code === "output.money"));
});
