import assert from "node:assert/strict";
import test from "node:test";

import worker from "../src/index.js";

const env = {
  ASSETS: {
    async fetch() {
      return new Response("calculator", { headers: { "content-type": "text/plain" } });
    }
  }
};

test("serves health without state or cookies", async () => {
  const result = await worker.fetch(new Request("https://taxcraft.example/healthz"), env);
  assert.equal(result.status, 200);
  assert.equal(result.headers.has("set-cookie"), false);
  assert.deepEqual(await result.json(), { status: "ok" });
});

test("serves jurisdiction discovery through the shared API", async () => {
  const result = await worker.fetch(new Request("https://taxcraft.example/v1/jurisdictions"), env);
  assert.equal(result.status, 200);
  assert.match(await result.text(), /"jurisdiction":"SG"/);
});

test("calculates through the Worker adapter", async () => {
  const result = await worker.fetch(new Request("https://taxcraft.example/v1/calculate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jurisdiction: "SG",
      taxYear: "YA2026",
      facts: { taxResident: true, chargeableIncomeMinor: 10_000_000 }
    })
  }), env);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).totals.netTaxPayableMinor, 565_000);
});

test("rejects oversized request bodies before calculation", async () => {
  const result = await worker.fetch(new Request("https://taxcraft.example/v1/calculate", {
    method: "POST",
    headers: { "content-length": "70000" },
    body: "{}"
  }), env);
  assert.equal(result.status, 413);
  assert.match(await result.text(), /body_too_large/);
});

test("delegates non-API requests to static assets", async () => {
  const result = await worker.fetch(new Request("https://taxcraft.example/"), env);
  assert.equal(await result.text(), "calculator");
});
