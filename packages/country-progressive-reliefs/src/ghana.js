import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);
const RESIDENT_MONTHLY_MAX_MINOR = 1_989_667;
const RESIDENT_ANNUAL_MAX_MINOR = 23_876_000;
const RESIDENT_MONTHLY_BANDS = Object.freeze([
  { upperBoundMinor: 49_000, rateBasisPoints: 0 },
  { upperBoundMinor: 60_000, rateBasisPoints: 500 },
  { upperBoundMinor: 73_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: 389_667, rateBasisPoints: 1_750 },
  { upperBoundMinor: RESIDENT_MONTHLY_MAX_MINOR, rateBasisPoints: 2_500 },
]);
const RESIDENT_ANNUAL_BANDS = Object.freeze([
  { upperBoundMinor: 588_000, rateBasisPoints: 0 },
  { upperBoundMinor: 720_000, rateBasisPoints: 500 },
  { upperBoundMinor: 876_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: 4_676_000, rateBasisPoints: 1_750 },
  { upperBoundMinor: RESIDENT_ANNUAL_MAX_MINOR, rateBasisPoints: 2_500 },
]);
const NON_RESIDENT_BANDS = Object.freeze([
  { upperBoundMinor: null, rateBasisPoints: 2_500 },
]);

const DEFINITION = Object.freeze({
  code: "GH",
  name: "Ghana individual chargeable-income tax",
  currency: "GHS",
  supported: [
    "resident monthly chargeable income through GHS 19,896.67",
    "resident annual chargeable income through GHS 238,760",
    "non-resident monthly or annual chargeable income at the generally applicable 25% rate",
    "calendar years 2024 through 2026",
  ],
  unsupported: [
    "resident chargeable income above GHS 19,896.67 monthly or GHS 238,760 annually because the official 30% band width and 35% threshold overlap",
    "chargeable-income, employment-benefit, deduction and relief derivation",
    "SSNIT, provident-fund, mortgage-interest, donation and foreign-tax-credit calculations",
    "bonus, overtime, casual-worker, modified-taxation, rent, investment and business-income schedules",
    "withholding administration, payments, reconciliation, prior payments and refunds",
    "residence, source and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied chargeable income after all legally applicable deductions and additions.",
    "The caller selected the legally applicable resident or non-resident schedule without providing identity data.",
    "Resident calculations fail closed before the internally inconsistent 30% and 35% bands; no threshold is inferred.",
  ],
  sources: [
    {
      sourceId: "gh.gra.paye-rates-2024",
      publisher: "Ghana Revenue Authority",
      publisherType: "tax-authority",
      title: "Pay As You Earn (PAYE)",
      url: "https://gra.gov.gh/domestic-tax/tax-types/paye/",
      jurisdiction: "GH",
      retrievedAt: "2026-07-20",
    },
    {
      sourceId: "gh.gra.income-tax-amendment-1111",
      publisher: "Ghana Revenue Authority",
      publisherType: "tax-authority",
      title: "Implementation of New Tax Laws and Amendments",
      url: "https://gra.gov.gh/implementation-of-new-tax-laws-and-amendments/",
      jurisdiction: "GH",
      retrievedAt: "2026-07-20",
    },
    {
      sourceId: "gh.parliament.income-tax-amendment-1111",
      publisher: "Parliament of Ghana",
      publisherType: "legislature",
      title: "Income Tax (Amendment) (No. 2) Act, 2023 (Act 1111)",
      url: "https://repository.parliament.gh/handle/123456789/3974",
      jurisdiction: "GH",
      retrievedAt: "2026-07-20",
    },
    {
      sourceId: "gh.gra.personal-income-tax",
      publisher: "Ghana Revenue Authority",
      publisherType: "tax-authority",
      title: "Personal Income Tax (PIT)",
      url: "https://gra.gov.gh/domestic-tax/personal-income-tax/",
      jurisdiction: "GH",
      retrievedAt: "2026-07-20",
    },
  ],
});

export const ghanaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((year) => ({
      taxYear: String(year),
      modelVersion: `gh-${year}-v1`,
      status: year === 2026 ? "current" : "historical-supported",
      order: year,
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["resident-chargeable-income", "non-resident-chargeable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "incomePeriod", "individualTaxSchedule", "chargeableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Ghana individual income-tax scope",
            description: "The caller confirms the amount is chargeable income governed by the selected Ghana individual schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          incomePeriod: {
            type: "string",
            title: "Income period",
            description: "Select whether the chargeable income covers one month or one complete year.",
            enum: ["monthly", "annual"],
            "x-taxcraft-kind": "plain",
          },
          individualTaxSchedule: {
            type: "string",
            title: "Individual tax schedule",
            description: "Select the legally applicable resident or non-resident schedule without providing identity details.",
            enum: ["resident", "non-resident"],
            "x-taxcraft-kind": "plain",
          },
          chargeableIncomeMinor: {
            type: "integer",
            title: "Chargeable income",
            description: "Caller-confirmed chargeable income in Ghana cedis after applicable deductions and additions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "GHS",
          },
        },
      },
      rounding: [{ stage: "individual-income-tax", mode: "half-up", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), model(year)])),
});

function model(taxYear) {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      if (facts.individualTaxSchedule === "resident") {
        const maximumMinor = facts.incomePeriod === "monthly"
          ? RESIDENT_MONTHLY_MAX_MINOR
          : RESIDENT_ANNUAL_MAX_MINOR;
        if (facts.chargeableIncomeMinor > maximumMinor) {
          return {
            ok: false,
            issues: [{
              code: "facts.unsupported-scope",
              path: "$.chargeableIncomeMinor",
              message: facts.incomePeriod === "monthly"
                ? "Resident monthly income above GHS 19,896.67 is unsupported because the official 30% band and 35% threshold overlap."
                : "Resident annual income above GHS 238,760 is unsupported because the official 30% band and 35% threshold overlap.",
            }],
          };
        }
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const resident = facts.individualTaxSchedule === "resident";
      const bands = resident
        ? (facts.incomePeriod === "monthly" ? RESIDENT_MONTHLY_BANDS : RESIDENT_ANNUAL_BANDS)
        : NON_RESIDENT_BANDS;
      const result = calculateProgressiveBands({
        taxableMinor: facts.chargeableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = resident
        ? DEFINITION.sources.map(({ sourceId }) => sourceId)
        : ["gh.gra.paye-rates-2024", "gh.gra.personal-income-tax"];
      const lines = result.bands.map((band) => ({
        ruleId: `gh.pit.${taxYear}.${facts.incomePeriod}.${facts.individualTaxSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${facts.individualTaxSchedule} ${facts.incomePeriod} income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `gh.pit.${taxYear}.${facts.incomePeriod}.${facts.individualTaxSchedule}.zero-income`,
          label: "Income tax on zero chargeable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          chargeableIncomeMinor: facts.chargeableIncomeMinor,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
