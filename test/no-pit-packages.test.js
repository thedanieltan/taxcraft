import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { noPitPackages } from "@taxcraft/country-no-pit";

const EXPECTED_CODES = ["AE", "BH", "BM", "BN", "KY", "MC", "OM", "QA"];

test("no-PIT bundle exposes eight independent maintained packages", () => {
  assert.deepEqual(noPitPackages.map(({ manifest }) => manifest.jurisdiction), EXPECTED_CODES);
  for (const countryPackage of noPitPackages) {
    assert.equal(countryPackage.manifest.storesUserPII, false);
    assert.equal(countryPackage.manifest.advisory, false);
    assert.equal(countryPackage.manifest.taxYears.length, 3);
    assert.equal(countryPackage.manifest.taxYears.filter(({ status }) => status === "current").length, 1);
    assert.equal(countryPackage.manifest.pit.factsSchema.additionalProperties, false);
    assert.ok(countryPackage.sources.length > 0);
  }
});

test("every accepted no-PIT package returns a deterministic zero PIT result", async () => {
  const engine = createTaxCraft({ countryPackages: noPitPackages });

  for (const jurisdiction of EXPECTED_CODES) {
    const request = {
      jurisdiction,
      taxYear: "2026",
      facts: { scopeConfirmed: true, coveredIncomeMinor: 123456 },
    };
    const original = structuredClone(request);
    const first = await engine.calculate(request);
    const second = await engine.calculate(request);

    assert.deepEqual(request, original);
    assert.deepEqual(first, second);
    assert.equal(first.status, "ok");
    assert.equal(first.jurisdiction, jurisdiction);
    assert.equal(first.totals.coveredIncomeMinor, 123456);
    assert.equal(first.totals.incomeTaxMinor, 0);
    assert.equal(first.lines[0].amountMinor, 0);
    assert.ok(first.sources.length > 0);
    assert.ok(first.coverage.unsupported.length > 0);
  }
});

test("no-PIT packages require explicit scope confirmation", async () => {
  const engine = createTaxCraft({ countryPackages: noPitPackages });
  const result = await engine.calculate({
    jurisdiction: "AE",
    taxYear: "2026",
    facts: { scopeConfirmed: false, coveredIncomeMinor: 10000 },
  });

  assert.equal(result.status, "invalid");
  assert.ok(result.issues.some(({ path }) => path === "$.facts.scopeConfirmed"));
});

test("global catalogue and API expose the accepted no-PIT wave", async () => {
  const api = createApi();
  const status = await api.handle({ method: "GET", path: "/v1/pit/status" });
  assert.equal(status.status, 200);
  assert.equal(status.body.counts.implemented, 10);
  assert.equal(status.body.counts["source-indexed"], 153);
  assert.equal(status.body.counts["source-discovery"], 86);

  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AE" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.implementationStatus, "implemented");
  assert.equal(detail.body.calculator.available, true);
  assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AE/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "coveredIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "AE",
      taxYear: "2026",
      facts: { scopeConfirmed: true, coveredIncomeMinor: 5000000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 0);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "ae.pit.natural-person-wages"));
});

test("Oman package does not extend the zero result into 2028", async () => {
  const api = createApi();
  const response = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "OM",
      taxYear: "2028",
      facts: { scopeConfirmed: true, coveredIncomeMinor: 100000 },
    },
  });

  assert.equal(response.status, 422);
  assert.equal(response.body.status, "unsupported");
  assert.equal(response.body.reasonCode, "tax-year-not-supported");
  assert.deepEqual(response.body.supportedTaxYears, ["2024", "2025", "2026"]);
});
