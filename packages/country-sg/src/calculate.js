import { SINGAPORE_MODEL_DATA } from "./model-data.js";

export function calculateResidentTax({ taxYear, chargeableIncomeMinor }) {
  const model = SINGAPORE_MODEL_DATA.taxYears.find((entry) => entry.taxYear === taxYear);
  if (!model) throw new Error(`Singapore model ${taxYear} is unavailable.`);

  let remainingMinor = chargeableIncomeMinor;
  let lowerBoundMinor = 0;
  let grossTaxMinor = 0;
  const lines = [];

  for (const bracket of model.brackets) {
    if (remainingMinor <= 0) break;
    const taxableMinor = bracket.widthMinor === null
      ? remainingMinor
      : Math.min(remainingMinor, bracket.widthMinor);
    const taxMinor = exactRate(taxableMinor, bracket.rateBasisPoints);

    if (taxableMinor > 0 && bracket.rateBasisPoints > 0) {
      lines.push({
        ruleId: `sg.pit.${taxYear}.resident-bracket-${lowerBoundMinor / 100}`,
        label: `${bracket.rateBasisPoints / 100}% resident rate`,
        amountMinor: taxMinor,
        sourceIds: [model.rateSourceId]
      });
    }

    grossTaxMinor += taxMinor;
    remainingMinor -= taxableMinor;
    lowerBoundMinor += taxableMinor;
  }

  const personalIncomeTaxRebateMinor = model.rebate
    ? Math.min(exactPercentage(grossTaxMinor, model.rebate.percentage), model.rebate.capMinor)
    : 0;

  if (model.rebate && personalIncomeTaxRebateMinor > 0) {
    lines.push({
      ruleId: `sg.pit.${taxYear}.personal-income-tax-rebate`,
      label: `${model.rebate.percentage}% Personal Income Tax Rebate`,
      amountMinor: -personalIncomeTaxRebateMinor,
      sourceIds: [model.rebate.sourceId]
    });
  }

  if (lines.length === 0) {
    lines.push({
      ruleId: `sg.pit.${taxYear}.zero-rate-band`,
      label: "0% resident rate",
      amountMinor: 0,
      sourceIds: [model.rateSourceId]
    });
  }

  return {
    currency: "SGD",
    totals: {
      chargeableIncomeMinor,
      grossTaxMinor,
      personalIncomeTaxRebateMinor,
      netTaxPayableMinor: grossTaxMinor - personalIncomeTaxRebateMinor
    },
    lines,
    assumptions: [
      "The user has already determined that the individual is a Singapore tax resident for the selected Year of Assessment.",
      "Chargeable income has already been determined after applicable deductions and personal reliefs.",
      "Only rebates explicitly represented in the selected assessment-year model are included.",
      "Calculated rate and rebate amounts are rounded to the nearest cent using half-up rounding."
    ],
    coverage: {
      supported: [
        "Singapore tax resident individual",
        "whole-dollar chargeable income",
        "resident progressive income tax rates",
        "general Personal Income Tax Rebate when explicitly represented for the selected year"
      ],
      unsupported: [
        "tax residency determination",
        "chargeable income determination",
        "non-resident taxation",
        "relief eligibility",
        "Parenthood Tax Rebate and other taxpayer-specific rebates",
        "filing or tax advice"
      ]
    }
  };
}

function exactRate(amountMinor, rateBasisPoints) {
  return divideAndRoundHalfUp(amountMinor * rateBasisPoints, 10_000);
}

function exactPercentage(amountMinor, percentage) {
  return divideAndRoundHalfUp(amountMinor * percentage, 100);
}

function divideAndRoundHalfUp(numerator, denominator) {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new Error("Singapore calculation exceeded safe integer arithmetic.");
  }
  return Math.floor((numerator + denominator / 2) / denominator);
}
