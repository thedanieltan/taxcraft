import { readFile } from "node:fs/promises";

async function load(name) {
  return JSON.parse(await readFile(new URL(`../policies/${name}.json`, import.meta.url), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const [product, lifecycle, sources, privacy, nonAdvisory, automation] = await Promise.all([
  load("product"),
  load("lifecycle"),
  load("sources"),
  load("privacy"),
  load("non-advisory"),
  load("automation"),
]);

assert(product.service === "personal-income-tax-calculation", "Unexpected service scope");
assert(product.storesUserPII === false, "TaxCraft must not store user PII");
assert(product.advisory === false, "TaxCraft must remain non-advisory");
assert(product.externalPackages.reviewedByTaxCraft === false, "External packages must not create a review duty");
assert(lifecycle.supportedVersionsPerJurisdiction === 3, "Support window must remain three versions");
assert(lifecycle.reviewHistoricalVersionsOnSchedule === false, "Historical versions must not require scheduled review");
assert(sources.officialOnly === true, "Production parameters require official sources");
assert(sources.parameterSourceLinkRequired === true, "Every material parameter must link to a source");
assert(privacy.persistCalculationInputs === false, "Calculation inputs must not be persisted");
assert(privacy.persistCalculationResults === false, "Calculation results must not be persisted");
assert(privacy.logRequestBodies === false, "Request bodies must not be logged");
assert(nonAdvisory.recommendActions === false, "TaxCraft must not recommend user actions");
assert(automation.failClosedOnAmbiguity === true, "Ambiguous updates must fail closed");
assert(automation.independentVerificationRequired === true, "Autonomous updates need independent verification");

console.log("Policy checks passed.");
