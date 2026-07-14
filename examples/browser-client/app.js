import { createTaxCraftBrowserClient } from "./client.js";

const form = document.querySelector("#example-form");
const output = document.querySelector("#output");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  output.textContent = "Calculating…";

  try {
    const client = createTaxCraftBrowserClient({
      baseUrl: document.querySelector("#api-url").value
    });
    const result = await client.estimateSingapore({
      taxYear: "YA2026",
      employmentIncomeMinor: readDollars("#employment") * 100,
      otherTaxableIncomeMinor: readDollars("#other-income") * 100,
      allowableDeductionsMinor: readDollars("#deductions") * 100,
      personalReliefsMinor: readDollars("#reliefs") * 100
    });

    output.textContent = JSON.stringify({
      chargeableIncomeMinor: result.worksheet.totals.chargeableIncomeMinor,
      netTaxPayableMinor: result.calculation.totals.netTaxPayableMinor,
      officialSources: [...new Set([
        ...result.worksheet.sources.map((source) => source.url),
        ...result.calculation.sources.map((source) => source.url)
      ])]
    }, null, 2);
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : "TaxCraft request failed.";
  }
});

function readDollars(selector) {
  const value = Number(document.querySelector(selector).value);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("All values must be non-negative whole-dollar amounts.");
  }
  return value;
}
