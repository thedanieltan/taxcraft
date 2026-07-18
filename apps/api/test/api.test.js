import assert from "node:assert/strict";
import test from "node:test";

import { createApi, OPENAPI_DOCUMENT } from "../src/app.js";

const api = createApi();

const MAINTAINED_JURISDICTIONS = [
  "SG", "GB", "AE", "BH", "BM", "BN", "KY", "MC", "OM", "QA", "BG", "EE", "HU", "RO", "AM", "GE", "MD", "MK", "UA", "UZ", "NZ", "PY", "CY",
];

test("lists maintained jurisdictions and exposes source-linked coverage", async () => {
  const list = await api.handle({ method: "GET", path: "/v1/jurisdictions" });
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.jurisdictions.map((entry) => entry.jurisdiction), MAINTAINED_JURISDICTIONS);

  const singapore = list.body.jurisdictions.find((entry) => entry.jurisdiction === "SG");
  const uk = list.body.jurisdictions.find((entry) => entry.jurisdiction === "GB");
  const uae = list.body.jurisdictions.find((entry) => entry.jurisdiction === "AE");
  const estonia = list.body.jurisdictions.find((entry) => entry.jurisdiction === "EE");
  const newZealand = list.body.jurisdictions.find((entry) => entry.jurisdiction === "NZ");
  const ukraine = list.body.jurisdictions.find((entry) => entry.jurisdiction === "UA");
  assert.deepEqual(singapore.taxYears.map((entry) => entry.taxYear), ["YA2024", "YA2025", "YA2026"]);
  assert.deepEqual(uk.taxYears.map((entry) => entry.taxYear), ["2024-25", "2025-26", "2026-27"]);
  assert.deepEqual(uae.taxYears.map((entry) => entry.taxYear), ["2024", "2025", "2026"]);
  assert.deepEqual(estonia.taxYears.map((entry) => entry.taxYear), ["2024", "2025", "2026"]);
  assert.deepEqual(newZealand.taxYears.map((entry) => entry.taxYear), ["2024", "2025", "2026"]);
  assert.deepEqual(ukraine.taxYears.map((entry) => entry.taxYear), ["2024", "2025", "2026"]);

  const singaporeCoverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/SG/YA2026/coverage" });
  assert.equal(singaporeCoverage.status, 200);
  assert.equal(singaporeCoverage.body.status, "current");
  assert.ok(singaporeCoverage.body.sources.every((source) => source.url.startsWith("https://www.iras.gov.sg/")));

  const ukCoverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/GB/2026-27/coverage" });
  assert.equal(ukCoverage.status, 200);
  assert.equal(ukCoverage.body.status, "current");
  assert.ok(ukCoverage.body.coverage.unsupported.includes("Scotland"));
  assert.ok(ukCoverage.body.sources.every((source) => source.url.startsWith("https://www.gov.uk/")));

  const uaeCoverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/AE/2026/coverage" });
  assert.equal(uaeCoverage.status, 200);
  assert.equal(uaeCoverage.body.status, "current");
  assert.ok(uaeCoverage.body.sources.some((source) => source.sourceId === "ae.pit.natural-person-wages"));

  const estoniaCoverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/EE/2026/coverage" });
  assert.equal(estoniaCoverage.status, 200);
  assert.equal(estoniaCoverage.body.status, "current");
  assert.ok(estoniaCoverage.body.sources.some((source) => source.sourceId === "ee.emta.basic-exemption"));

  const newZealandCoverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/NZ/2026/coverage" });
  assert.equal(newZealandCoverage.status, 200);
  assert.equal(newZealandCoverage.body.status, "current");
  assert.ok(newZealandCoverage.body.sources.some((source) => source.sourceId === "nz.ird.individual-tax-rates"));

  const ukraineCoverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/UA/2026/coverage" });
  assert.equal(ukraineCoverage.status, 200);
  assert.equal(ukraineCoverage.body.status, "current");
  assert.ok(ukraineCoverage.body.sources.some((source) => source.sourceId === "ua.sts.tax-code-section-iv-article-167"));
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

test("calculates UK non-savings Income Tax and returns HMRC sources", async () => {
  const response = await api.handle({
    method: "POST",
    path: "/v1/calculate",
    body: {
      jurisdiction: "GB",
      taxYear: "2026-27",
      facts: {
        territory: "England",
        nonSavingsIncomeMinor: 3_500_000,
        adjustedNetIncomeMinor: 3_500_000
      }
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.totals.incomeTaxMinor, 448_600);
  assert.deepEqual(response.body.sources.map((source) => source.sourceId), ["gb-hmrc-income-tax-rates-current-and-past"]);
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
