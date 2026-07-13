import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { CALCULATION_STATUS, CONTRACT_VERSION, MODEL_STATUS } from "../packages/contracts/src/index.js";

test("machine-readable policies satisfy the product boundaries", () => {
  const output = execFileSync(process.execPath, ["scripts/validate-policies.mjs"], {
    encoding: "utf8",
  });
  assert.match(output, /Policy checks passed/);
});

test("public contract identifiers are stable and explicit", () => {
  assert.equal(CONTRACT_VERSION, "taxcraft.contracts.v1");
  assert.equal(CALCULATION_STATUS.UNSUPPORTED, "unsupported");
  assert.equal(MODEL_STATUS.RETIRED, "retired");
});
