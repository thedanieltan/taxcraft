import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const SCHEDULES = Object.freeze({
  single: [
    [1_200_000, 0],
    [1_600_000, 1_500],
    [6_000_000, 2_500],
    [null, 3_500],
  ],
  married: [
    [1_500_000, 0],
    [2_300_000, 1_500],
    [6_000_000, 2_500],
    [null, 3_500],
  ],
  "married-one-child": [
    [1_750_000, 0],
    [2_650_000, 1_500],
    [6_000_000, 2_500],
    [null, 3_500],
  ],
  "married-two-or-more-children": [
    [2_250_000, 0],
    [3_200_000, 1_500],
    [6_000_000, 2_500],
    [null, 3_500],
  ],
  parent: [
    [1_300_000, 0],
    [1_750_000, 1_500],
    [6_000_000, 2_500],
    [null, 3_500],
  ],
  "parent-one-child": [
    [1_450_000, 0],
    [2_100_000, 1_500],
    [6_000_000, 2_500],
    [null, 3_500],
  ],
  "parent-two-or-more-children": [
    [1_850_000, 0],
    [2_550_000, 1_500],
    [6_000_000, 2_500],
    [null, 3_500],
  ],
});
const FILING_SCHEDULES = Object.freeze(Object.keys(SCHEDULES));

const DEFINITION = Object.freeze({
  code: "MT",
  name: "Malta individual filing-schedule income tax",
  currency: "EUR",
  supported: [
    "calendar-year 2026 individual income tax on caller-confirmed annual chargeable income",
    "single, married and parent schedules",
    "married and parent schedules for one child or two or more children",
    "0%, 15%, 25% and 35% statutory bands for each selected schedule",
  ],
  unsupported: [
    "chargeable-income, exemption, deduction and loss-relief derivation",
    "legal eligibility for single, married, parent or child-adjusted schedules",
    "joint versus separate computation decisions and income attribution between spouses",
    "non-resident, permanent-resident, returned-migrant, highly qualified person and other special regimes",
    "social-security contributions, payroll withholding, provisional tax and return reconciliation",
    "investment-income, property, capital-gain and category-specific tax schedules",
    "foreign-tax relief, prior payments, penalties, interest and refunds",
  ],
  assumptions: [
    "The caller supplied annual chargeable income after all legally applicable exemptions, deductions and losses.",
    "The caller selected the legally available filing schedule without providing marital, child or identity data.",
    "Only the ordinary 2026 individual schedule is calculated; special regimes and social-security contributions are excluded.",
  ],
  sources: [
    {
      sourceId: "mt.mtca.individual-tax-rates-2026",
      publisher: "Malta Tax and Customs Administration",
      publisherType: "tax-authority",
      title: "Tax Rates for Individuals — 2026",
      url: "https://mtca.gov.mt/personal-tax/tax-rates/tax-ratesindividuals/2026",
      jurisdiction: "MT",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const maltaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `mt-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: FILING_SCHEDULES,
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "filingSchedule", "chargeableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Malta individual income-tax scope",
            description: "The caller confirms the selected 2026 filing schedule and chargeable-income amount are legally applicable.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          filingSchedule: {
            type: "string",
            title: "Individual filing schedule",
            description: "Select the legally applicable schedule without providing marital, child or identity data.",
            enum: FILING_SCHEDULES,
            "x-taxcraft-kind": "plain",
          },
          chargeableIncomeMinor: {
            type: "integer",
            title: "Annual chargeable income",
            description: "Caller-confirmed annual chargeable income in euro after applicable exemptions, deductions and losses.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [{ stage: "individual-income-tax", mode: "half-up", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: {
    [TAX_YEAR]: model(),
  },
});

function model() {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const bands = SCHEDULES[facts.filingSchedule].map(([upperBoundMinor, rateBasisPoints]) => ({
        upperBoundMinor,
        rateBasisPoints,
      }));
      const result = calculateProgressiveBands({
        taxableMinor: facts.chargeableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `mt.pit.${TAX_YEAR}.${facts.filingSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${formatSchedule(facts.filingSchedule)} band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `mt.pit.${TAX_YEAR}.${facts.filingSchedule}.zero-income`,
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

function formatSchedule(filingSchedule) {
  return filingSchedule.replaceAll("-", " ");
}
