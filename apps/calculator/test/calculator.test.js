import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicRoot = new URL("../public/", import.meta.url);

test("calculator collects only supported worksheet and tax facts", async () => {
  const html = await readFile(new URL("index.html", publicRoot), "utf8");
  assert.match(html, /id="tax-year"/);
  assert.match(html, /id="employment-income"/);
  assert.match(html, /id="other-taxable-income"/);
  assert.match(html, /id="allowable-deductions"/);
  assert.match(html, /id="personal-reliefs"/);
  assert.match(html, /id="resident-confirmation"/);
  assert.doesNotMatch(html, /name="(?:name|email|phone|address|nationalId|identityNumber)"/i);
  assert.doesNotMatch(html, /type="file"/i);
  assert.match(html, /does not create an account or save calculation history/i);
  assert.match(html, /does not determine whether you qualify/i);
});

test("calculator derives chargeable income before calling the tax engine", async () => {
  const script = await readFile(new URL("app.js", publicRoot), "utf8");
  assert.match(script, /fetch\("\/v1\/worksheets\/SG\/chargeable-income"/);
  assert.match(script, /worksheet\.totals\.chargeableIncomeMinor/);
  assert.match(script, /fetch\("\/v1\/calculate"/);
  assert.match(script, /source\.url/);
});

test("calculator does not use browser persistence or cookies", async () => {
  const script = await readFile(new URL("app.js", publicRoot), "utf8");
  assert.doesNotMatch(script, /localStorage|sessionStorage|document\.cookie|indexedDB/);
});
