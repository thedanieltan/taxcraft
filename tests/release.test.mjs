import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("release bundle contains machine-readable contracts and coverage", async () => {
  const manifest = JSON.parse(await read("dist-release/taxcraft-v0.1.0/release-manifest.json"));
  const openapi = JSON.parse(await read("dist-release/taxcraft-v0.1.0/openapi.json"));
  const coverage = JSON.parse(await read("dist-release/taxcraft-v0.1.0/coverage.json"));

  assert.equal(manifest.releaseVersion, "0.1.0");
  assert.equal(manifest.contractVersion, "taxcraft.contracts.v1");
  assert.equal(openapi.info.version, "0.1.0");
  assert.deepEqual(coverage.jurisdictions[0].taxYears.map(({ taxYear }) => taxYear), ["YA2024", "YA2025", "YA2026"]);
  assert.equal(coverage.storesUserPII, false);
  assert.equal(coverage.advisory, false);
  await access(new URL("dist-release/taxcraft-v0.1.0/LICENSE", root));
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
