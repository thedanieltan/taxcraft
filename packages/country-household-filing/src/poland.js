import {
  ROUNDING_MODE,
  applyBasisPoints,
  definePitCountryPackage,
  roundRatio,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze(["2024", "2025", "2026"]);
const WHOLE_PLN_MINOR = 100;
const SCALE_THRESHOLD_MINOR = 12_000_000;
const TAX_REDUCTION_MINOR = 360_000;
const UPPER_BASE_TAX_MINOR = 1_080_000;

const DEFINITION = Object.freeze({
  code: "PL",
  name: "Poland individual and preferential household income tax",
  currency: "PLN",
  supported: [
    "individual filing under the ordinary 12% and 32% tax scale",
    "joint-spouse filing using twice the tax calculated on half of combined taxable income",
    "single-parent preferential filing using twice the tax calculated on half of taxable income",
    "the PLN 3,600 tax-reducing amount within each scale calculation",
    "statutory whole-zloty half-up rounding of the tax base and final tax",
    "calendar years 2024 through 2026",
  ],
  unsupported: [
    "taxable-income, cost, social-contribution and deduction derivation",
    "legal eligibility for joint-spouse or single-parent filing",
    "child, rehabilitation, internet, donation and other credits or reliefs",
    "minor-child income aggregation and foreign-income relief",
    "flat-rate, lump-sum, capital-income and category-specific schedules",
    "withholding, advance-payment, prior-payment, refund and filing-balance reconciliation",
  ],
  assumptions: [
    "The caller supplied each person's taxable income after all applicable income deductions.",
    "The selected individual, joint-spouse or single-parent schedule is legally available.",
    "Only the ordinary scale and its statutory tax-reducing amount are included.",
  ],
  sources: [
    {
      sourceId: "pl.mf.tax-scale-2024-2026",
      publisher: "Ministry of Finance of Poland",
      publisherType: "tax-authority",
      title: "Income from work — tax scale",
      url: "https://www.podatki.gov.pl/podatki-osobiste/pit/informacje-podstawowe/co-jest-opodatkowane/dochody-z-pracy",
      jurisdiction: "PL",
      retrievedAt: "2026-07-19",
    },
    {
      sourceId: "pl.mf.joint-spouse-calculation",
      publisher: "Ministry of Finance of Poland",
      publisherType: "tax-authority",
      title: "Joint settlement of spouses",
      url: "https://www.podatki.gov.pl/poradniki-i-informatory/wspolne-rozliczenie-malzonkow",
      jurisdiction: "PL",
      retrievedAt: "2026-07-19",
    },
    {
      sourceId: "pl.mf.single-parent-calculation",
      publisher: "Ministry of Finance of Poland",
      publisherType: "tax-authority",
      title: "Single parent raising a child",
      url: "https://www.podatki.gov.pl/poradniki-i-informatory/osoba-samotnie-wychowujaca-dziecko",
      jurisdiction: "PL",
      retrievedAt: "2026-07-19",
    },
    {
      sourceId: "pl.eli.tax-ordinance-article-63",
      publisher: "Electronic Legal Information System of Poland",
      publisherType: "government-agency",
      title: "Tax Ordinance — Article 63 rounding rule",
      url: "https://eli.gov.pl/eli/DU/1997/926",
      jurisdiction: "PL",
      retrievedAt: "2026-07-19",
    },
  ],
});

export const polandPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((taxYear) => ({
      taxYear,
      modelVersion: `pl-${taxYear}-v1`,
      status: taxYear === "2026" ? "current" : "historical-supported",
      order: Number(taxYear),
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["ordinary-scale-individual", "joint-spouses", "single-parent"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "scopeConfirmed",
          "filingSchedule",
          "primaryTaxableIncomeMinor",
          "secondaryTaxableIncomeMinor",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Poland ordinary-scale PIT scope",
            description: "The caller confirms the selected filing schedule and taxable-income amounts are legally applicable.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          filingSchedule: {
            type: "string",
            title: "Filing schedule",
            description: "Select individual, joint-spouse or single-parent treatment without providing identity data.",
            enum: ["individual", "joint-spouses", "single-parent"],
            "x-taxcraft-kind": "plain",
          },
          primaryTaxableIncomeMinor: moneyFact(
            "Primary taxable income",
            "Primary individual's caller-confirmed taxable income after applicable deductions.",
          ),
          secondaryTaxableIncomeMinor: moneyFact(
            "Secondary taxable income",
            "Second spouse's caller-confirmed taxable income; enter zero for individual and single-parent schedules.",
          ),
        },
      },
      rounding: [
        { stage: "taxable-base", mode: "half-up", unitMinor: WHOLE_PLN_MINOR },
        { stage: "quotient-income", mode: "half-up", unitMinor: WHOLE_PLN_MINOR },
        { stage: "final-income-tax", mode: "half-up", unitMinor: WHOLE_PLN_MINOR },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map((taxYear) => [taxYear, model(taxYear)])),
});

