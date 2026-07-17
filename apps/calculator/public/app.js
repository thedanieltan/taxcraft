import {
  createFieldModel,
  formatFieldHint,
  formatMoneyMinor,
  humanizeKey,
  parseFieldValue,
  selectPrimaryTotal,
} from "/schema.js";

const jurisdiction = document.querySelector("#jurisdiction");
const jurisdictionStatus = document.querySelector("#jurisdiction-status");
const form = document.querySelector("#tax-form");
const taxYear = document.querySelector("#tax-year");
const factsFields = document.querySelector("#facts-fields");
const message = document.querySelector("#message");
const result = document.querySelector("#result");
const catalogueStats = document.querySelector("#catalogue-stats");

let selectedJurisdiction = null;
let selectedSchema = null;
let fieldModels = [];

await initialize();

jurisdiction.addEventListener("change", async () => {
  await selectJurisdiction(jurisdiction.value);
});

taxYear.addEventListener("change", async () => {
  await loadInputSchema();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  result.hidden = true;

  if (!selectedJurisdiction?.calculator?.available || !selectedSchema) {
    showMessage("The selected jurisdiction does not have an implemented TaxCraft calculator.");
    return;
  }

  const facts = {};
  try {
    for (const model of fieldModels) {
      const input = document.querySelector(`#fact-${CSS.escape(model.name)}`);
      facts[model.name] = parseFieldValue(model, input.value, input.checked);
    }
  } catch (error) {
    showMessage(error.message);
    return;
  }

  try {
    setBusy(true);
    const response = await fetch("/v1/pit/calculate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jurisdiction: selectedJurisdiction.code,
        taxYear: taxYear.value,
        facts,
      }),
    });
    const payload = await response.json();
    if (!response.ok || payload.status !== "ok") {
      showMessage(issueMessage(payload, "The calculation is not supported for the entered facts."));
      return;
    }
    renderResult(payload);
  } catch {
    showMessage("The calculator could not reach the TaxCraft API.");
  } finally {
    setBusy(false);
  }
});

async function initialize() {
  try {
    const [statusResponse, jurisdictionsResponse] = await Promise.all([
      fetch("/v1/pit/status"),
      fetch("/v1/pit/jurisdictions"),
    ]);
    const [status, catalogue] = await Promise.all([
      statusResponse.json(),
      jurisdictionsResponse.json(),
    ]);
    if (!statusResponse.ok || !jurisdictionsResponse.ok) throw new Error("catalogue unavailable");
    renderStats(status);
    renderJurisdictionOptions(catalogue.jurisdictions ?? []);
    jurisdiction.value = catalogue.jurisdictions?.some(({ code }) => code === "SG") ? "SG" : "";
    await selectJurisdiction(jurisdiction.value);
  } catch {
    jurisdiction.replaceChildren(option("", "Catalogue unavailable"));
    showMessage("The global PIT catalogue could not be loaded.");
  }
}

function renderStats(status) {
  const entries = [
    ["Registered", status.jurisdictionCount],
    ["Calculators", status.counts?.implemented ?? 0],
    ["Source-indexed", status.counts?.["source-indexed"] ?? 0],
    ["In discovery", status.counts?.["source-discovery"] ?? 0],
  ];
  catalogueStats.replaceChildren(...entries.flatMap(([label, value]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = String(value);
    return [term, description];
  }));
}

function renderJurisdictionOptions(entries) {
  const groupDefinitions = [
    ["implemented", "Implemented calculators"],
    ["source-indexed", "Source-indexed — calculator pending"],
    ["source-discovery", "Source discovery pending"],
  ];
  const groups = groupDefinitions.map(([status, label]) => {
    const group = document.createElement("optgroup");
    group.label = label;
    for (const entry of entries.filter((candidate) => candidate.classificationStatus === status)) {
      group.append(option(entry.code, `${entry.name} (${entry.code})`));
    }
    return group;
  });
  jurisdiction.replaceChildren(option("", "Select a country or territory"), ...groups);
}

async function selectJurisdiction(code) {
  clearMessage();
  result.hidden = true;
  form.hidden = true;
  jurisdictionStatus.hidden = true;
  selectedJurisdiction = null;
  selectedSchema = null;
  fieldModels = [];
  factsFields.replaceChildren();
  taxYear.replaceChildren();
  if (!code) return;

  try {
    const response = await fetch(`/v1/pit/jurisdictions/${encodeURIComponent(code)}`);
    const detail = await response.json();
    if (!response.ok) throw new Error("jurisdiction unavailable");
    selectedJurisdiction = detail;
    renderJurisdictionStatus(detail);
    if (!detail.calculator?.available) return;

    const versions = [...detail.calculator.taxYears].sort((left, right) => right.order - left.order);
    taxYear.replaceChildren(...versions.map((version) => option(
      version.taxYear,
      `${version.taxYear}${version.status === "current" ? " — current" : ""}`,
    )));
    form.hidden = false;
    await loadInputSchema();
  } catch {
    selectedJurisdiction = null;
    showMessage("Jurisdiction details could not be loaded.");
  }
}

function renderJurisdictionStatus(detail) {
  const heading = document.createElement("div");
  heading.className = "status-heading";
  const title = document.createElement("strong");
  title.textContent = detail.name;
  const badge = document.createElement("span");
  badge.className = `badge badge-${detail.classificationStatus}`;
  badge.textContent = detail.calculator?.available
    ? "Calculator available"
    : detail.classificationStatus === "source-indexed"
      ? "Mapped · calculator pending"
      : "Source discovery pending";
  heading.append(title, badge);

  const description = document.createElement("p");
  description.textContent = detail.calculator?.available
    ? detail.coverageSummary ?? "An implemented TaxCraft package is available."
    : detail.classificationStatus === "source-indexed"
      ? `Provisional family: ${humanizeKey(detail.calculationFamily)}. This is planning metadata, not a calculator.`
      : "This jurisdiction remains in the global backlog while its PIT structure and sources are mapped.";

  const meta = document.createElement("p");
  meta.className = "status-meta";
  meta.textContent = detail.implementationWave === null
    ? `Classification: ${detail.verificationStatus}`
    : `Implementation wave ${detail.implementationWave} · Classification: ${detail.verificationStatus}`;

  jurisdictionStatus.replaceChildren(heading, description, meta);
  jurisdictionStatus.hidden = false;
}

