import assert from "node:assert/strict";
import test from "node:test";
import {
  getPitCatalogueStatus,
  getPitJurisdiction,
  listPitJurisdictions,
} from "@taxcraft/catalog";
import { OPENAPI_DOCUMENT, createApi } from "@taxcraft/api";

const api = createApi();

test("runtime catalogue exposes all registered PIT jurisdictions", () => {
  const jurisdictions = listPitJurisdictions();
  assert.equal(jurisdictions.length, 249);
  assert.equal(getPitCatalogueStatus().counts.implemented, 2);
  assert.equal(getPitCatalogueStatus().counts["source-indexed"], 161);
  assert.equal(getPitCatalogueStatus().counts["source-discovery"], 86);
  assert.equal(getPitJurisdiction("SG").verificationStatus, "verified");
  assert.equal(getPitJurisdiction("NZ").verificationStatus, "provisional");
  assert.equal(getPitJurisdiction("AD").verificationStatus, "unmapped");
});

test("global PIT jurisdiction API returns the complete catalogue", async () => {
  const response = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions" });
  assert.equal(response.status, 200);
  assert.equal(response.body.jurisdictions.length, 249);
  assert.equal(response.body.jurisdictions[0].code, "AD");
  assert.ok(response.body.jurisdictions.some(({ code, implementationStatus }) => code === "SG" && implementationStatus === "implemented"));
});

test("jurisdiction detail distinguishes catalogue records from calculators", async () => {
  const singapore = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/SG" });
  assert.equal(singapore.status, 200);
  assert.equal(singapore.body.calculator.available, true);
  assert.equal(singapore.body.calculator.pit.contractVersion, "taxcraft.pit-country-package.v1");

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
  assert.equal(response.body.jurisdictions.length, 2);
  assert.deepEqual(response.body.jurisdictions.map(({ jurisdiction }) => jurisdiction), ["SG", "GB"]);
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
