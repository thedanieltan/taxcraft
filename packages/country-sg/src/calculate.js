import {
  ROUNDING_MODE,
  applyCappedRate,
  calculateProgressiveBands,
} from "@taxcraft/country-sdk";
import { SINGAPORE_MODEL_DATA } from "./model-data.js";

export function calculateResidentTax({ taxYear, chargeableIncomeMinor }) {
  const model = SINGAPORE_MODEL_DATA.taxYears.find((entry) => entry.taxYear === taxYear);
  if (!model) throw new Error(`Singapore model ${taxYear} is unavailable.`);

  let upperBoundMinor = 0;
  const progressive = calculateProgressiveBands({
    taxableMinor: chargeableIncomeMinor,
    rounding: ROUNDING_MODE.HALF_UP,
    bands: model.brackets.map((bracket) => {
      if (bracket.widthMinor === null) {
        return { upperBoundMinor: null, rateBasisPoints: bracket.rateBasisPoints };
      }
      upperBoundMinor += bracket.widthMinor;
      return { upperBoundMinor, rateBasisPoints: bracket.rateBasisPoints };
    }),
  });

  const lines = progressive.bands
    .filter(({ taxableMinor, rateBasisPoints }) => taxableMinor > 0 && rateBasisPoints > 0)
    .map(({ lowerBoundMinor, rateBasisPoints, taxMinor }) => ({
      ruleId: `sg.pit.${taxYear}.resident-bracket-${lowerBoundMinor / 100}`,
      label: `${rateBasisPoints / 100}% resident rate`,
      amountMinor: taxMinor,
      sourceIds: [model.rateSourceId],
    }));

  const personalIncomeTaxRebateMinor = model.rebate
    ? applyCappedRate({
      amountMinor: progressive.taxMinor,
      rateBasisPoints: model.rebate.percentage * 100,
      capMinor: model.rebate.capMinor,
      rounding: ROUNDING_MODE.HALF_UP,
    }).appliedAmountMinor
    : 0;

  if (model.rebate && personalIncomeTaxRebateMinor > 0) {
    lines.push({
      ruleId: `sg.pit.${taxYear}.personal-income-tax-rebate`,
      label: `${model.rebate.percentage}% Personal Income Tax Rebate`,
      amountMinor: -personalIncomeTaxRebateMinor,
      sourceIds: [model.rebate.sourceId],
    });
  }

  if (lines.length === 0) {
    lines.push({
      ruleId: `sg.pit.${taxYear}.zero-rate-band`,
      label: "0% resident rate",
      amountMinor: 0,
      sourceIds: [model.rateSourceId],
    });
  }

  return {
    currency: "SGD",
    totals: {
      chargeableIncomeMinor,
      grossTaxMinor: progressive.taxMinor,
      personalIncomeTaxRebateMinor,
      netTaxPayableMinor: progressive.taxMinor - personalIncomeTaxRebateMinor,
    },
    lines,
    assumptions: [
      "The user has already determined that the individual is a Singapore tax resident for the selected Year of Assessment.",
      "Chargeable income has already been determined after applicable deductions and personal reliefs.",
      "Only rebates explicitly represented in the selected assessment-year model are included.",
      "Calculated rate and rebate amounts are rounded to the nearest cent using half-up rounding.",
    ],
    coverage: {
      supported: [
        "Singapore tax resident individual",
        "whole-dollar chargeable income",
        "resident progressive income tax rates",
        "general Personal Income Tax Rebate when explicitly represented for the selected year",
      ],
      unsupported: [
        "tax residency determination",
        "chargeable income determination",
        "non-resident taxation",
        "relief eligibility",
        "Parenthood Tax Rebate and other taxpayer-specific rebates",
        "filing or tax advice",
      ],
    },
  };
}
