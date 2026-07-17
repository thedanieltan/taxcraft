import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [html, app, styles] = await Promise.all([
  readFile(new URL("../apps/calculator/public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../apps/calculator/public/app.js", import.meta.url), "utf8"),
  readFile(new URL("../apps/calculator/public/styles.css", import.meta.url), "utf8"),
]);

test("reference interface presents the global PIT catalogue", () => {
  assert.match(html, /Global personal income tax calculators/);
  assert.match(html, /id="jurisdiction"/);
  assert.match(html, /id="catalogue-stats"/);
  assert.doesNotMatch(html, /Singapore personal income tax estimate/);
});

test("calculator controls are generated from package input schemas", () => {
  assert.match(app, /\/v1\/pit\/jurisdictions/);
  assert.match(app, /\/input-schema/);
  assert.match(app, /createFieldModel/);
  assert.match(app, /renderFactsSchema/);
  assert.doesNotMatch(app, /employment-income/);
  assert.doesNotMatch(app, /personal-reliefs/);
});

test("unimplemented jurisdictions remain visible without a calculation form", () => {
  assert.match(app, /Source-indexed — calculator pending/);
  assert.match(app, /Source discovery pending/);
  assert.match(app, /if \(!detail\.calculator\?\.available\) return/);
  assert.match(app, /planning metadata, not a calculator/);
});

test("interface keeps privacy, accessibility and responsive states", () => {
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /does not create accounts or save calculation history/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /button:disabled/);
});
