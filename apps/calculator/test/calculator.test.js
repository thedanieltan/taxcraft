import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicRoot = new URL("../public/", import.meta.url);

test("calculator collects only facts declared by implemented PIT packages", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("index.html", publicRoot), "utf8"),
    readFile(new URL("app.js", publicRoot), "utf8"),
  ]);
  assert.match(html, /id="jurisdiction"/);
  assert.match(html, /id="tax-year"/);
  assert.match(html, /id="facts-fields"/);
  assert.match(script, /\/input-schema/);
  assert.match(script, /createFieldModel/);
  assert.doesNotMatch(html, /name="(?:name|email|phone|address|nationalId|identityNumber)"/i);
  assert.doesNotMatch(html, /type="file"/i);
  assert.match(html, /does not create accounts or save calculation history/i);
  assert.match(html, /Only the declared facts for the selected package are sent/i);
});

test("calculator loads the global catalogue and calls the PIT engine", async () => {
  const script = await readFile(new URL("app.js", publicRoot), "utf8");
  assert.match(script, /fetch\("\/v1\/pit\/status"/);
  assert.match(script, /fetch\("\/v1\/pit\/jurisdictions"/);
  assert.match(script, /fetch\("\/v1\/pit\/calculate"/);
  assert.match(script, /source\.url/);
  assert.doesNotMatch(script, /\/v1\/worksheets\/SG\/chargeable-income/);
});

test("calculator does not use browser persistence or cookies", async () => {
  const script = await readFile(new URL("app.js", publicRoot), "utf8");
  assert.doesNotMatch(script, /localStorage|sessionStorage|document\.cookie|indexedDB/);
});
