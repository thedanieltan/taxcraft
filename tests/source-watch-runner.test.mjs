import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../scripts/watch-all-sources.mjs", import.meta.url), "utf8");

test("source watcher aggregator converts module URLs to filesystem paths", () => {
  assert.match(source, /fileURLToPath\(new URL\(script, import\.meta\.url\)\)/);
  assert.match(source, /spawnSync\(process\.execPath, \[scriptPath, \.\.\.forwarded\]/);
  assert.doesNotMatch(source, /spawnSync\(process\.execPath, \[new URL/);
});
