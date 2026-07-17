import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  calculateSteppedTaper,
} from "@taxcraft/country-sdk";

export function calculateUkEmploymentIncomeTax({ taxYear, facts, model }) {
  const personalAllowanceMinor = calculatePersonalAllowance(model, facts.adjustedNetIncomeMinor);
  const taxableIncomeMinor = Math.max(0, facts.nonSavingsIncomeMinor - personalAllowanceMinor);
  const progressive = calculateProgressiveBands({
    taxableMinor: taxableIncomeMinor,
    rounding: ROUNDING_MODE.FLOOR,
    bands: [
      {
        upperBoundMinor: model.basicRateBandMinor,
        rateBasisPoints: model.basicRateBasisPoints,
        metadata: { suffix: "basic-rate", label: "20% basic rate" },
      },
      {
        upperBoundMinor: model.higherRateUpperMinor,
        rateBasisPoints: model.higherRateBasisPoints,
        metadata: { suffix: "higher-rate", label: "40% higher rate" },
      },
      {
        upperBoundMinor: null,
        rateBasisPoints: model.additionalRateBasisPoints,
        metadata: { suffix: "additional-rate", label: "45% additional rate" },
      },
    ],
  });

  const lines = progressive.bands
    .filter(({ taxableMinor }) => taxableMinor > 0)
    .map(({ taxMinor, metadata }) => line(
      taxYear,
      metadata.suffix,
      metadata.label,
      taxMinor,
      model.sourceIds,
    ));

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
      incomeTaxMinor: progressive.taxMinor,
    },
    lines,
    assumptions: [
      `The caller has confirmed that ${facts.territory} rates apply and that the individual is not a Scottish taxpayer.`,
      "The caller has supplied adjusted net income for the Personal Allowance taper.",
      "Only non-savings income and the standard Personal Allowance are included.",
      "Savings, dividends, National Insurance, Marriage Allowance, Blind Person’s Allowance and other reliefs are excluded.",
    ],
    coverage: {
      supported: [
        "England, Wales or Northern Ireland tax regime",
        "user-confirmed adjusted net income",
        "non-savings income",
        "standard Personal Allowance and its income taper",
        "basic, higher and additional Income Tax rates",
      ],
      unsupported: [
        "Scottish Income Tax",
        "residency or territorial-status determination",
        "savings and dividend income",
        "National Insurance contributions",
        "Marriage Allowance, Blind Person’s Allowance and other reliefs",
        "filing or tax advice",
      ],
    },
  };
}

export function calculatePersonalAllowance(model, adjustedNetIncomeMinor) {
  return calculateSteppedTaper({
    baseAmountMinor: model.personalAllowanceMinor,
    measureMinor: adjustedNetIncomeMinor,
    startsAtMinor: model.allowanceTaperStartMinor,
    measureStepMinor: 200,
    reductionPerStepMinor: 100,
  }).amountMinor;
}

function line(taxYear, suffix, label, amountMinor, sourceIds) {
  return {
    ruleId: `gb.pit.${taxYear}.${suffix}`,
    label,
    amountMinor,
    sourceIds: [...sourceIds],
  };
}
