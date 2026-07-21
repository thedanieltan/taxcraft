import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { tunisiaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [tunisiaPackage] });

async function calculate(netTaxableIncomeMinor, taxYear = "2026") {
  const result = await engine.calculate({
    jurisdiction: "TN",
    taxYear,
    facts: { scopeConfirmed: true, netTaxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("Tunisia exposes only calendar year 2026 without storing PII", () => {
  assert.deepEqual(tunisiaPackage.manifest.taxYears.map(({ taxYear }) => taxYear), ["2026"]);
  assert.equal(tunisiaPackage.manifest.taxYears[0].status, "current");
  assert.equal(tunisiaPackage.manifest.storesUserPII, false);
  assert.equal(tunisiaPackage.manifest.advisory, false);
  assert.equal(tunisiaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("Tunisia applies every ordinary IRPP boundary in millimes", async () => {
  const cases = [
    [0, 0],
    [5_000_000, 0],
    [20_000_000, 3_900_000],
    [30_000_000, 6_700_000],
    [50_000_000, 13_100_000],
    [100_000_000, 30_600_000],
  ];
  for (const [netTaxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate(netTaxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("tn.mof.irpp-scale-current-ar")));
  }
});

test("Tunisia exposes the ordinary schedule through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/TN" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2026"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/TN/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "netTaxableIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TN",
      taxYear: "2026",
      facts: { scopeConfirmed: true, netTaxableIncomeMinor: 50_000_000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 13_100_000);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "tn.mof.irpp-scale-current-ar"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "tn.mof.finance-law-2026"));
});

test("Tunisia publishes separate levies and derivation outside ordinary IRPP scope", () => {
  const coverage = tunisiaPackage.coverage("2026");
  assert.ok(coverage.unsupported.some((entry) => entry.includes("solidarity contribution")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("minimum tax")));
  assert.ok(coverage.unsupported.some((entry) => entry.includes("net-taxable-income derivation")));
});

test("Tunisia rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TN",
      taxYear: "2025",
      facts: { scopeConfirmed: true, netTaxableIncomeMinor: 20_000_000 },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "TN",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        netTaxableIncomeMinor: 20_000_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
