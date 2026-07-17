import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { applyPitImplementationOverrides } from "./pit-implementation-overrides.mjs";

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

const merged = applyPitImplementationOverrides({
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

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

function generated(name, value) {
  return `export const ${name} = Object.freeze(${JSON.stringify(value, null, 2)});`;
}