import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const PERSONAL_ALLOWANCE_POUNDS = 15_200;
const WITHDRAWAL_THRESHOLD_POUNDS = 85_000;

const DEFINITION = Object.freeze({
  code: "GG",
  name: "Guernsey resident individual income tax",
  currency: "GBP",
  supported: [
    "year of charge 2026 full-year solely or principally resident individual income tax",
    "22% individual standard rate",
    "GBP 15,200 personal allowance",
    "withdrawal of allowances and withdrawable deductions by GBP 1 for every GBP 5 of calculated income above GBP 85,000",
    "caller-confirmed additional allowances and withdrawable deductions after eligibility determination",
  ],
  unsupported: [
    "gross-income, deduction, calculated-income and relief derivation",
    "eligibility for dependent-relative, infirm-person, housekeeper, child, pension and mortgage-interest relief",
    "arrival and departure pro-rating of income, allowance and withdrawal threshold",
    "standard-charge elections and tax-cap provisions",
    "Alderney and non-resident treatment",
    "social-insurance contributions and ETI withholding",
    "foreign-tax credit, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied calculated income as defined by the 2026 allowance schedule: income net of deductions but gross of withdrawable deductions.",
    "The caller supplied the total legally available additional allowances and withdrawable deductions, excluding the ordinary personal allowance.",
    "The individual was solely or principally resident for the full year, so no pro-rating applies.",
    "Amounts are supplied in whole pounds so the allowance withdrawal and 22% tax are exact in pence.",
  ],
  sources: [
    {
      sourceId: "gg.states.standard-rate-2025-2026",
      publisher: "States of Deliberation",
      publisherType: "government-agency",
      title: "Individual standard rate set at 22% for Years of Charge 2025 and 2026",
      url: "https://statesvoting-records.gov.gg/Propositions/Details/1713",
      jurisdiction: "GG",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "gg.parliament.budget-2026-first-schedule",
      publisher: "States of Guernsey",
      publisherType: "government-agency",
      title: "Annual Budget for 2026 — First Schedule of individual allowances",
      url: "https://parliament.gg/parliamentary-business/assets/propositions/P2025-121",
      jurisdiction: "GG",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "gg.states.budget-2026-proposition-22",
      publisher: "States of Deliberation",
      publisherType: "government-agency",
      title: "Annual Budget for 2026 — approval of individual allowances",
      url: "https://statesvoting-records.gov.gg/Propositions/Details/2432",
      jurisdiction: "GG",
      retrievedAt: "2026-07-22",
    },
  ],
});

export const guernseyPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: "gg-2026-v1", status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["full-year-resident-standard-rate"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "calculatedIncomePounds", "additionalAllowanceAndWithdrawableDeductionPounds"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Guernsey full-year resident scope",
            description: "The caller confirms the individual was solely or principally resident throughout 2026 and the standard-rate schedule applies.",
            "x-taxcraft-kind": "confirmed-status",
          },
          calculatedIncomePounds: {
            type: "integer",
            minimum: 0,
            title: "Calculated income in whole pounds",
            description: "Income net of deductions but gross of withdrawable deductions, supplied in whole pounds.",
            "x-taxcraft-kind": "plain",
          },
          additionalAllowanceAndWithdrawableDeductionPounds: {
            type: "integer",
            minimum: 0,
            title: "Additional allowances and withdrawable deductions",
            description: "Caller-confirmed eligible amount excluding the ordinary GBP 15,200 personal allowance, supplied in whole pounds.",
            "x-taxcraft-kind": "plain",
          },
        },
      },
      rounding: [{ stage: "whole-pound-relief-and-standard-rate", mode: "floor", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: { [TAX_YEAR]: model() },
});

function model() {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const reliefBeforeWithdrawalPounds =
        PERSONAL_ALLOWANCE_POUNDS + facts.additionalAllowanceAndWithdrawableDeductionPounds;
      const withdrawalExcessPounds = Math.max(0, facts.calculatedIncomePounds - WITHDRAWAL_THRESHOLD_POUNDS);
      const reliefWithdrawalPounds = Math.min(
        reliefBeforeWithdrawalPounds,
        Math.floor(withdrawalExcessPounds / 5),
      );
      const reliefAfterWithdrawalPounds = reliefBeforeWithdrawalPounds - reliefWithdrawalPounds;
      const taxableIncomePounds = Math.max(0, facts.calculatedIncomePounds - reliefAfterWithdrawalPounds);
      const incomeTaxMinor = taxableIncomePounds * 22;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);

      return {
        currency: DEFINITION.currency,
        totals: {
          calculatedIncomePounds: facts.calculatedIncomePounds,
          personalAllowancePounds: PERSONAL_ALLOWANCE_POUNDS,
          additionalAllowanceAndWithdrawableDeductionPounds:
            facts.additionalAllowanceAndWithdrawableDeductionPounds,
          reliefBeforeWithdrawalPounds,
          withdrawalThresholdPounds: WITHDRAWAL_THRESHOLD_POUNDS,
          withdrawalExcessPounds,
          reliefWithdrawalPounds,
          reliefAfterWithdrawalPounds,
          taxableIncomePounds,
          incomeTaxMinor,
        },
        lines: [{
          ruleId: `gg.pit.${TAX_YEAR}.standard-rate-after-relief-withdrawal`,
          label: "22% individual standard-rate income tax",
          amountMinor: incomeTaxMinor,
          sourceIds,
        }],
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}
