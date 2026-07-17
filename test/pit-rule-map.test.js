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
    "source-indexed": 161,
    "source-discovery": 86,
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

test("source evidence is planning metadata, not calculator parameters", () => {
  const sourceById = new Map(sources.sources.map((source) => [source.id, source]));
  assert.equal(sourceById.get("PWC_WWTS_PIT_QUICK_CHART").type, "secondary-summary");
  assert.equal(sourceById.get("EY_WORLDWIDE_PERSONAL_TAX_2025_26").type, "secondary-guide");
  assert.match(sourceById.get("PWC_WWTS_PIT_QUICK_CHART").scope, /not a source for calculator parameters/i);
  assert.match(sourceById.get("EY_WORLDWIDE_PERSONAL_TAX_2025_26").scope, /Contact-only entries.*excluded/i);
});

test("EY promotion uses full chapters and excludes contact-only entries", () => {
  const eyCodes = new Set(
    ruleMap.sourceIndexed.evidenceGroups.EY_WORLDWIDE_PERSONAL_TAX_2025_26,
  );
  for (const code of ["AW", "BQ", "FJ", "GU", "LK", "LS", "MC", "MP", "MV", "SR", "SS", "ST", "SX", "VG", "VI", "ZW"]) {
    assert.ok(eyCodes.has(code), `${code} should have a full EY chapter`);
  }
  for (const code of ["AI", "AG", "DM", "FO", "GD", "FM", "MH", "MS", "PW", "KN", "VC", "SY"]) {
    assert.ok(!eyCodes.has(code), `${code} must remain outside EY full-chapter evidence`);
  }
});
