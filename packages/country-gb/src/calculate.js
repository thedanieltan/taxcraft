export function calculateUkEmploymentIncomeTax({ taxYear, facts, model }) {
  const personalAllowanceMinor = calculatePersonalAllowance(model, facts.adjustedNetIncomeMinor);
  const taxableIncomeMinor = Math.max(0, facts.nonSavingsIncomeMinor - personalAllowanceMinor);

  let remainingMinor = taxableIncomeMinor;
  let incomeTaxMinor = 0;
  const lines = [];

  const basicTaxableMinor = Math.min(remainingMinor, model.basicRateBandMinor);
  if (basicTaxableMinor > 0) {
    const amountMinor = applyBasisPoints(basicTaxableMinor, model.basicRateBasisPoints);
    incomeTaxMinor += amountMinor;
    remainingMinor -= basicTaxableMinor;
    lines.push(line(taxYear, "basic-rate", "20% basic rate", amountMinor, model.sourceIds));
  }

  const higherWidthMinor = model.higherRateUpperMinor - model.basicRateBandMinor;
  const higherTaxableMinor = Math.min(remainingMinor, higherWidthMinor);
  if (higherTaxableMinor > 0) {
    const amountMinor = applyBasisPoints(higherTaxableMinor, model.higherRateBasisPoints);
    incomeTaxMinor += amountMinor;
    remainingMinor -= higherTaxableMinor;
    lines.push(line(taxYear, "higher-rate", "40% higher rate", amountMinor, model.sourceIds));
  }

  if (remainingMinor > 0) {
    const amountMinor = applyBasisPoints(remainingMinor, model.additionalRateBasisPoints);
    incomeTaxMinor += amountMinor;
    lines.push(line(taxYear, "additional-rate", "45% additional rate", amountMinor, model.sourceIds));
  }

  if (lines.length === 0) {
    lines.push(line(taxYear, "personal-allowance", "Income covered by the standard Personal Allowance", 0, model.sourceIds));
  }

  return {
    currency: "GBP",
    totals: {
      nonSavingsIncomeMinor: facts.nonSavingsIncomeMinor,
      adjustedNetIncomeMinor: facts.adjustedNetIncomeMinor,
      personalAllowanceMinor,
      taxableIncomeMinor,
      incomeTaxMinor
    },
    lines,
    assumptions: [
      `The caller has confirmed that ${facts.territory} rates apply and that the individual is not a Scottish taxpayer.`,
      "The caller has supplied adjusted net income for the Personal Allowance taper.",
      "Only non-savings income and the standard Personal Allowance are included.",
      "Savings, dividends, National Insurance, Marriage Allowance, Blind Person’s Allowance and other reliefs are excluded."
    ],
    coverage: {
      supported: [
        "England, Wales or Northern Ireland tax regime",
        "user-confirmed adjusted net income",
        "non-savings income",
        "standard Personal Allowance and its income taper",
        "basic, higher and additional Income Tax rates"
      ],
      unsupported: [
        "Scottish Income Tax",
        "residency or territorial-status determination",
        "savings and dividend income",
        "National Insurance contributions",
        "Marriage Allowance, Blind Person’s Allowance and other reliefs",
        "filing or tax advice"
      ]
    }
  };
}

export function calculatePersonalAllowance(model, adjustedNetIncomeMinor) {
  const excessMinor = Math.max(0, adjustedNetIncomeMinor - model.allowanceTaperStartMinor);
  const reductionMinor = Math.floor(excessMinor / 200) * 100;
  return Math.max(0, model.personalAllowanceMinor - reductionMinor);
}

function applyBasisPoints(amountMinor, basisPoints) {
  const numerator = amountMinor * basisPoints;
  if (!Number.isSafeInteger(numerator)) {
    throw new Error("UK calculation exceeded safe integer arithmetic.");
  }
  return Math.floor(numerator / 10_000);
}

function line(taxYear, suffix, label, amountMinor, sourceIds) {
  return {
    ruleId: `gb.pit.${taxYear}.${suffix}`,
    label,
    amountMinor,
    sourceIds: [...sourceIds]
  };
}
