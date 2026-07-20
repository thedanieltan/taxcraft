import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { noPitPackages } from "@taxcraft/country-no-pit";

const EXPECTED_CODES = ["AE", "BH", "BM", "BN", "KY", "MC", "OM", "QA", "SA", "VG", "BS", "KW"];

test("no-PIT bundle exposes twelve independent maintained packages", () => {
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

test("second no-PIT wave preserves business-income and payroll-tax boundaries", () => {
  const saudiArabia = noPitPackages.find(({ manifest }) => manifest.jurisdiction === "SA");
  const britishVirginIslands = noPitPackages.find(({ manifest }) => manifest.jurisdiction === "VG");
  const saudiCoverage = saudiArabia.coverage("2026");
  const virginIslandsCoverage = britishVirginIslands.coverage("2026");

  assert.ok(saudiCoverage.unsupported.some((entry) => entry.includes("business")));
  assert.ok(saudiCoverage.unsupported.some((entry) => entry.includes("withholding")));
  assert.ok(virginIslandsCoverage.unsupported.some((entry) => entry.includes("payroll tax")));
  assert.deepEqual(
    britishVirginIslands.sources.map(({ sourceId }) => sourceId),
    ["vg.ird.tax-inventory", "vg.ird.payroll-tax"],
  );
});

test("third no-PIT wave preserves Bahamas other-tax and Kuwait corporate-body boundaries", () => {
  const bahamas = noPitPackages.find(({ manifest }) => manifest.jurisdiction === "BS");
  const kuwait = noPitPackages.find(({ manifest }) => manifest.jurisdiction === "KW");
  const bahamasCoverage = bahamas.coverage("2026");
  const kuwaitCoverage = kuwait.coverage("2026");

  assert.ok(bahamasCoverage.unsupported.some((entry) => entry.includes("value-added tax")));
  assert.ok(bahamasCoverage.unsupported.some((entry) => entry.includes("National Insurance")));
  assert.ok(kuwaitCoverage.unsupported.some((entry) => entry.includes("corporate body")));
  assert.ok(kuwaitCoverage.unsupported.some((entry) => entry.includes("social security")));
  assert.deepEqual(
    bahamas.sources.map(({ sourceId }) => sourceId),
    ["bs.opm.mid-year-budget-2024-25", "bs.opm.personal-income-tax-policy"],
  );
  assert.deepEqual(
    kuwait.sources.map(({ sourceId }) => sourceId),
    ["kw.mof.income-tax-law-corporate-body"],
  );
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

test("global catalogue and API retain all accepted no-PIT waves", async () => {
  const api = createApi();
  const status = await api.handle({ method: "GET", path: "/v1/pit/status" });
  assert.equal(status.status, 200);
  assert.equal(status.body.jurisdictionCount, 249);
  assert.ok(status.body.counts.implemented >= 14);
  assert.equal(
    Object.values(status.body.counts).reduce((sum, value) => sum + value, 0),
    249,
  );

  for (const code of ["AE", "SA", "VG", "BS", "KW"]) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.implementationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);
    assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  }

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/KW/2026/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, ["scopeConfirmed", "coveredIncomeMinor"]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "BS",
      taxYear: "2026",
      facts: { scopeConfirmed: true, coveredIncomeMinor: 5000000 },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 0);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "bs.opm.mid-year-budget-2024-25"));
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "bs.opm.personal-income-tax-policy"));
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
