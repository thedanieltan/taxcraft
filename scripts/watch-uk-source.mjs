import { readFile, writeFile } from "node:fs/promises";

import { UK_MODEL_DATA } from "../packages/country-gb/src/model-data.js";
import {
  evaluateUkUpdate,
  extractUkIndependent,
  extractUkPrimary,
  renderUkModelData,
  renderUkObservation,
  renderUkRetirements,
  renderUkSources
} from "../packages/maintenance/src/index.js";

const writeChanges = process.argv.includes("--write");
const dateArgument = process.argv.find((argument) => argument.startsWith("--date="))?.slice("--date=".length);
const now = dateArgument ? new Date(`${dateArgument}T00:00:00Z`) : new Date();
if (Number.isNaN(now.valueOf())) throw new Error("Invalid --date value.");

const registryUrl = new URL("../automation/sources/gb-hmrc-income-tax.json", import.meta.url);
const observationUrl = new URL("../automation/observations/gb-current.json", import.meta.url);
const modelDataUrl = new URL("../packages/country-gb/src/model-data.js", import.meta.url);
const sourcesUrl = new URL("../packages/country-gb/src/sources.js", import.meta.url);
const retirementsUrl = new URL("../automation/retirements/gb.json", import.meta.url);

const registry = await readJson(registryUrl);
const response = await fetch(registry.url, {
  headers: {
    accept: "text/html,application/xhtml+xml",
    "user-agent": "TaxCraft source monitor (+https://github.com/thedanieltan/taxcraft)"
  },
  redirect: "follow",
  signal: AbortSignal.timeout(30_000)
});

if (!response.ok) throw new Error(`UK official source returned HTTP ${response.status}.`);
const finalUrl = new URL(response.url);
if (finalUrl.protocol !== "https:" || finalUrl.hostname !== registry.allowedHost) {
  throw new Error(`UK official source redirected outside ${registry.allowedHost}.`);
}
const contentType = response.headers.get("content-type") ?? "";
if (!contentType.includes("text/html")) throw new Error(`UK official source returned unsupported content type ${contentType}.`);
const html = await response.text();
const retrievedAt = now.toISOString().slice(0, 10);
const evaluation = evaluateUkUpdate({
  primary: extractUkPrimary(html, registry.url),
  independent: extractUkIndependent(html, registry.url),
  currentModelData: UK_MODEL_DATA,
  retrievedAt,
  allowedHost: registry.allowedHost,
  supportWindow: registry.supportWindow
});

if (evaluation.status === "no-change") {
  console.info(JSON.stringify({ event: "tax_source_no_change", jurisdiction: "GB", supportedTaxYears: UK_MODEL_DATA.taxYears.map((model) => model.taxYear) }));
  process.exit(0);
}

console.info(JSON.stringify({
  event: "tax_source_candidate",
  jurisdiction: "GB",
  supportedTaxYears: evaluation.modelData.taxYears.map((model) => model.taxYear),
  retiredTaxYears: evaluation.retired.map((record) => record.taxYear)
}));

if (!writeChanges) {
  console.info("UK candidate verified. Re-run with --write to update repository files.");
  process.exit(0);
}

await writeFile(modelDataUrl, renderUkModelData(evaluation.modelData));
await writeFile(sourcesUrl, renderUkSources(retrievedAt));
await writeFile(observationUrl, renderUkObservation(evaluation.observation));
if (evaluation.retired.length) await writeFile(retirementsUrl, renderUkRetirements(evaluation.retired));
console.info("Verified UK candidate files written.");

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}
