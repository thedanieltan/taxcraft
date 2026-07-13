const form = document.querySelector("#tax-form");
const taxYear = document.querySelector("#tax-year");
const income = document.querySelector("#chargeable-income");
const resident = document.querySelector("#resident-confirmation");
const message = document.querySelector("#message");
const result = document.querySelector("#result");

await loadJurisdictions();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  result.hidden = true;

  const dollars = Number(income.value);
  if (!Number.isSafeInteger(dollars) || dollars < 0) {
    showMessage("Chargeable income must be a non-negative whole-dollar amount.");
    return;
  }
  if (!resident.checked) {
    showMessage("Confirm the supported resident-tax and chargeable-income boundary before calculating.");
    return;
  }

  try {
    const response = await fetch("/v1/calculate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jurisdiction: "SG",
        taxYear: taxYear.value,
        facts: {
          taxResident: true,
          chargeableIncomeMinor: dollars * 100
        }
      })
    });
    const payload = await response.json();
    if (!response.ok || payload.status !== "ok") {
      showMessage(payload.issues?.map((issue) => issue.message).join(" ") || payload.message || "The calculation is not supported.");
      return;
    }
    renderResult(payload);
  } catch {
    showMessage("The calculator could not reach the TaxCraft API.");
  }
});

async function loadJurisdictions() {
  try {
    const response = await fetch("/v1/jurisdictions");
    const payload = await response.json();
    const singapore = payload.jurisdictions?.find((entry) => entry.jurisdiction === "SG");
    for (const version of [...(singapore?.taxYears ?? [])].sort((left, right) => right.order - left.order)) {
      const option = document.createElement("option");
      option.value = version.taxYear;
      option.textContent = `${version.taxYear}${version.status === "current" ? " — current" : ""}`;
      taxYear.append(option);
    }
  } catch {
    showMessage("Supported tax years could not be loaded.");
  }
}

function renderResult(payload) {
  document.querySelector("#result-year").textContent = payload.taxYear;
  document.querySelector("#result-total").textContent = formatMoney(payload.totals.netTaxPayableMinor, payload.currency);

  const totals = document.querySelector("#totals");
  totals.replaceChildren();
  addTotal(totals, "Chargeable income", payload.totals.chargeableIncomeMinor, payload.currency);
  addTotal(totals, "Gross tax", payload.totals.grossTaxMinor, payload.currency);
  addTotal(totals, "Personal Income Tax Rebate", -payload.totals.personalIncomeTaxRebateMinor, payload.currency);
  addTotal(totals, "Net tax payable", payload.totals.netTaxPayableMinor, payload.currency);

  const lines = document.querySelector("#lines");
  lines.replaceChildren(...payload.lines.map((line) => {
    const item = document.createElement("li");
    item.textContent = `${line.label}: ${formatMoney(line.amountMinor, payload.currency)}`;
    return item;
  }));

  const sources = document.querySelector("#sources");
  sources.replaceChildren(...payload.sources.map((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = `${source.publisher}: ${source.title}`;
    item.append(link);
    return item;
  }));

  const coverage = document.querySelector("#coverage");
  coverage.textContent = `Supported: ${payload.coverage.supported.join(", ")}. Not covered: ${payload.coverage.unsupported.join(", ")}.`;

  const assumptions = document.querySelector("#assumptions");
  assumptions.replaceChildren(...payload.assumptions.map((assumption) => {
    const item = document.createElement("li");
    item.textContent = assumption;
    return item;
  }));

  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addTotal(container, label, valueMinor, currency) {
  const term = document.createElement("dt");
  term.textContent = label;
  const value = document.createElement("dd");
  value.textContent = formatMoney(valueMinor, currency);
  container.append(term, value);
}

function formatMoney(valueMinor, currency) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valueMinor / 100);
}

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}

function clearMessage() {
  message.textContent = "";
  message.hidden = true;
}
