import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const registry = JSON.parse(
  await readFile(new URL("../catalog/pit-jurisdictions.json", import.meta.url), "utf8"),
);
const resolved = registry.entities.map(([code, alpha3, numericCode, name]) => ({
  ...structuredClone(registry.defaults),
  code,
  alpha3,
  numericCode,
  name,
  ...(registry.overrides[code] ?? {}),
}));

test("global PIT register covers its complete declared ISO scope", () => {
  assert.equal(registry.scope.standard, "ISO 3166-1");
  assert.equal(resolved.length, registry.scope.entityCount);
  assert.equal(new Set(resolved.map(({ code }) => code)).size, registry.scope.entityCount);
});

test("existing Singapore and United Kingdom packages remain represented", () => {
  const byCode = new Map(resolved.map((jurisdiction) => [jurisdiction.code, jurisdiction]));
  assert.equal(byCode.get("SG").package, "@taxcraft/country-sg");
  assert.deepEqual(byCode.get("SG").supportedTaxYears, ["YA2024", "YA2025", "YA2026"]);
  assert.equal(byCode.get("GB").package, "@taxcraft/country-gb");
  assert.deepEqual(byCode.get("GB").supportedTaxYears, ["2024-25", "2025-26", "2026-27"]);
});

test("unmapped jurisdictions remain visible in the implementation backlog", () => {
  const unmapped = resolved.filter(({ mappingStatus }) => mappingStatus === "unmapped");
  assert.ok(unmapped.length > 0);
  assert.ok(unmapped.every(({ implementationStatus }) => implementationStatus === "not-started"));
  assert.ok(unmapped.every(({ calculationFamily }) => calculationFamily === "UNMAPPED"));
});
