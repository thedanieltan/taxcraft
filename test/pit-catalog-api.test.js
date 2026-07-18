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
  "SG", "GB", "AE", "BH", "BM", "BN", "KY", "MC", "OM", "QA", "BG", "EE", "HU", "RO", "NZ", "PY", "CY",
];

test("runtime catalogue exposes all registered PIT jurisdictions", () => {
  const jurisdictions = listPitJurisdictions();
  const status = getPitCatalogueStatus();
  assert.equal(jurisdictions.length, 249);
  assert.equal(status.counts.implemented, 17);
  assert.equal(status.counts["source-indexed"], 146);
  assert.equal(status.counts["source-discovery"], 86);
  assert.equal(getPitJurisdiction("SG").verificationStatus, "verified");
  assert.equal(getPitJurisdiction("AE").verificationStatus, "verified");
  assert.equal(getPitJurisdiction("EE").verificationStatus, "verified");
  assert.equal(getPitJurisdiction("NZ").verificationStatus, "verified");
  assert.equal(getPitJurisdiction("CY").verificationStatus, "verified");
  assert.equal(getPitJurisdiction("AD").verificationStatus, "unmapped");
});

test("global PIT jurisdiction API returns the complete catalogue", async () => {
  const response = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions" });
  assert.equal(response.status, 200);
  assert.equal(response.body.jurisdictions.length, 249);
  assert.equal(response.body.jurisdictions[0].code, "AD");
  assert.ok(response.body.jurisdictions.some(({ code, implementationStatus }) => code === "SG" && implementationStatus === "implemented"));
  assert.ok(response.body.jurisdictions.some(({ code, implementationStatus }) => code === "AE" && implementationStatus === "implemented"));
  assert.ok(response.body.jurisdictions.some(({ code, implementationStatus }) => code === "EE" && implementationStatus === "implemented"));
  assert.ok(response.body.jurisdictions.some(({ code, implementationStatus }) => code === "NZ" && implementationStatus === "implemented"));
});

test("jurisdiction detail distinguishes catalogue records from calculators", async () => {
  const singapore = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SG" });
  assert.equal(singapore.status, 200);
  assert.equal(singapore.body.calculator.available, true);
  assert.equal(singapore.body.calculator.pit.contractVersion, "taxcraft.pit-country-package.v1");

  const uae = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AE" });
  assert.equal(uae.status, 200);
  assert.equal(uae.body.classificationStatus, "implemented");
  assert.equal(uae.body.calculator.available, true);

  const estonia = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/EE" });
  assert.equal(estonia.status, 200);
  assert.equal(estonia.body.classificationStatus, "implemented");
  assert.equal(estonia.body.calculator.available, true);

  const newZealand = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/NZ" });
  assert.equal(newZealand.status, 200);
  assert.equal(newZealand.body.classificationStatus, "implemented");
  assert.equal(newZealand.body.calculator.available, true);

  const andorra = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AD" });
  assert.equal(andorra.status, 200);
  assert.equal(andorra.body.classificationStatus, "source-discovery");
  assert.equal(andorra.body.calculator.available, false);
});

test("implemented model input schemas are public and unimplemented models fail explicitly", async () => {
  const schema = await api.handle({
    method: "GET",
    path: "/v1/pit/jurisdictions/SG/YA2026/input-schema",
  });
  assert.equal(schema.status, 200);
  assert.equal(schema.body.factsSchema.additionalProperties, false);
  assert.deepEqual(schema.body.factsSchema.required, ["taxResident", "chargeableIncomeMinor"]);

  const noPitSchema = await api.handle({
    method: "GET",
    path: "/v1/pit/jurisdictions/AE/2026/input-schema",
  });
  assert.equal(noPitSchema.status, 200);
  assert.deepEqual(noPitSchema.body.factsSchema.required, ["scopeConfirmed", "coveredIncomeMinor"]);

  const flatRateSchema = await api.handle({
    method: "GET",
    path: "/v1/pit/jurisdictions/BG/2026/input-schema",
  });
  assert.equal(flatRateSchema.status, 200);
  assert.deepEqual(flatRateSchema.body.factsSchema.required, ["scopeConfirmed", "taxBaseMinor"]);

  const progressiveSchema = await api.handle({
    method: "GET",
    path: "/v1/pit/jurisdictions/NZ/2026/input-schema",
  });
  assert.equal(progressiveSchema.status, 200);
  assert.deepEqual(progressiveSchema.body.factsSchema.required, ["scopeConfirmed", "taxableIncomeMinor"]);

  const unavailable = await api.handle({
    method: "GET",
    path: "/v1/pit/jurisdictions/AD/2026/coverage",
  });
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
