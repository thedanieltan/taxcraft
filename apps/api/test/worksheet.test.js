import assert from "node:assert/strict";
import test from "node:test";

import { createApi, OPENAPI_DOCUMENT } from "../src/app.js";

const api = createApi();

function request(overrides = {}) {
  return {
    method: "POST",
    path: "/v1/worksheets/SG/chargeable-income",
    body: {
      facts: {
        employmentIncomeMinor: 10_000_000,
        otherTaxableIncomeMinor: 1_000_000,
        allowableDeductionsMinor: 500_000,
        personalReliefsMinor: 2_000_000,
        eligibilityConfirmed: true,
        ...overrides
      }
    }
  };
}

test("OpenAPI exposes the Singapore worksheet", () => {
  assert.ok(OPENAPI_DOCUMENT.paths["/v1/worksheets/SG/chargeable-income"]);
});

test("worksheet endpoint returns source-linked chargeable income", async () => {
  const response = await api.handle(request());
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.totals.chargeableIncomeMinor, 8_500_000);
  assert.deepEqual(response.body.sources.map((source) => source.sourceId).sort(), [
    "sg-iras-reliefs-rebates-deductions",
    "sg-iras-what-is-taxable"
  ]);
});

test("worksheet endpoint rejects personal identity fields", async () => {
  const response = await api.handle(request({ fullName: "Example Person" }));
  assert.equal(response.status, 400);
  assert.ok(response.body.issues.some((issue) => issue.code === "worksheet.field-not-allowed"));
});
