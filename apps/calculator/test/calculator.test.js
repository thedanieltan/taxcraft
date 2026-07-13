import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicRoot = new URL("../public/", import.meta.url);

test("calculator collects only the supported tax facts", async () => {
  const html = await readFile(new URL("index.html", publicRoot), "utf8");
  assert.match(html, /id="tax-year"/);
  assert.match(html, /id="chargeable-income"/);
  assert.match(html, /id="resident-confirmation"/);
  assert.doesNotMatch(html, /name="(?:name|email|phone|address|nationalId|identityNumber)"/i);
  assert.doesNotMatch(html, /type="file"/i);
  assert.match(html, /does not create an account or save calculation history/i);
});

test("calculator does not use browser persistence or cookies", async () => {
  const script = await readFile(new URL("app.js", publicRoot), "utf8");
  assert.doesNotMatch(script, /localStorage|sessionStorage|document\.cookie|indexedDB/);
  assert.match(script, /fetch\("\/v1\/calculate"/);
  assert.match(script, /source\.url/);
});
