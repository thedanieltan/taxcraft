import { readFile } from "node:fs/promises";
import {
  listPitImplementationEntries,
  loadPitImplementationOverlays,
} from "./pit-implementation-overlay-set.mjs";

const root = new URL("../", import.meta.url);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [registry, families, ruleMap, plan, implementationOverlays] = await Promise.all([
  readFile(new URL("catalog/pit-jurisdictions.json", root), "utf8").then(JSON.parse),
  readFile(new URL("catalog/pit-calculation-families.json", root), "utf8").then(JSON.parse),
  readFile(new URL("catalog/pit-rule-map.json", root), "utf8").then(JSON.parse),
  readFile(new URL("catalog/pit-discovery-plan.json", root), "utf8").then(JSON.parse),
  loadPitImplementationOverlays(root),
]);

assert(plan.schemaVersion === "1.0.0", "Unexpected PIT discovery-plan schema version");
assert(plan.taxDomain === "PIT", "Discovery plan must contain only PIT planning records");
assert(plan.scope?.basis === "Base pit-rule-map sourceDiscovery inventory", "Unexpected discovery-plan scope basis");

const registeredCodes = new Set(registry.entities.map(([code]) => code));
const familyIds = new Set(families.families.map(({ id }) => id));
const discoveryCodes = new Set(ruleMap.sourceDiscovery);
const entryCodes = new Set(Object.keys(plan.entries ?? {}));
const dispositionIds = new Set(plan.dispositions ?? []);
const sourcePlanIds = new Set(Object.keys(plan.sourcePlans ?? {}));
const promotedCodes = new Set(listPitImplementationEntries(implementationOverlays).map(({ code }) => code));

assert(plan.scope.entityCount === discoveryCodes.size, "Discovery-plan entity count differs from the base backlog");
assert(entryCodes.size === discoveryCodes.size, "Discovery plan does not contain exactly one record per base backlog jurisdiction");
for (const code of discoveryCodes) assert(entryCodes.has(code), `Discovery plan omits ${code}`);
for (const code of entryCodes) assert(discoveryCodes.has(code), `Discovery plan includes non-backlog jurisdiction ${code}`);

const allowedDispositions = new Set([
  "ALREADY_IMPLEMENTED",
  "DIRECT_CALCULATOR",
  "PARENT_SYSTEM_DERIVATIVE",
  "NO_PIT_VERIFICATION",
  "NO_RESIDENT_POPULATION",
  "RESTRICTED_OR_DISPUTED_SOURCE",
]);
assert(dispositionIds.size === allowedDispositions.size, "Discovery-plan disposition catalogue differs from the accepted set");
for (const disposition of allowedDispositions) assert(dispositionIds.has(disposition), `Missing disposition ${disposition}`);

const counts = {};
for (const [code, entry] of Object.entries(plan.entries)) {
  assert(registeredCodes.has(code), `Discovery plan references unknown jurisdiction ${code}`);
  assert(familyIds.has(entry.planningFamily), `${code} references unknown planning family ${entry.planningFamily}`);
  assert(entry.planningFamily !== "UNMAPPED", `${code} remains structurally unmapped`);
  assert(allowedDispositions.has(entry.disposition), `${code} has invalid disposition ${entry.disposition}`);
  assert(sourcePlanIds.has(entry.sourcePlan), `${code} references unknown source plan ${entry.sourcePlan}`);
  assert(Number.isInteger(entry.priority) && entry.priority >= 0 && entry.priority <= 4, `${code} has invalid priority`);

  if (entry.parentJurisdiction) {
    assert(registeredCodes.has(entry.parentJurisdiction), `${code} references unknown parent ${entry.parentJurisdiction}`);
    assert(entry.parentJurisdiction !== code, `${code} cannot be its own parent jurisdiction`);
  }
  if (entry.disposition === "PARENT_SYSTEM_DERIVATIVE") {
    assert(entry.parentJurisdiction, `${code} parent-system derivative omits its parent jurisdiction`);
  }
  if (entry.disposition === "NO_RESIDENT_POPULATION") {
    assert(entry.planningFamily === "NO_PIT", `${code} no-resident disposition must use the NO_PIT planning family`);
  }
  if (entry.disposition === "ALREADY_IMPLEMENTED") {
    assert(promotedCodes.has(code), `${code} is marked implemented without an accepted implementation overlay`);
  }

  counts[entry.disposition] = (counts[entry.disposition] ?? 0) + 1;
}

for (const [disposition, expected] of Object.entries(plan.summary ?? {})) {
  assert(counts[disposition] === expected, `Discovery-plan summary differs for ${disposition}`);
}
assert(Object.values(counts).reduce((sum, value) => sum + value, 0) === discoveryCodes.size, "Discovery disposition totals are incomplete");

const promotedFromDiscovery = [...promotedCodes].filter((code) => discoveryCodes.has(code));
for (const code of promotedFromDiscovery) {
  assert(plan.entries[code].disposition === "ALREADY_IMPLEMENTED", `${code} was promoted from discovery but the plan is stale`);
}

for (const [sourcePlanId, sourcePlan] of Object.entries(plan.sourcePlans)) {
  assert(Array.isArray(sourcePlan.requiredEvidence) && sourcePlan.requiredEvidence.length > 0, `${sourcePlanId} lacks required evidence`);
  assert(typeof sourcePlan.exitCriteria === "string" && sourcePlan.exitCriteria.length > 0, `${sourcePlanId} lacks exit criteria`);
}

console.log(
  `PIT discovery-plan checks passed: ${entryCodes.size} base-backlog jurisdictions, ` +
  `${counts.DIRECT_CALCULATOR} direct calculators, ${counts.PARENT_SYSTEM_DERIVATIVE} parent derivatives, ` +
  `${counts.NO_PIT_VERIFICATION} no-PIT verifications, ${counts.NO_RESIDENT_POPULATION} no-resident territories, ` +
  `${counts.RESTRICTED_OR_DISPUTED_SOURCE} restricted or disputed source cases.`,
);
