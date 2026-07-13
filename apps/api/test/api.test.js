import assert from "node:assert/strict";
import test from "node:test";

import { createApi, OPENAPI_DOCUMENT } from "../src/app.js";

const api = createApi();

test("lists Singapore and exposes supported-year coverage with official sources", async () => {
  const list = await api.handle({ method: "GET", path: "/v1/jurisdictions" });
  assert.equal(list.status, 200);
  assert.equal(list.body.jurisdictions[0].jurisdiction, "SG");
  assert.deepEqual(
    list.body.jurisdictions[0].taxYears.map((entry) => entry.taxYear),
    ["YA2024", "YA2025", "YA2026"]
  );

  const coverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/SG/YA2026/coverage" });
  assert.equal(coverage.status, 200);
  assert.equal(coverage.body.status, "current");
  assert.ok(coverage.body.coverage.supported.length > 0);
  assert.ok(coverage.body.sources.every((source) => source.url.startsWith("https://www.iras.gov.sg/")));
});

test("calculates through the official Singapore package and returns cited sources", async () => {
  const response = await api.handle({
    method: "POST",
    path: "/v1/calculate",
    body: {
      jurisdiction: "SG",
      taxYear: "YA2026",
      facts: { taxResident: true, chargeableIncomeMinor: 10_000_000 }
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.totals.netTaxPayableMinor, 565_000);
  assert.ok(response.body.lines.every((line) => line.sourceIds.length > 0));
  assert.ok(response.body.sources.some((source) => source.sourceId === "sg-iras-resident-rates-ya2024-onwards"));
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.headers["set-cookie"], undefined);
});

test("rejects identity-bearing facts and never logs the submitted values", async () => {
  const logs = [];
  const privateApi = createApi({ logger: (record) => logs.push(record) });
  const response = await privateApi.handle({
    method: "POST",
    path: "/v1/calculate",
    body: {
      jurisdiction: "SG",
      taxYear: "YA2026",
      facts: {
        taxResident: true,
        chargeableIncomeMinor: 12_345_600,
        name: "Private Person"
      }
    }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.status, "invalid");
  const serializedLogs = JSON.stringify(logs);
  assert.doesNotMatch(serializedLogs, /Private Person/);
  assert.doesNotMatch(serializedLogs, /12345600/);
});

test("serves a small OpenAPI document for the public routes", async () => {
  const response = await api.handle({ method: "GET", path: "/openapi.json" });
  assert.equal(response.status, 200);
  assert.equal(response.body.openapi, "3.1.0");
  assert.deepEqual(response.body, OPENAPI_DOCUMENT);
  assert.ok(response.body.paths["/v1/calculate"]);
});

test("returns explicit not-found responses for unavailable resources", async () => {
  const response = await api.handle({ method: "GET", path: "/v1/jurisdictions/SG/YA2023/coverage" });
  assert.equal(response.status, 404);
  assert.equal(response.body.status, "not_found");
});
