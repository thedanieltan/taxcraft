import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const source = new URL("../packages/catalog/src/", import.meta.url);
const destination = new URL("../packages/catalog/dist/", import.meta.url);

const [jurisdictionRegister, calculationFamilies, ruleMap, ruleSources, implementationOverrides] = await Promise.all([
  readJson(new URL("catalog/pit-jurisdictions.json", root)),
  readJson(new URL("catalog/pit-calculation-families.json", root)),
  readJson(new URL("catalog/pit-rule-map.json", root)),
  readJson(new URL("catalog/pit-rule-sources.json", root)),
  readJson(new URL("catalog/pit-implementation-overrides.json", root)),
]);

const merged = applyImplementationOverrides({
  jurisdictionRegister,
  ruleMap,
  ruleSources,
  implementationOverrides,
});

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
await writeFile(
  new URL("data.js", destination),
  [
    generated("PIT_JURISDICTION_REGISTER", merged.jurisdictionRegister),
    generated("PIT_CALCULATION_FAMILIES", calculationFamilies),
    generated("PIT_RULE_MAP", merged.ruleMap),
    generated("PIT_RULE_SOURCES", merged.ruleSources),
    "",
  ].join("\n"),
  "utf8",
);

function applyImplementationOverrides({ jurisdictionRegister, ruleMap, ruleSources, implementationOverrides }) {
  const register = structuredClone(jurisdictionRegister);
  const map = structuredClone(ruleMap);
  const sources = structuredClone(ruleSources);
  const knownSourceIds = new Set(sources.sources.map((entry) => entry.id));

  if (!knownSourceIds.has(implementationOverrides.source.id)) {
    sources.sources.push(structuredClone(implementationOverrides.source));
    knownSourceIds.add(implementationOverrides.source.id);
  }

  for (const [code, implementation] of Object.entries(implementationOverrides.implementations)) {
    register.overrides[code] = {
      ...(register.overrides[code] ?? {}),
      ...structuredClone(implementation.register),
    };

    map.implemented[code] = {
      calculationFamily: implementation.calculationFamily,
      sourceIds: structuredClone(implementation.sourceIds),
      taxYearBasis: implementation.taxYearBasis,
      notes: implementation.notes,
    };

    for (const codes of Object.values(map.sourceIndexed.families)) {
      const index = codes.indexOf(code);
      if (index !== -1) codes.splice(index, 1);
    }
    for (const codes of Object.values(map.sourceIndexed.evidenceGroups)) {
      const index = codes.indexOf(code);
      if (index !== -1) codes.splice(index, 1);
    }
    const discoveryIndex = map.sourceDiscovery.indexOf(code);
    if (discoveryIndex !== -1) map.sourceDiscovery.splice(discoveryIndex, 1);
  }

  map.asOf = implementationOverrides.asOf;
  return { jurisdictionRegister: register, ruleMap: map, ruleSources: sources };
}

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

function generated(name, value) {
  return `export const ${name} = Object.freeze(${JSON.stringify(value, null, 2)});`;
}