import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const HIGH_RATE_THRESHOLD_MINOR = 600_000_000;
const THRESHOLDS = Object.freeze({
  standard: 187_661_400,
  pensioner: 212_665_400,
  "golden-age": 212_665_400,
  "pensioner-and-golden-age": 237_665_400,
});

const DEFINITION = Object.freeze({
  code: "JM",
  name: "Jamaica individual income tax",
  currency: "JMD",
  supported: [
    "calendar-year 2026 individual aggregate income tax",
    "effective annual standard threshold of JMD 1,876,614",
    "single pensioner or golden-age additional exemption of JMD 250,040",
    "expressly published combined pensioner-and-golden-age threshold of JMD 2,376,654",
    "25% ordinary rate and 30% rate on aggregate income above JMD 6 million",
  ],
  unsupported: [
    "statutory-income, aggregate-income, expense, loss and deduction derivation",
    "pensioner, approved-pension and golden-age eligibility determinations",
    "reverse tax credits and other refundable or non-refundable credits",
    "disaster-relief honoraria exemptions and other source-specific exemptions",
    "PAYE periodic, cumulative payroll and employer adjustment calculations",
    "National Insurance Scheme, National Housing Trust, Education Tax and other payroll contributions",
    "estimated tax, quarterly payments, filing balances, penalties, interest, prior payments and refunds",
    "residence, source and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied calendar-year aggregate income after all legally applicable expenses, losses, deductions and exclusions.",
    "The caller selected the legally applicable exemption schedule without providing age, pension or identity data.",
    "The combined pensioner-and-golden-age schedule uses the expressly published JMD 2,376,654 threshold rather than recomputing the two separately stated additional exemptions.",
    "The 2026 revenue measures did not publish a replacement for the ordinary 25% and 30% individual income-tax rates.",
  ],
  sources: [
    {
      sourceId: "jm.taj.threshold-2026",
      publisher: "Tax Administration Jamaica via Jamaica Information Service",
      publisherType: "tax-authority",
      title: "Increase in Income Tax Threshold Now in Effect",
      url: "https://jis.gov.jm/increase-in-income-tax-threshold-now-in-effect/",
      jurisdiction: "JM",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "jm.jis.individual-rates",
      publisher: "Jamaica Information Service",
      publisherType: "government-agency",
      title: "Income Tax Changes for Self-Employed Persons",
      url: "https://jis.gov.jm/income-tax-changes-self-employed-persons/",
      jurisdiction: "JM",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "jm.mof.revenue-measures-2026-27",
      publisher: "Ministry of Finance and the Public Service, Jamaica",
      publisherType: "official-budget",
      title: "Revenue Measures for Financial Year 2026/2027",
      url: "https://www.mof.gov.jm/wp-content/uploads/Revenue-Measures-2026-2027.pdf",
      jurisdiction: "JM",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const jamaicaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `jm-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["aggregate-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "exemptionSchedule", "aggregateIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Jamaica individual aggregate-income scope",
            description: "The caller confirms that the supplied amount is calendar-year aggregate income governed by the ordinary individual rate schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          exemptionSchedule: {
            type: "string",
            title: "Individual exemption schedule",
            description: "Select the legally applicable standard, pensioner, golden-age or combined schedule without providing identity or age data.",
            enum: ["standard", "pensioner", "golden-age", "pensioner-and-golden-age"],
            "x-taxcraft-kind": "plain",
          },
          aggregateIncomeMinor: {
            type: "integer",
            title: "Calendar-year aggregate income",
            description: "Caller-confirmed aggregate income in Jamaican dollars after applicable expenses, losses, deductions and exclusions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "JMD",
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
      const applicableThresholdMinor = THRESHOLDS[facts.exemptionSchedule];
      const bands = [
        { upperBoundMinor: applicableThresholdMinor, rateBasisPoints: 0 },
        { upperBoundMinor: HIGH_RATE_THRESHOLD_MINOR, rateBasisPoints: 2_500 },
        { upperBoundMinor: null, rateBasisPoints: 3_000 },
      ];
      const result = calculateProgressiveBands({
        taxableMinor: facts.aggregateIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `jm.pit.${TAX_YEAR}.${facts.exemptionSchedule}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} aggregate-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `jm.pit.${TAX_YEAR}.${facts.exemptionSchedule}.zero-income`,
          label: "Income tax on zero aggregate income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          aggregateIncomeMinor: facts.aggregateIncomeMinor,
          applicableThresholdMinor,
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
