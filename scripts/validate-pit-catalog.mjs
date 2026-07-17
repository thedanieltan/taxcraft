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

const [baseRegistry, familyCatalog, ruleMap, ruleSources, implementationOverrides] = await Promise.all([
  readFile(registryUrl, "utf8").then(JSON.parse),
  readFile(familiesUrl, "utf8").then(JSON.parse),
  readFile(ruleMapUrl, "utf8").then(JSON.parse),
  readFile(sourcesUrl, "utf8").then(JSON.parse),
  readFile(implementationsUrl, "utf8").then(JSON.parse),
]);
const registry = applyPitImplementationOverrides({
  jurisdictionRegister: baseRegistry,
  ruleMap,
  ruleSources,
  implementationOverrides,
}).jurisdictionRegister;

assert(registry.schemaVersion === "1.0.0", "Unexpected PIT register schema version");
assert(registry.taxDomain === "PIT", "PIT register must contain only personal income tax");
assert(registry.defaults.taxDomain === "PIT", "PIT register defaults must remain in the PIT domain");
assert(registry.scope.standard === "ISO 3166-1", "PIT register must declare its ISO 3166-1 scope");
assert(registry.scope.entityCount === registry.entities.length, "Declared PIT jurisdiction count does not match the register");

const mappingStatuses = new Set(registry.statuses.mapping);
const implementationStatuses = new Set(registry.statuses.implementation);
const familyIds = new Set(familyCatalog.families.map(({ id }) => id));
const seenCodes = new Set();
const seenAlpha3 = new Set();
let previousCode = "";

const resolved = registry.entities.map(([code, alpha3, numericCode, name]) => ({
  ...structuredClone(registry.defaults),
  code,
  alpha3,
  numericCode,
  name,
  ...(registry.overrides[code] ?? {}),
}));

for (const jurisdiction of resolved) {
  assert(/^[A-Z]{2}$/.test(jurisdiction.code), `Invalid alpha-2 code: ${jurisdiction.code}`);
  assert(/^[A-Z]{3}$/.test(jurisdiction.alpha3), `Invalid alpha-3 code: ${jurisdiction.alpha3}`);
  assert(/^[0-9]{3}$/.test(jurisdiction.numericCode), `Invalid numeric code: ${jurisdiction.numericCode}`);
  assert(jurisdiction.taxDomain === "PIT", `${jurisdiction.code} has an unexpected tax domain`);
  assert(!seenCodes.has(jurisdiction.code), `Duplicate alpha-2 code: ${jurisdiction.code}`);
  assert(!seenAlpha3.has(jurisdiction.alpha3), `Duplicate alpha-3 code: ${jurisdiction.alpha3}`);
  assert(previousCode < jurisdiction.code, "PIT jurisdictions must be sorted by alpha-2 code");
  assert(mappingStatuses.has(jurisdiction.mappingStatus), `${jurisdiction.code} has an invalid mapping status`);
  assert(implementationStatuses.has(jurisdiction.implementationStatus), `${jurisdiction.code} has an invalid implementation status`);
  assert(familyIds.has(jurisdiction.calculationFamily), `${jurisdiction.code} references an unknown calculation family`);

  if (jurisdiction.mappingStatus === "unmapped") {
    assert(jurisdiction.calculationFamily === "UNMAPPED", `${jurisdiction.code} is unmapped but declares a calculation family`);
  }
  if (jurisdiction.implementationStatus !== "not-started") {
    assert(jurisdiction.mappingStatus === "mapped", `${jurisdiction.code} is implemented before mapping`);
  }
  if (["implemented", "deployed", "live-accepted", "maintenance-blocked"].includes(jurisdiction.implementationStatus)) {
    assert(jurisdiction.package, `${jurisdiction.code} has no package`);
    assert(jurisdiction.supportedTaxYears.length > 0, `${jurisdiction.code} has no supported tax years`);
    assert(jurisdiction.coverageSummary, `${jurisdiction.code} has no coverage summary`);
  }

  seenCodes.add(jurisdiction.code);
  seenAlpha3.add(jurisdiction.alpha3);
  previousCode = jurisdiction.code;
}

for (const overrideCode of Object.keys(registry.overrides)) {
  assert(seenCodes.has(overrideCode), `Override references unknown jurisdiction ${overrideCode}`);
}

for (const requiredCode of ["GB", "SG", ...Object.keys(implementationOverrides.implementations)]) {
  const jurisdiction = resolved.find(({ code }) => code === requiredCode);
  assert(jurisdiction, `Missing implemented jurisdiction ${requiredCode}`);
  assert(jurisdiction.implementationStatus === "implemented", `${requiredCode} must remain implemented`);
}

assert(
  !familyCatalog.families.some(({ id }) => id === "UNMAPPED" && Number.isInteger(familyCatalog.implementationWave)),
  "UNMAPPED must not be assigned to an implementation wave",
);

console.log(
  `PIT catalog checks passed: ${resolved.length} ISO 3166-1 jurisdictions, ` +
  `${resolved.filter(({ mappingStatus }) => mappingStatus === "mapped").length} mapped, ` +
  `${resolved.filter(({ implementationStatus }) => implementationStatus === "implemented").length} implemented.`,
);