async function loadInputSchema() {
  clearMessage();
  result.hidden = true;
  selectedSchema = null;
  fieldModels = [];
  factsFields.replaceChildren();
  if (!selectedJurisdiction?.calculator?.available || !taxYear.value) return;

  try {
    const response = await fetch(
      `/v1/pit/jurisdictions/${encodeURIComponent(selectedJurisdiction.code)}/${encodeURIComponent(taxYear.value)}/input-schema`,
    );
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message ?? "input schema unavailable");
    selectedSchema = payload.factsSchema;
    renderFactsSchema(payload.factsSchema);
  } catch (error) {
    showMessage(error.message || "The calculator input schema could not be loaded.");
  }
}

function renderFactsSchema(schema) {
  const required = new Set(schema.required ?? []);
  fieldModels = Object.entries(schema.properties).map(([name, property]) => (
    createFieldModel(name, property, required.has(name))
  ));
  factsFields.replaceChildren(...fieldModels.map(renderField));
}

function renderField(model) {
  const wrapper = document.createElement("div");
  wrapper.className = model.control === "checkbox" ? "fact fact-confirmation" : "fact";

  const input = document.createElement(model.control === "select" ? "select" : "input");
  input.id = `fact-${model.name}`;
  input.name = model.name;
  input.required = model.required;

  if (model.control === "checkbox") {
    input.type = "checkbox";
    if (model.constValue === true) input.required = true;
  } else if (model.control === "select") {
    input.append(option("", `Select ${model.title.toLowerCase()}`));
    input.append(...model.enumValues.map((value) => option(value, value)));
  } else {
    input.type = model.control;
    if (model.minimum !== null) input.min = String(model.minimum);
    if (model.maximum !== null) input.max = String(model.maximum);
    if (model.step !== null) input.step = String(model.step);
    if (model.type === "integer" && model.minimum === 0) input.value = "0";
    if (model.type === "integer") input.inputMode = model.step !== null && model.step < 1 ? "decimal" : "numeric";
  }

  const label = document.createElement("label");
  label.htmlFor = input.id;
  const labelText = document.createElement("span");
  labelText.textContent = model.title;
  const hint = document.createElement("small");
  hint.textContent = formatFieldHint(model);

  if (model.control === "checkbox") {
    label.className = "confirmation";
    label.append(input, labelText);
    wrapper.append(label);
  } else {
    label.append(labelText, hint);
    wrapper.append(label, input);
  }

  if (model.description) {
    const description = document.createElement("p");
    description.className = "help";
    description.textContent = model.description;
    wrapper.append(description);
  }
  return wrapper;
}

function renderResult(payload) {
  const primary = selectPrimaryTotal(payload.totals);
  document.querySelector("#result-context").textContent = `${selectedJurisdiction.name} · ${payload.taxYear}`;
  document.querySelector("#result-total").textContent = primary
    ? formatMoneyMinor(primary.valueMinor, payload.currency)
    : "Calculated";

  const totals = document.querySelector("#totals");
  totals.replaceChildren(...Object.entries(payload.totals)
    .filter(([key, value]) => key.endsWith("Minor") && Number.isSafeInteger(value))
    .flatMap(([key, value]) => totalElements(humanizeKey(key), value, payload.currency)));

  const lines = document.querySelector("#lines");
  lines.replaceChildren(...(payload.lines ?? []).map((line) => {
    const item = document.createElement("li");
    item.textContent = `${line.label}: ${formatMoneyMinor(line.amountMinor, payload.currency)}`;
    return item;
  }));

  const sources = document.querySelector("#sources");
  sources.replaceChildren(...(payload.sources ?? []).map((source) => {
    const item = document.createElement("li");
    if (source.url) {
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = `${source.publisher}: ${source.title}`;
      item.append(link);
    } else {
      item.textContent = source.title ?? source.sourceId;
    }
    return item;
  }));

  const supported = payload.coverage?.supported ?? [];
  const unsupported = payload.coverage?.unsupported ?? [];
  document.querySelector("#coverage").textContent = [
    supported.length ? `Supported: ${supported.join(", ")}.` : "",
    unsupported.length ? `Not covered: ${unsupported.join(", ")}.` : "",
  ].filter(Boolean).join(" ");

  const assumptions = document.querySelector("#assumptions");
  assumptions.replaceChildren(...(payload.assumptions ?? []).map((assumption) => {
    const item = document.createElement("li");
    item.textContent = assumption;
    return item;
  }));

  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function totalElements(label, valueMinor, currency) {
  const term = document.createElement("dt");
  term.textContent = label;
  const value = document.createElement("dd");
  value.textContent = formatMoneyMinor(valueMinor, currency);
  return [term, value];
}

function option(value, text) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = text;
  return element;
}

function issueMessage(payload, fallback) {
  return payload.issues?.map((issue) => issue.message).join(" ") || payload.message || fallback;
}

function setBusy(busy) {
  const button = form.querySelector("button[type='submit']");
  button.disabled = busy;
  button.textContent = busy ? "Calculating…" : "Calculate estimate";
}

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}

function clearMessage() {
  message.textContent = "";
  message.hidden = true;
}
