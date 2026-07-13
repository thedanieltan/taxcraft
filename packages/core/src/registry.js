import { ACCEPTED_SOURCE_TYPES, MODEL_STATUS } from "@taxcraft/contracts";

const acceptedSourceTypes = new Set(ACCEPTED_SOURCE_TYPES);
const activeStates = new Set([MODEL_STATUS.CANDIDATE, MODEL_STATUS.CURRENT, MODEL_STATUS.HISTORICAL_SUPPORTED]);

export function createRegistry(countryPackages = []) {
  const packages = new Map();
  for (const countryPackage of countryPackages) {
    validateCountryPackage(countryPackage);
    const jurisdiction = countryPackage.manifest.jurisdiction;
    if (packages.has(jurisdiction)) throw new Error(`Duplicate country package for ${jurisdiction}.`);
    packages.set(jurisdiction, countryPackage);
  }

  return Object.freeze({
    get(jurisdiction) {
      return packages.get(jurisdiction);
    },
    list() {
      return [...packages.values()].map(({ manifest }) => structuredClone(manifest));
    },
  });
}

export function validateCountryPackage(countryPackage) {
  if (!countryPackage || typeof countryPackage !== "object") throw new Error("Country package must be an object.");
  const { manifest, sources, validateFacts, calculate } = countryPackage;
  if (!manifest || !/^[A-Z]{2}$/.test(manifest.jurisdiction ?? "")) throw new Error("Country package jurisdiction must be a two-letter uppercase code.");
  if (!Array.isArray(manifest.taxYears) || manifest.taxYears.length === 0) throw new Error("Country package must declare at least one tax year.");
  if (manifest.taxYears.length > 3) throw new Error("Country package cannot expose more than three tax years.");

  const years = new Set();
  let currentCount = 0;
  for (const version of manifest.taxYears) {
    if (!version || typeof version.taxYear !== "string" || typeof version.modelVersion !== "string") throw new Error("Each tax year requires taxYear and modelVersion.");
    if (years.has(version.taxYear)) throw new Error(`Duplicate tax year ${version.taxYear}.`);
    years.add(version.taxYear);
    if (!activeStates.has(version.status)) throw new Error(`Tax year ${version.taxYear} has an inactive or invalid status.`);
    if (version.status === MODEL_STATUS.CURRENT) currentCount += 1;
  }
  if (currentCount !== 1) throw new Error("Country package must expose exactly one current tax year.");
  if (manifest.storesUserPII !== false || manifest.advisory !== false) throw new Error("Country package must preserve TaxCraft privacy and non-advisory boundaries.");

  if (!Array.isArray(sources) || sources.length === 0) throw new Error("Country package must declare official sources.");
  const sourceIds = new Set();
  for (const source of sources) {
    if (!source?.sourceId || sourceIds.has(source.sourceId)) throw new Error("Source IDs must be present and unique.");
    if (!acceptedSourceTypes.has(source.publisherType)) throw new Error(`Source ${source.sourceId} does not use an accepted official publisher type.`);
    if (typeof source.url !== "string" || !source.url.startsWith("https://")) throw new Error(`Source ${source.sourceId} must use an HTTPS URL.`);
    sourceIds.add(source.sourceId);
  }
  if (typeof validateFacts !== "function" || typeof calculate !== "function") throw new Error("Country package must implement validateFacts and calculate.");
}
