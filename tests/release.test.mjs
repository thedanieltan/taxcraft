import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("published v0.1.0 release inputs remain explicit and reproducible", async () => {
  const builder = await read("scripts/build-release.mjs");
  const notes = await read("release/v0.1.0.md");

  assert.match(builder, /const version = "0\.1\.0"/);
  assert.match(builder, /openapi\.json/);
  assert.match(builder, /coverage\.json/);
  assert.match(builder, /release-manifest\.json/);
  assert.match(notes, /TaxCraft v0\.1\.0/);
  assert.match(notes, /Singapore resident personal income tax for YA 2024, YA 2025 and YA 2026/);
});

test("release workflow tests before creating an immutable tag", async () => {
  const workflow = await read(".github/workflows/release-v0.1.0.yml");
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /gh release view v0\.1\.0/);
  assert.match(workflow, /gh release create v0\.1\.0/);
  assert.match(workflow, /--target "\$GITHUB_SHA"/);
  assert.match(workflow, /taxcraft-v0\.1\.0-contracts\.tar\.gz/);
  assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v\d/);
});
