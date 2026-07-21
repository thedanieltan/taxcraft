import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { colombiaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [colombiaPackage] });

async function calculate(taxableBaseUvtTenThousandths, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "CO",
    taxYear,
    facts: { scopeConfirmed: true, taxableBaseUvtTenThousandths },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Colombia exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(colombiaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(colombiaPackage.manifest.storesUserPII, false);
  assert.equal(colombiaPackage.manifest.advisory, false);
  assert.equal(colombiaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Colombia applies every article 241 fixed-offset boundary", async () => {
  const cases = [
    [0, 0, 0],
    [10_900_000, 0, 0],
    [17_000_000, 1_159_000, 607_014_660],
    [17_000_001, 1_160_000, 607_538_400],
    [41_000_000, 7_880_000, 4_127_071_200],
    [86_700_000, 22_961_000, 12_025_594_140],
    [189_700_000, 59_010_000, 30_905_897_400],
    [310_000_000, 103_521_000, 54_218_088_540],
    [400_000_000, 138_620_000, 72_600_838_800],
  ];
  for (const [taxableBaseUvtTenThousandths, expectedTaxUvt, expectedTaxCopMinor] of cases) {
    const result = await calculate(taxableBaseUvtTenThousandths);
    assert.equal(result.totals.taxUvtTenThousandths, expectedTaxUvt);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxCopMinor);
    assert.equal(result.totals.uvtValueCopMinor, 5_237_400);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("co.law.tax-statute-article-241")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("co.dian.uvt-2026-resolution-238")));
  }
});

test("Colombia exposes the resident article 241 schedule through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/CO" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/CO/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "taxableBaseUvtTenThousandths"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "CO",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableBaseUvtTenThousandths: 41_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.taxUvtTenThousandths, 7_880_000);
  assert.equal(calculation.body.totals.incomeTaxMinor, 4_127_071_200);
});

test("Colombia keeps base conversion and filing rounding outside the engine", () => {
  const coverage = colombiaPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("peso-denominated taxable base")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("cedular")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("thousands of pesos")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("residence")));
});

test("Colombia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: { jurisdiction: "CO", taxYear: "2025", facts: { scopeConfirmed: true, taxableBaseUvtTenThousandths: 17_000_000 } },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "CO",
      taxYear: "2026",
      facts: { scopeConfirmed: true, taxableBaseUvtTenThousandths: 17_000_000, name: "Private Person" },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
