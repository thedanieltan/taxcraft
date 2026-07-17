import { readFile } from "node:fs/promises";

const registryUrl = new URL("../catalog/pit-jurisdictions.json", import.meta.url);
const familiesUrl = new URL("../catalog/pit-calculation-families.json", import.meta.url);
const ruleMapUrl = new URL("../catalog/pit-rule-map.json", import.meta.url);
const sourcesUrl = new URL("../catalog/pit-rule-sources.json", import.meta.url);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [registry, familyCatalog, ruleMap, sourceRegistry] = await Promise.all([
  readFile(registryUrl, "utf8").then(JSON.parse),
  readFile(familiesUrl, "utf8").then(JSON.parse),
  readFile(ruleMapUrl, "utf8").then(JSON.parse),
  readFile(sourcesUrl, "utf8").then(JSON.parse),
]);

assert(ruleMap.schemaVersion === "1.0.0", "Unexpected PIT rule-map schema version");
assert(ruleMap.taxDomain === "PIT", "PIT rule map must contain only personal income tax");
assert(sourceRegistry.taxDomain === "PIT", "PIT rule sources must contain only personal income tax");
assert(ruleMap.scope.standard === registry.scope.standard, "Rule map and register use different scope standards");
assert(ruleMap.scope.entityCount === registry.scope.entityCount, "Rule map and register declare different entity counts");

const familyById = new Map(familyCatalog.families.map((family) => [family.id, family]));
const sourceIds = new Set(sourceRegistry.sources.map(({ id }) => id));
const registerByCode = new Map(
  registry.entities.map(([code, alpha3, numericCode, name]) => [
    code,
    {
      ...structuredClone(registry.defaults),
      code,
      alpha3,
      numericCode,
      name,
      ...(registry.overrides[code] ?? {}),
    },
  ]),
);

assert(sourceIds.size === sourceRegistry.sources.length, "Duplicate PIT rule source id");

const assignments = new Map();
function assign(code, classificationStatus, calculationFamily, evidenceIds) {
  assert(registerByCode.has(code), `Rule map references unknown jurisdiction ${code}`);
  assert(!assignments.has(code), `Rule map assigns ${code} more than once`);
  assert(familyById.has(calculationFamily), `${code} references an unknown calculation family`);
  assert(evidenceIds.every((sourceId) => sourceIds.has(sourceId)), `${code} references an unknown source`);
  assignments.set(code, { classificationStatus, calculationFamily, evidenceIds });
}

for (const [code, entry] of Object.entries(ruleMap.implemented)) {
  assign(code, "implemented", entry.calculationFamily, entry.sourceIds);
  const registered = registerByCode.get(code);
  assert(registered.implementationStatus === "implemented", `${code} is not implemented in the register`);
  assert(registered.calculationFamily === entry.calculationFamily, `${code} family differs from the register`);
  assert(entry.sourceIds.length > 0, `${code} implemented mapping has no evidence source`);
}

for (const [familyId, codes] of Object.entries(ruleMap.sourceIndexed.families)) {
  assert(familyId !== "UNMAPPED", "Source-indexed jurisdiction cannot use UNMAPPED");
  assert(familyById.has(familyId), `Unknown source-indexed family ${familyId}`);
  assert(
    ruleMap.sourceIndexed.sourceIds.includes("PWC_WWTS_PIT_QUICK_CHART"),
    "Source-indexed mappings must cite the global summary",
  );
  for (const code of codes) {
    assign(code, "source-indexed", familyId, ruleMap.sourceIndexed.sourceIds);
  }
}

for (const code of ruleMap.sourceDiscovery) {
  assign(code, "source-discovery", "UNMAPPED", []);
}

for (const code of Object.keys(ruleMap.structuralOverrides)) {
  assert(assignments.has(code), `Structural override references unassigned jurisdiction ${code}`);
  assert(
    assignments.get(code).classificationStatus !== "source-discovery",
    `Structural override prematurely classifies source-discovery jurisdiction ${code}`,
  );
}

assert(assignments.size === registry.scope.entityCount, "Rule map does not cover the complete register");
for (const code of registerByCode.keys()) {
  assert(assignments.has(code), `Rule map omits registered jurisdiction ${code}`);
}

const statusCounts = [...assignments.values()].reduce((result, assignment) => {
  result[assignment.classificationStatus] = (result[assignment.classificationStatus] ?? 0) + 1;
  return result;
}, {});

assert(statusCounts.implemented === 2, "The rule map must preserve the two existing implemented packages");
assert(statusCounts["source-indexed"] === 145, "Unexpected global-summary source coverage");
assert(statusCounts["source-discovery"] === 102, "Unexpected source-discovery backlog");

for (const [code, assignment] of assignments) {
  const family = familyById.get(assignment.calculationFamily);
  assert(
    family.implementationWave === null || Number.isInteger(family.implementationWave),
    `${code} has an invalid implementation wave`,
  );
  if (assignment.calculationFamily === "NO_PIT") {
    const layers = ruleMap.structuralOverrides[code]?.taxLayers;
    if (layers) assert(layers.national === false, `${code} NO_PIT override declares national PIT`);
  }
}

console.log(
  `PIT rule-map checks passed: ${assignments.size} jurisdictions, ` +
  `${statusCounts.implemented} implemented, ${statusCounts["source-indexed"]} source-indexed, ` +
  `${statusCounts["source-discovery"]} awaiting source discovery.`,
);
