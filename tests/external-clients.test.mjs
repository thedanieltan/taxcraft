import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createApi } from "../apps/api/src/app.js";
import { createTaxCraftBrowserClient } from "../examples/browser-client/client.js";
import { createTaxCraftClient, TaxCraftApiError } from "../examples/node-client/client.mjs";

const worksheetPayload = {
  status: "ok",
  totals: { chargeableIncomeMinor: 8_500_000 },
  sources: [{ sourceId: "worksheet", url: "https://gov.example/worksheet" }]
};
const calculationPayload = {
  status: "ok",
  totals: { netTaxPayableMinor: 3_700_00 },
  sources: [{ sourceId: "rates", url: "https://gov.example/rates" }]
};

test("Node client sequences worksheet and calculation without identity fields", async () => {
  const calls = [];
  const client = createTaxCraftClient({
    baseUrl: "https://taxcraft.example/",
    fetchImpl: mockFetch(calls)
  });
  const result = await client.estimateSingapore({
    taxYear: "YA2026",
    employmentIncomeMinor: 10_000_000,
    otherTaxableIncomeMinor: 1_000_000,
    allowableDeductionsMinor: 500_000,
    personalReliefsMinor: 2_000_000
  });

  assert.equal(result.worksheet.totals.chargeableIncomeMinor, 8_500_000);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "https://taxcraft.example/v1/worksheets/SG/chargeable-income");
  assert.equal(calls[1].url, "https://taxcraft.example/v1/calculate");
  assert.equal(JSON.parse(calls[1].options.body).facts.chargeableIncomeMinor, 8_500_000);
  assert.doesNotMatch(calls.map((call) => call.options.body).join(" "), /name|email|phone|address|identity/i);
});

test("browser client uses the same public contract", async () => {
  const calls = [];
  const client = createTaxCraftBrowserClient({
    baseUrl: "https://taxcraft.example",
    fetchImpl: mockFetch(calls)
  });
  const result = await client.estimateSingapore({
    taxYear: "YA2026",
    employmentIncomeMinor: 10_000_000,
    otherTaxableIncomeMinor: 1_000_000,
    allowableDeductionsMinor: 500_000,
    personalReliefsMinor: 2_000_000
  });
  assert.equal(result.calculation.status, "ok");
  assert.deepEqual(calls.map((call) => new URL(call.url).pathname), [
    "/v1/worksheets/SG/chargeable-income",
    "/v1/calculate"
  ]);
});

test("Node client preserves structured API errors", async () => {
  const client = createTaxCraftClient({
    baseUrl: "https://taxcraft.example",
    fetchImpl: async () => new Response(JSON.stringify({
      status: "invalid",
      issues: [{ message: "Unsupported facts." }]
    }), { status: 400, headers: { "content-type": "application/json" } })
  });

  await assert.rejects(
    client.calculate({ jurisdiction: "SG", taxYear: "YA2026", facts: {} }),
    (error) => error instanceof TaxCraftApiError && error.status === 400 && /Unsupported facts/.test(error.message)
  );
});

test("public API permits credential-free browser calls", async () => {
  const response = await createApi().handle({
    method: "OPTIONS",
    path: "/v1/calculate"
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers["access-control-allow-origin"], "*");
  assert.match(response.headers["access-control-allow-methods"], /POST/);
  assert.equal(response.headers["access-control-allow-credentials"], undefined);
});

test("browser example does not persist taxpayer facts", async () => {
  const source = await readFile(new URL("../examples/browser-client/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../examples/browser-client/index.html", import.meta.url), "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|document\.cookie|indexedDB/);
  assert.doesNotMatch(html, /name="(?:name|email|phone|address|identityNumber)"/i);
});

function mockFetch(calls) {
  return async (url, options = {}) => {
    calls.push({ url, options });
    const payload = calls.length === 1 ? worksheetPayload : calculationPayload;
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  };
}
