import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { OPENAPI_DOCUMENT } from "../apps/api/src/app.js";
import { singaporePackage } from "../packages/country-sg/src/index.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const version = "0.1.0";
const bundleName = `taxcraft-v${version}`;
const outputRoot = join(root, "dist-release");
const bundleRoot = join(outputRoot, bundleName);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(join(bundleRoot, "schemas"), { recursive: true });

await writeJson(join(bundleRoot, "openapi.json"), OPENAPI_DOCUMENT);
await writeJson(join(bundleRoot, "coverage.json"), {
  releaseVersion: version,
  product: "TaxCraft",
  storesUserPII: false,
  advisory: false,
  jurisdictions: [
    {
      jurisdiction: singaporePackage.manifest.jurisdiction,
      name: singaporePackage.manifest.name,
      taxYears: singaporePackage.manifest.taxYears,
      models: Object.fromEntries(singaporePackage.manifest.taxYears.map(({ taxYear }) => [
        taxYear,
        singaporePackage.coverage(taxYear)
      ])),
      sources: singaporePackage.sources
    }
  ]
});
await writeJson(join(bundleRoot, "release-manifest.json"), {
  schemaVersion: 1,
  releaseVersion: version,
  releaseDate: "2026-07-14",
  contractVersion: "taxcraft.contracts.v1",
  contents: [
    "openapi.json",
    "coverage.json",
    "schemas/",
    "README.md",
    "LICENSE",
    "docs/product.md",
    "docs/api.md",
    "docs/release-policy.md"
  ]
});

for (const path of [
  "README.md",
  "LICENSE",
  "docs/product.md",
  "docs/api.md",
  "docs/release-policy.md"
]) {
  await cp(join(root, path), join(bundleRoot, path));
}

for (const source of await findSchemaFiles(join(root, "packages"))) {
  const packageRelative = relative(join(root, "packages"), source);
  const destination = join(bundleRoot, "schemas", packageRelative);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}

console.log(`Release bundle built at ${relative(root, bundleRoot)}.`);

async function findSchemaFiles(directory) {
  const matches = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      matches.push(...await findSchemaFiles(path));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json") && path.split(sep).includes("schemas")) {
      matches.push(path);
    }
  }
  return matches.sort();
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
