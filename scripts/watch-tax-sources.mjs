import { readFile, writeFile } from "node:fs/promises";

import { SINGAPORE_MODEL_DATA } from "../packages/country-sg/src/model-data.js";
import {
  evaluateSingaporeUpdate,
  extractSingaporeIndependent,
  extractSingaporePrimary,
  renderObservation,
  renderRetirementRecords,
  renderSingaporeModelData,
  renderSingaporeSources
} from "../packages/maintenance/src/index.js";

const writeChanges = process.argv.includes("--write");
const dateArgument = process.argv.find((argument) => argument.startsWith("--date="))?.slice("--date=".length);
const now = dateArgument ? new Date(`${dateArgument}T00:00:00Z`) : new Date();
if (Number.isNaN(now.valueOf())) throw new Error("Invalid --date value.");

const registryUrl = new URL("../automation/sources/sg-iras-resident-rates.json", import.meta.url);
const observationUrl = new URL("../automation/observations/sg-current.json", import.meta.url);
const modelDataUrl = new URL("../packages/country-sg/src/model-data.js", import.meta.url);
const sourcesUrl = new URL("../packages/country-sg/src/sources.js", import.meta.url);
const retirementsUrl = new URL("../automation/retirements/sg.json", import.meta.url);

const registry = await readJson(registryUrl);
const currentObservation = await readJson(observationUrl);
const response = await fetch(registry.url, {
  headers: {
    accept: "text/html,application/xhtml+xml",
    "user-agent": "TaxCraft source monitor (+https://github.com/thedanieltan/taxcraft)"
  },
  redirect: "follow",
  signal: AbortSignal.timeout(30_000)
});

if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}.`);
const finalUrl = new URL(response.url);
if (finalUrl.protocol !== "https:" || finalUrl.hostname !== registry.allowedHost) {
  throw new Error(`Official source redirected outside ${registry.allowedHost}.`);
}
const contentType = response.headers.get("content-type") ?? "";
if (!contentType.includes("text/html")) throw new Error(`Official source returned unsupported content type ${contentType}.`);
const html = await response.text();

const primary = extractSingaporePrimary(html, registry.url);
const independent = extractSingaporeIndependent(html, registry.url);
const latestCurrentOrder = Math.max(...SINGAPORE_MODEL_DATA.taxYears.map((model) => model.order));
const targetOrder = Math.max(latestCurrentOrder, now.getUTCFullYear());
const retrievedAt = now.toISOString().slice(0, 10);
const evaluation = evaluateSingaporeUpdate({
  primary,
  independent,
  currentObservation,
  currentModelData: SINGAPORE_MODEL_DATA,
  targetOrder,
  retrievedAt,
  allowedHost: registry.allowedHost,
  supportWindow: registry.supportWindow
});

if (evaluation.status === "no-change") {
  console.info(JSON.stringify({ event: "tax_source_no_change", jurisdiction: "SG", targetTaxYear: `YA${targetOrder}` }));
  process.exit(0);
}

console.info(JSON.stringify({
  event: "tax_source_candidate",
  jurisdiction: "SG",
  targetTaxYear: `YA${targetOrder}`,
  retiredTaxYears: evaluation.retired.map((record) => record.taxYear)
}));

if (!writeChanges) {
  console.info("Candidate verified. Re-run with --write to update repository files.");
  process.exit(0);
}

await writeFile(modelDataUrl, renderSingaporeModelData(evaluation.modelData));
await writeFile(sourcesUrl, renderSingaporeSources(evaluation.observation));
await writeFile(observationUrl, renderObservation(evaluation.observation));
if (evaluation.retired.length) await writeFile(retirementsUrl, renderRetirementRecords(evaluation.retired));
console.info("Verified candidate files written.");

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}
