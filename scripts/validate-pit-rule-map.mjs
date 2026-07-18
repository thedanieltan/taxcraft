import { readFile } from "node:fs/promises";
import { applyPitImplementationOverrides } from "./pit-implementation-overrides.mjs";

const registryUrl = new URL("../catalog/pit-jurisdictions.json", import.meta.url);
const familiesUrl = new URL("../catalog/pit-calculation-families.json", import.meta.url);
const ruleMapUrl = new URL("../catalog/pit-rule-map.json", import.meta.url);
const sourcesUrl = new URL("../catalog/pit-rule-sources.json", import.meta.url);
const implementationsUrl = new URL("../catalog/pit-implementation-overrides.json", import.meta.url);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [baseRegistry, familyCatalog, baseRuleMap, baseSourceRegistry, implementationOverrides] = await Promise.all([
  readFile(registryUrl, "utf8").then(JSON.parse),
  readFile(familiesUrl, "utf8").then(JSON.parse),
  readFile(ruleMapUrl, "utf8").then(JSON.parse),
  readFile(sourcesUrl, "utf8").then(JSON.parse),
  readFile(implementationsUrl, "utf8").then(JSON.parse),
]);

assert(implementationOverrides.schemaVersion === "1.0.0", "Unexpected implementation-overlay schema version");
assert(implementationOverrides.taxDomain === "PIT", "Implementation overlay must contain only personal income tax");
assert(implementationOverrides.source?.id, "Implementation overlay requires a repository source");
assert(Object.keys(implementationOverrides.implementations).length > 0, "Implementation overlay must contain at least one package");

const registeredCodes = new Set(baseRegistry.entities.map(([code]) => code));
for (const [code, implementation] of Object.entries(implementationOverrides.implementations)) {
  assert(registeredCodes.has(code), `Implementation overlay references unknown jurisdiction ${code}`);
  assert(!baseRuleMap.implemented[code], `${code} is already implemented in the base rule map`);
  assert(implementation.calculationFamily !== "UNMAPPED", `${code} cannot be implemented as UNMAPPED`);
  assert(implementation.sourceIds.includes(implementationOverrides.source.id), `${code} omits the implementation package source`);
  assert(implementation.register?.implementationStatus === "implemented", `${code} register status is not implemented`);
  assert(implementation.register?.package === "@taxcraft/country-no-pit", `${code} points to the wrong package bundle`);
  assert(Array.isArray(implementation.register?.supportedTaxYears) && implementation.register.supportedTaxYears.length > 0, `${code} has no supported tax years`);
}

const merged = applyPitImplementationOverrides({
  jurisdictionRegister: baseRegistry,
  ruleMap: baseRuleMap,
  ruleSources: baseSourceRegistry,
  implementationOverrides,
});
const registry = merged.jurisdictionRegister;
const ruleMap = merged.ruleMap;
const sourceRegistry = merged.ruleSources;

assert(ruleMap.schemaVersion === "1.1.0", "Unexpected PIT rule-map schema version");
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

const indexedCodes = new Set();
for (const [familyId, codes] of Object.entries(ruleMap.sourceIndexed.families)) {
  assert(familyId !== "UNMAPPED", "Source-indexed jurisdiction cannot use UNMAPPED");
  assert(familyById.has(familyId), `Unknown source-indexed family ${familyId}`);
  for (const code of codes) {
    assert(!indexedCodes.has(code), `Source-indexed jurisdiction ${code} appears in multiple families`);
    indexedCodes.add(code);
  }
}

const declaredSourceIds = new Set(ruleMap.sourceIndexed.sourceIds);
const evidenceSourceIds = new Set(Object.keys(ruleMap.sourceIndexed.evidenceGroups));
assert(declaredSourceIds.size === ruleMap.sourceIndexed.sourceIds.length, "Source-indexed source list contains duplicates");
assert(
  declaredSourceIds.size === evidenceSourceIds.size && [...declaredSourceIds].every((sourceId) => evidenceSourceIds.has(sourceId)),
  "Source-indexed source list and evidence groups differ",
);

const evidenceByCode = new Map();
for (const [sourceId, codes] of Object.entries(ruleMap.sourceIndexed.evidenceGroups)) {
  assert(sourceIds.has(sourceId), `Evidence group references unknown source ${sourceId}`);
  for (const code of codes) {
    assert(indexedCodes.has(code), `Evidence group classifies non-indexed jurisdiction ${code}`);
    const evidence = evidenceByCode.get(code) ?? [];
    evidence.push(sourceId);
    evidenceByCode.set(code, evidence);
  }
}

for (const [familyId, codes] of Object.entries(ruleMap.sourceIndexed.families)) {
  for (const code of codes) {
    const evidenceIds = evidenceByCode.get(code) ?? [];
    assert(evidenceIds.length > 0, `${code} has no source-index evidence`);
    assign(code, "source-indexed", familyId, evidenceIds);
  }
}

for (const code of ruleMap.sourceDiscovery) assign(code, "source-discovery", "UNMAPPED", []);

for (const code of Object.keys(ruleMap.structuralOverrides)) {
  assert(assignments.has(code), `Structural override references unassigned jurisdiction ${code}`);
  assert(assignments.get(code).classificationStatus !== "source-discovery", `Structural override prematurely classifies source-discovery jurisdiction ${code}`);
}

assert(assignments.size === registry.scope.entityCount, "Rule map does not cover the complete register");
for (const code of registerByCode.keys()) assert(assignments.has(code), `Rule map omits registered jurisdiction ${code}`);

const statusCounts = [...assignments.values()].reduce((result, assignment) => {
  result[assignment.classificationStatus] = (result[assignment.classificationStatus] ?? 0) + 1;
  return result;
}, {});
const promotedCount = Object.keys(implementationOverrides.implementations).length;
assert(statusCounts.implemented === 2 + promotedCount, "Unexpected implemented package count");
assert(statusCounts["source-indexed"] === 161 - promotedCount, "Unexpected source-indexed coverage");
assert(statusCounts["source-discovery"] === 86, "Unexpected source-discovery backlog");

for (const [code, assignment] of assignments) {
  const family = familyById.get(assignment.calculationFamily);
  assert(family.implementationWave === null || Number.isInteger(family.implementationWave), `${code} has an invalid implementation wave`);
  if (assignment.calculationFamily === "NO_PIT") {
    const layers = ruleMap.structuralOverrides[code]?.taxLayers;
    if (layers) assert(layers.national === false, `${code} NO_PIT override declares national PIT`);
  }
}

const eyEvidence = new Set(ruleMap.sourceIndexed.evidenceGroups.EY_WORLDWIDE_PERSONAL_TAX_2025_26 ?? []);
for (const contactOnlyCode of ["AI", "AG", "DM", "FO", "GD", "FM", "MH", "MS", "PW", "KN", "VC", "SY"]) {
  assert(!eyEvidence.has(contactOnlyCode), `${contactOnlyCode} was promoted from an EY contact-only entry`);
}

console.log(
  `PIT rule-map checks passed: ${assignments.size} jurisdictions, ` +
  `${statusCounts.implemented} implemented, ${statusCounts["source-indexed"]} source-indexed, ` +
  `${statusCounts["source-discovery"]} awaiting source discovery.`,
);
