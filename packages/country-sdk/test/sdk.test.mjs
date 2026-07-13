import assert from "node:assert/strict";
import test from "node:test";

import { MODEL_STATUS } from "@taxcraft/contracts";
import { createTaxCraft } from "@taxcraft/core";
import { advanceSupportWindow, assertCountryPackageConformance, defineCountryPackage } from "../src/index.js";

function makePackage() {
  return defineCountryPackage({
    manifest: {
      jurisdiction: "XY",
      name: "Example jurisdiction",
      storesUserPII: false,
      advisory: false,
      taxYears: [{ taxYear: "2026", modelVersion: "1.0.0", status: MODEL_STATUS.CURRENT, order: 2026 }],
    },
    sources: [{ sourceId: "xy-rates", publisher: "Example Revenue Authority", publisherType: "tax-authority", title: "Rates", url: "https://revenue.example.gov/rates", retrievedAt: "2026-07-13" }],
    models: {
      "2026": {
        coverage: { supported: ["employment income"], unsupported: [] },
        validateFacts({ facts }) {
          return Number.isSafeInteger(facts.incomeMinor)
            ? { ok: true, facts }
            : { ok: false, issues: [{ code: "facts.income", path: "$.facts.incomeMinor", message: "Income must use integer minor units." }] };
        },
        calculate({ facts }) {
          const taxMinor = Math.trunc(facts.incomeMinor / 10);
          return { currency: "XYD", totals: { taxMinor }, lines: [{ ruleId: "xy.rate", amountMinor: taxMinor, sourceIds: ["xy-rates"] }], coverage: this.coverage };
        },
      },
    },
  });
}

test("defines a package that can be loaded explicitly", async () => {
  const engineWithoutPackage = createTaxCraft();
  const unsupported = await engineWithoutPackage.calculate({ jurisdiction: "XY", taxYear: "2026", facts: { incomeMinor: 1000 } });
  assert.equal(unsupported.status, "unsupported");

  const engine = createTaxCraft({ countryPackages: [makePackage()] });
  const result = await engine.calculate({ jurisdiction: "XY", taxYear: "2026", facts: { incomeMinor: 1000 } });
  assert.equal(result.status, "ok");
  assert.equal(result.totals.taxMinor, 100);
});

test("requires a model implementation for every declared tax year", () => {
  assert.throws(
    () => defineCountryPackage({ manifest: { jurisdiction: "XY", name: "Example", storesUserPII: false, advisory: false, taxYears: [{ taxYear: "2026", modelVersion: "1", status: "current", order: 2026 }] }, sources: [], models: {} }),
    /Missing model implementation/,
  );
});

test("advances the support window and retires the oldest version", () => {
  const existing = [
    { taxYear: "2024", modelVersion: "1", status: "historical-supported", order: 2024 },
    { taxYear: "2025", modelVersion: "1", status: "historical-supported", order: 2025 },
    { taxYear: "2026", modelVersion: "1", status: "current", order: 2026 },
  ];
  const { active, retired } = advanceSupportWindow(existing, { taxYear: "2027", modelVersion: "1", status: "current", order: 2027 });

  assert.deepEqual(active.map(({ taxYear, status }) => [taxYear, status]), [
    ["2027", "current"],
    ["2026", "historical-supported"],
    ["2025", "historical-supported"],
  ]);
  assert.equal(retired[0].taxYear, "2024");
  assert.equal(retired[0].status, "retired");
});

test("runs deterministic package fixtures", async () => {
  await assertCountryPackageConformance(makePackage(), [
    {
      request: { jurisdiction: "XY", taxYear: "2026", facts: { incomeMinor: 2000 } },
      expectedStatus: "ok",
      expectedTotals: { taxMinor: 200 },
    },
  ]);
});
