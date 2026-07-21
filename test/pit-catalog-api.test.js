import assert from "node:assert/strict";
import test from "node:test";
import {
  getPitCatalogueStatus,
  getPitJurisdiction,
  listPitJurisdictions,
} from "@taxcraft/catalog";
import { OPENAPI_DOCUMENT, createApi } from "@taxcraft/api";

const api = createApi();
const IMPLEMENTED_CODES = [
  "SG", "GB", "AE", "BH", "BM", "BN", "KY", "MC", "OM", "QA", "SA", "VG", "BS", "KW", "BG", "EE", "HU", "RO", "AM", "GE", "MD", "MK", "UA", "UZ", "NZ", "PY", "CY", "PA", "HN", "DO", "BB", "TT", "SC", "UG", "GT", "RW", "AU", "PH", "TH", "FJ", "BW", "TL", "KH", "KE", "ZA", "MY", "CZ", "ID", "GH", "MU", "LK", "SZ", "JM", "LS", "GY", "LR", "LC", "NA", "HK", "IE", "PL", "MT",
];
const VERIFIED_CODES = ["SG", "AE", "SA", "VG", "BS", "KW", "EE", "NZ", "CY", "AM", "UA", "UZ", "PA", "HN", "DO", "BB", "TT", "SC", "UG", "GT", "RW", "AU", "PH", "TH", "FJ", "BW", "TL", "KH", "KE", "ZA", "MY", "CZ", "ID", "GH", "MU", "LK", "SZ", "JM", "LS", "GY", "LR", "LC", "NA", "HK", "IE", "PL", "MT"];

test("runtime catalogue exposes all registered PIT jurisdictions", () => {
  const jurisdictions = listPitJurisdictions();
  const status = getPitCatalogueStatus();
  assert.equal(jurisdictions.length, 249);
  assert.equal(status.counts.implemented, 62);
  assert.equal(status.counts["source-indexed"], 102);
  assert.equal(status.counts["source-discovery"], 85);
  for (const code of VERIFIED_CODES) assert.equal(getPitJurisdiction(code).verificationStatus, "verified");
  assert.equal(getPitJurisdiction("AD").verificationStatus, "unmapped");
});

test("global PIT jurisdiction API returns the complete catalogue", async () => {
  const response = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions" });
  assert.equal(response.status, 200);
  assert.equal(response.body.jurisdictions.length, 249);
  assert.equal(response.body.jurisdictions[0].code, "AD");
  for (const code of VERIFIED_CODES) {
    assert.ok(response.body.jurisdictions.some(({ code: entryCode, implementationStatus }) => entryCode === code && implementationStatus === "implemented"));
  }
});

test("jurisdiction detail distinguishes catalogue records from calculators", async () => {
  for (const code of VERIFIED_CODES) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);
    assert.equal(detail.body.calculator.pit.contractVersion, "taxcraft.pit-country-package.v1");
  }

  const andorra = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AD" });
  assert.equal(andorra.status, 200);
  assert.equal(andorra.body.classificationStatus, "source-discovery");
  assert.equal(andorra.body.calculator.available, false);
});