function model(taxYear) {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      if (facts.filingSchedule !== "joint-spouses" && facts.secondaryTaxableIncomeMinor !== 0) {
        return inconsistent(
          "$.secondaryTaxableIncomeMinor",
          "Secondary taxable income must be zero for individual and single-parent schedules.",
        );
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const combinedIncomeMinor = facts.filingSchedule === "joint-spouses"
        ? safeAdd(facts.primaryTaxableIncomeMinor, facts.secondaryTaxableIncomeMinor)
        : facts.primaryTaxableIncomeMinor;
      const roundedTaxBaseMinor = roundWholePln(combinedIncomeMinor);
      const quotientFactor = facts.filingSchedule === "individual" ? 1 : 2;
      const quotientIncomeMinor = roundWholePln(roundRatio(
        roundedTaxBaseMinor,
        quotientFactor,
        ROUNDING_MODE.HALF_UP,
      ));
      const unit = scaleTax(quotientIncomeMinor);
      const taxBeforeFinalRoundingMinor = safeMultiply(unit.taxMinor, quotientFactor);
      const incomeTaxMinor = roundWholePln(taxBeforeFinalRoundingMinor);
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = unit.lines.map((line, index) => ({
        ruleId: `pl.pit.${taxYear}.${facts.filingSchedule}.unit-${index + 1}`,
        label: quotientFactor === 1 ? line.label : `${line.label} on one-half quotient`,
        amountMinor: safeMultiply(line.amountMinor, quotientFactor),
        sourceIds,
      }));
      const roundingAdjustmentMinor = incomeTaxMinor - taxBeforeFinalRoundingMinor;
      if (roundingAdjustmentMinor !== 0) {
        lines.push({
          ruleId: `pl.pit.${taxYear}.${facts.filingSchedule}.final-rounding`,
          label: "Final tax rounded to whole Polish zloty",
          amountMinor: roundingAdjustmentMinor,
          sourceIds,
        });
      }
      if (lines.length === 0) {
        lines.push({
          ruleId: `pl.pit.${taxYear}.${facts.filingSchedule}.zero-tax`,
          label: "No tax after the tax-reducing amount",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          primaryTaxableIncomeMinor: facts.primaryTaxableIncomeMinor,
          secondaryTaxableIncomeMinor: facts.secondaryTaxableIncomeMinor,
          combinedTaxableIncomeMinor: combinedIncomeMinor,
          roundedTaxBaseMinor,
          quotientFactor,
          quotientIncomeMinor,
          unitTaxBeforeMultiplicationMinor: unit.taxMinor,
          taxBeforeFinalRoundingMinor,
          incomeTaxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function scaleTax(taxBaseMinor) {
  if (taxBaseMinor <= SCALE_THRESHOLD_MINOR) {
    const grossMinor = applyBasisPoints(taxBaseMinor, 1_200, ROUNDING_MODE.HALF_UP);
    const reductionAppliedMinor = Math.min(grossMinor, TAX_REDUCTION_MINOR);
    const taxMinor = grossMinor - reductionAppliedMinor;
    return {
      taxMinor,
      lines: taxMinor === 0 ? [] : [
        { label: "12% ordinary-scale tax", amountMinor: grossMinor },
        { label: "PLN 3,600 tax-reducing amount applied", amountMinor: -reductionAppliedMinor },
      ],
    };
  }
  const excessMinor = taxBaseMinor - SCALE_THRESHOLD_MINOR;
  const excessTaxMinor = applyBasisPoints(excessMinor, 3_200, ROUNDING_MODE.HALF_UP);
  return {
    taxMinor: safeAdd(UPPER_BASE_TAX_MINOR, excessTaxMinor),
    lines: [
      { label: "Tax through PLN 120,000", amountMinor: UPPER_BASE_TAX_MINOR },
      { label: "32% tax on excess above PLN 120,000", amountMinor: excessTaxMinor },
    ],
  };
}

function roundWholePln(amountMinor) {
  return safeMultiply(
    roundRatio(amountMinor, WHOLE_PLN_MINOR, ROUNDING_MODE.HALF_UP),
    WHOLE_PLN_MINOR,
  );
}

function moneyFact(title, description) {
  return {
    type: "integer",
    title,
    description,
    minimum: 0,
    "x-taxcraft-kind": "money-minor",
    "x-taxcraft-currency": "PLN",
  };
}

function safeAdd(left, right) {
  const result = left + right;
  if (!Number.isSafeInteger(result)) throw new Error("Combined Polish taxable income exceeds safe integer output.");
  return result;
}

function safeMultiply(value, multiplier) {
  const result = value * multiplier;
  if (!Number.isSafeInteger(result)) throw new Error("Polish tax calculation exceeds safe integer output.");
  return result;
}

function inconsistent(path, message) {
  return { ok: false, issues: [{ code: "facts.inconsistent", path, message }] };
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}
