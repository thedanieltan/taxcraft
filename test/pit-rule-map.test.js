import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [registry, families, ruleMap, sources] = await Promise.all([
  readFile(new URL("../catalog/pit-jurisdictions.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../catalog/pit-calculation-families.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../catalog/pit-rule-map.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../catalog/pit-rule-sources.json", import.meta.url), "utf8").then(JSON.parse),
]);

function resolveAssignments() {
  const assignments = new Map();
  for (const [code, entry] of Object.entries(ruleMap.implemented)) {
    assignments.set(code, { status: "implemented", family: entry.calculationFamily });
  }
  for (const [family, codes] of Object.entries(ruleMap.sourceIndexed.families)) {
    for (const code of codes) assignments.set(code, { status: "source-indexed", family });
  }
  for (const code of ruleMap.sourceDiscovery) {
    assignments.set(code, { status: "source-discovery", family: "UNMAPPED" });
  }
  return assignments;
}

test("global PIT rule map covers the complete jurisdiction register", () => {
  const assignments = resolveAssignments();
  assert.equal(assignments.size, registry.scope.entityCount);
  assert.deepEqual(
    [...assignments.keys()].sort(),
    registry.entities.map(([code]) => code).sort(),
  );
});

test("rule map distinguishes implemented, indexed and discovery work", () => {
  const counts = [...resolveAssignments().values()].reduce((result, entry) => {
    result[entry.status] = (result[entry.status] ?? 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, {
    implemented: 2,
    "source-indexed": 145,
    "source-discovery": 102,
  });
});

test("implemented Singapore and United Kingdom mappings remain verified", () => {
  assert.equal(ruleMap.implemented.SG.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.equal(ruleMap.implemented.GB.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.ok(ruleMap.implemented.SG.sourceIds.includes("TAXCRAFT_COUNTRY_SG"));
  assert.ok(ruleMap.implemented.GB.sourceIds.includes("TAXCRAFT_COUNTRY_GB"));
});

test("source-indexed families produce an ordered calculator backlog", () => {
  const waveByFamily = new Map(families.families.map(({ id, implementationWave }) => [id, implementationWave]));
  assert.ok(ruleMap.sourceIndexed.families.NO_PIT.length > 0);
  assert.ok(ruleMap.sourceIndexed.families.FLAT_WITH_ALLOWANCE.length > 0);
  for (const [family, codes] of Object.entries(ruleMap.sourceIndexed.families)) {
    assert.notEqual(family, "UNMAPPED");
    assert.ok(Number.isInteger(waveByFamily.get(family)));
    assert.ok(codes.length > 0);
  }
});

test("global summary evidence is planning metadata, not calculator parameters", () => {
  const source = sources.sources.find(({ id }) => id === "PWC_WWTS_PIT_QUICK_CHART");
  assert.equal(source.type, "secondary-summary");
  assert.match(source.scope, /not a source for calculator parameters/i);
  assert.deepEqual(ruleMap.sourceIndexed.sourceIds, [source.id]);
});