test("implemented model input schemas are public and unimplemented models fail explicitly", async () => {
  const cases = [
    ["SG", "YA2026", ["taxResident", "chargeableIncomeMinor"]],
    ["AE", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["SA", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["VG", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["BS", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["KW", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["BG", "2026", ["scopeConfirmed", "taxBaseMinor"]],
    ["NZ", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["UA", "2026", ["scopeConfirmed", "taxBaseMinor"]],
    ["DO", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["SC", "2026", ["scopeConfirmed", "employmentTaxSchedule", "monthlyGrossEmolumentsMinor"]],
    ["UG", "2026", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["GT", "2026", ["scopeConfirmed", "annualTaxableEmploymentIncomeMinor"]],
    ["RW", "2026", ["scopeConfirmed", "incomePeriod", "taxableEmploymentIncomeMinor"]],
    ["FJ", "2026", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["BW", "2026-27", ["scopeConfirmed", "individualTaxSchedule", "annualTaxableIncomeMinor"]],
    ["TL", "2026", ["scopeConfirmed", "incomeSchedule", "individualTaxSchedule", "taxableIncomeMinor"]],
    ["KH", "2026", ["scopeConfirmed", "taxSchedule", "taxableIncomeMinor"]],
    ["KE", "2026", ["scopeConfirmed", "incomePeriod", "individualTaxSchedule", "taxableEmploymentIncomeMinor"]],
    ["ZA", "2027", ["scopeConfirmed", "rebateSchedule", "taxableIncomeMinor"]],
    ["AU", "2026-27", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["PH", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["TH", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["MY", "2025", ["scopeConfirmed", "individualRebateSchedule", "chargeableIncomeMinor"]],
    ["CZ", "2026", ["scopeConfirmed", "basicTaxpayerCreditSchedule", "reducedTaxBaseMinor"]],
    ["ID", "2026", ["scopeConfirmed", "nonTaxableIncomeSchedule", "annualNetIncomeMinor"]],
    ["GH", "2026", ["scopeConfirmed", "incomePeriod", "individualTaxSchedule", "chargeableIncomeMinor"]],
    ["MU", "2026-27", ["scopeConfirmed", "chargeableIncomeMinor", "fairShareThresholdIncomeMinor", "fairShareLeviableIncomeMinor"]],
    ["LK", "2026-27", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["SZ", "2025-26", ["scopeConfirmed", "rebateSchedule", "taxableIncomeMinor"]],
    ["JM", "2026", ["scopeConfirmed", "exemptionSchedule", "aggregateIncomeMinor"]],
    ["LS", "2026-27", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["GY", "2026", ["scopeConfirmed", "annualChargeableIncomeMinor"]],
    ["LR", "2026", ["scopeConfirmed", "annualGrossTaxableIncomeMinor"]],
    ["LC", "2026", ["scopeConfirmed", "annualChargeableIncomeMinor"]],
    ["NA", "2027", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["HK", "2025-26", ["scopeConfirmed", "netIncomeMinor", "netChargeableIncomeMinor"]],
    ["IE", "2026", ["scopeConfirmed", "filingSchedule", "primaryTaxableIncomeMinor", "secondaryTaxableIncomeMinor", "lowerEarnerBandIncomeMinor", "primaryPayeIncomeMinor", "secondaryPayeIncomeMinor", "primaryUscIncomeMinor", "secondaryUscIncomeMinor"]],
    ["PL", "2026", ["scopeConfirmed", "filingSchedule", "primaryTaxableIncomeMinor", "secondaryTaxableIncomeMinor"]],
    ["MT", "2026", ["scopeConfirmed", "filingSchedule", "chargeableIncomeMinor"]],
  ];
  for (const [code, year, required] of cases) {
    const schema = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}/${year}/input-schema` });
    assert.equal(schema.status, 200);
    assert.equal(schema.body.factsSchema.additionalProperties, false);
    assert.deepEqual(schema.body.factsSchema.required, required);
  }

  const unavailable = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AD/2026/coverage" });
  assert.equal(unavailable.status, 409);
  assert.equal(unavailable.body.status, "not_implemented");
  assert.equal(unavailable.body.jurisdiction, "AD");
});

test("PIT calculation route remains equivalent to the compatibility route", async () => {
  const request = {
    jurisdiction: "SG",
    taxYear: "YA2026",
    facts: { taxResident: true, chargeableIncomeMinor: 100_000_00 },
  };
  const legacy = await api.handle({ method: "POST", path: "/v1/calculate", body: request });
  const pit = await api.handle({ method: "POST", path: "/v1/pit/calculate", body: request });
  assert.deepEqual(pit, legacy);
});

test("legacy jurisdiction discovery remains limited to implemented packages", async () => {
  const response = await api.handle({ method: "GET", path: "/v1/jurisdictions" });
  assert.equal(response.status, 200);
  assert.equal(response.body.jurisdictions.length, IMPLEMENTED_CODES.length);
  assert.deepEqual(response.body.jurisdictions.map(({ jurisdiction }) => jurisdiction), IMPLEMENTED_CODES);
});

test("OpenAPI publishes the global PIT catalogue surfaces", () => {
  for (const path of [
    "/v1/pit/status",
    "/v1/pit/calculation-families",
    "/v1/pit/jurisdictions",
    "/v1/pit/jurisdictions/{code}",
    "/v1/pit/jurisdictions/{code}/{taxYear}/input-schema",
    "/v1/pit/calculate",
  ]) {
    assert.ok(OPENAPI_DOCUMENT.paths[path], `${path} is missing from OpenAPI`);
  }
});
