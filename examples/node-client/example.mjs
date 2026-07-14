import { createTaxCraftClient } from "./client.mjs";

const client = createTaxCraftClient({
  baseUrl: process.env.TAXCRAFT_API_URL ?? "http://localhost:3000"
});

const result = await client.estimateSingapore({
  taxYear: "YA2026",
  employmentIncomeMinor: 10_000_000,
  otherTaxableIncomeMinor: 1_000_000,
  allowableDeductionsMinor: 500_000,
  personalReliefsMinor: 2_000_000
});

console.log(JSON.stringify({
  chargeableIncomeMinor: result.worksheet.totals.chargeableIncomeMinor,
  netTaxPayableMinor: result.calculation.totals.netTaxPayableMinor,
  sources: [...new Set([
    ...result.worksheet.sources.map((source) => source.url),
    ...result.calculation.sources.map((source) => source.url)
  ])]
}, null, 2));
