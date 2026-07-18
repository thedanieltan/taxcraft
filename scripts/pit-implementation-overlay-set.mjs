import { readFile } from "node:fs/promises";
import { applyPitImplementationOverrides } from "./pit-implementation-overrides.mjs";

export async function loadPitImplementationOverlays(root) {
  const manifest = await readJson(new URL("catalog/pit-implementation-overlays.json", root));
  if (manifest.schemaVersion !== "1.0.0") {
    throw new Error("Unexpected PIT implementation-overlay manifest version.");
  }
  if (manifest.taxDomain !== "PIT") {
    throw new Error("PIT implementation-overlay manifest must contain only personal income tax.");
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error("PIT implementation-overlay manifest requires at least one file.");
  }
  if (new Set(manifest.files).size !== manifest.files.length) {
    throw new Error("PIT implementation-overlay manifest contains duplicate files.");
  }
  for (const file of manifest.files) {
    if (typeof file !== "string" || !/^pit-implementation-overrides(?:-[a-z0-9-]+)?\.json$/.test(file)) {
      throw new Error(`Invalid PIT implementation-overlay file ${String(file)}.`);
    }
  }

  return Promise.all(manifest.files.map((file) => readJson(new URL(`catalog/${file}`, root))));
}

export function applyPitImplementationOverlaySet({
  jurisdictionRegister,
  ruleMap,
  ruleSources,
  implementationOverlays,
}) {
  let merged = {
    jurisdictionRegister: structuredClone(jurisdictionRegister),
    ruleMap: structuredClone(ruleMap),
    ruleSources: structuredClone(ruleSources),
  };

  for (const implementationOverrides of implementationOverlays) {
    merged = applyPitImplementationOverrides({
      ...merged,
      implementationOverrides,
    });
  }
  return merged;
}

export function listPitImplementationEntries(implementationOverlays) {
  return implementationOverlays.flatMap((overlay) => Object.entries(overlay.implementations).map(([code, implementation]) => ({
    code,
    implementation,
    overlay,
  })));
}

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}
