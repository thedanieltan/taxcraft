import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { ecuadorPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [ecuadorPackage] });

async function calculate(taxableBaseMinor, taxYear = "2025") {
  const result = await engine.calculate({
    jurisdiction: "EC",
    taxYear,
    facts: { scopeConfirmed: true, taxableBaseMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Ecuador exposes fiscal year 2025 without storing PII", () => {
  assert.deepEqual(ecuadorPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2025"]);
  assert.equal(ecuadorPackage.manifest.taxYears[0].status, "current");
  assert.equal(ecuadorPackage.manifest.storesUserPII, false);
  assert.equal(ecuadorPackage.manifest.advisory, false);
  assert.equal(ecuadorPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Ecuador reproduces every official 2025 basic-fraction transition", async () => {
  const cases = [
    [0, 0],
    [1_208_100, 0],
    [1_300_000, 4_595],
    [1_538_700, 16_500],
    [1_997_800, 62_400],
    [2_642_200, 139_800],
    [3_477_000, 265_000],
    [4_608_900, 491_400],
    [6_135_900, 873_100],
    [8_181_700, 1_486_900],
    [10_881_000, 2_431_600],
    [12_000_000, 2_845_630],
  ];
  for (const [taxableBaseMinor, expectedTaxMinor] of cases) {
    const result = await calculate(taxableBaseMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("ec.sri.general-regime-table-2025")));
  }
});

test("Ecuador exposes the 2025 general-regime table through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/EC" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2025"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/EC/2025/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "taxableBaseMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "EC",
      taxYear: "2025",
      facts: { scopeConfirmed: true, taxableBaseMinor: 12_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 2_845_630);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ec.sri.general-regime-table-2025"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ec.sri.filing-campaign-2025"));
});

test("Ecuador keeps rebates and special regimes outside the table engine", () => {
  const coverage = ecuadorPackage.coverage("2025");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("personal-expense tax rebate")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("RIMPE")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("inheritance")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Ecuador rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "EC",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableBaseMinor: 1_538_700 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "EC",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        taxableBaseMinor: 1_538_700,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
