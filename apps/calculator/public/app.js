const form = document.querySelector("#tax-form");
const taxYear = document.querySelector("#tax-year");
const employmentIncome = document.querySelector("#employment-income");
const otherTaxableIncome = document.querySelector("#other-taxable-income");
const allowableDeductions = document.querySelector("#allowable-deductions");
const personalReliefs = document.querySelector("#personal-reliefs");
const resident = document.querySelector("#resident-confirmation");
const message = document.querySelector("#message");
const result = document.querySelector("#result");

await loadJurisdictions();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  result.hidden = true;

  const values = {
    employmentIncome: readWholeDollars(employmentIncome),
    otherTaxableIncome: readWholeDollars(otherTaxableIncome),
    allowableDeductions: readWholeDollars(allowableDeductions),
    personalReliefs: readWholeDollars(personalReliefs)
  };

  if (Object.values(values).some((value) => value === null)) {
    showMessage("All amounts must be non-negative whole Singapore-dollar values.");
    return;
  }
  if (!resident.checked) {
    showMessage("Confirm the supported residency, income classification and deduction or relief boundary before calculating.");
    return;
  }

  try {
    const worksheetResponse = await fetch("/v1/worksheets/SG/chargeable-income", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        facts: {
          employmentIncomeMinor: values.employmentIncome * 100,
          otherTaxableIncomeMinor: values.otherTaxableIncome * 100,
          allowableDeductionsMinor: values.allowableDeductions * 100,
          personalReliefsMinor: values.personalReliefs * 100,
          eligibilityConfirmed: true
        }
      })
    });
    const worksheet = await worksheetResponse.json();
    if (!worksheetResponse.ok || worksheet.status !== "ok") {
      showMessage(issueMessage(worksheet, "The chargeable-income worksheet is not supported."));
      return;
    }

    const taxResponse = await fetch("/v1/calculate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jurisdiction: "SG",
        taxYear: taxYear.value,
        facts: {
          taxResident: true,
          chargeableIncomeMinor: worksheet.totals.chargeableIncomeMinor
        }
      })
    });
    const tax = await taxResponse.json();
    if (!taxResponse.ok || tax.status !== "ok") {
      showMessage(issueMessage(tax, "The tax calculation is not supported."));
      return;
    }

    renderResult(combineResults(worksheet, tax));
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

function combineResults(worksheet, tax) {
  return {
    ...tax,
    worksheetTotals: worksheet.totals,
    lines: [...worksheet.lines, ...tax.lines],
    sources: uniqueBy([...worksheet.sources, ...tax.sources], (source) => source.sourceId),
    assumptions: [...new Set([...worksheet.assumptions, ...tax.assumptions])],
    coverage: {
      supported: [...new Set([...worksheet.coverage.supported, ...tax.coverage.supported])],
      unsupported: [...new Set([...worksheet.coverage.unsupported, ...tax.coverage.unsupported])]
    }
  };
}

function renderResult(payload) {
  document.querySelector("#result-year").textContent = payload.taxYear;
  document.querySelector("#result-total").textContent = formatMoney(payload.totals.netTaxPayableMinor, payload.currency);

  const totals = document.querySelector("#totals");
  totals.replaceChildren();
  addTotal(totals, "Employment income", payload.worksheetTotals.employmentIncomeMinor, payload.currency);
  addTotal(totals, "Other taxable income", payload.worksheetTotals.otherTaxableIncomeMinor, payload.currency);
  addTotal(totals, "Total taxable income entered", payload.worksheetTotals.totalIncomeMinor, payload.currency);
  addTotal(totals, "Allowable deductions", -payload.worksheetTotals.allowableDeductionsMinor, payload.currency);
  addTotal(totals, "Assessable income", payload.worksheetTotals.assessableIncomeMinor, payload.currency);
  addTotal(totals, "Personal reliefs", -Math.min(payload.worksheetTotals.personalReliefsMinor, payload.worksheetTotals.assessableIncomeMinor), payload.currency);
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

function readWholeDollars(input) {
  const value = Number(input.value);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function issueMessage(payload, fallback) {
  return payload.issues?.map((issue) => issue.message).join(" ") || payload.message || fallback;
}

function uniqueBy(values, key) {
  const seen = new Set();
  return values.filter((value) => {
    const identifier = key(value);
    if (seen.has(identifier)) return false;
    seen.add(identifier);
    return true;
  });
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
