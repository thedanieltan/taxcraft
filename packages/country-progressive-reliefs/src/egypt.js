import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const TEN_EGP_MINOR = 1_000;

const DEFINITION = Object.freeze({
  code: "EG",
  name: "Egypt annual individual income tax",
  currency: "EGP",
  supported: [
    "calendar-year 2026 Article 8 individual income-tax matrix",
    "income-dependent removal of lower-rate bands above EGP 600,000, 700,000, 800,000, 900,000 and 1,200,000",
    "0%, 10%, 15%, 20%, 22.5%, 25% and 27.5% statutory rates",
    "statutory rounding of annual net income down to the nearest EGP 10 before calculating tax",
  ],
  unsupported: [
    "gross-income, salary, business-profit, expense, deduction and net-taxable-income derivation",
    "EGP 20,000 salary personal exemption, social-insurance deductions and private-insurance deductions",
    "payroll withholding, monthly apportionment, annual payroll reconciliation and employer administration",
    "small-project turnover regimes, capital gains, dividends, real-estate and other separate or final-rate income",
    "tax incentives, credits, foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual net taxable income after all legally applicable exemptions and deductions.",
    "The ordinary Article 8 individual matrix applies and no simplified, separate or final-rate regime applies.",
    "The supplied net taxable income is also the total net income used to select the applicable Article 8 column.",
  ],
  sources: [
    {
      sourceId: "eg.eta.income-tax-law-7-2024-article-8",
      publisher: "Egyptian Tax Authority",
      publisherType: "tax-authority",
      title: "Law No. 7 of 2024 amending Article 8 of the Income Tax Law",
      url: "https://eta.gov.eg/sites/default/files/2024-03/law_no.7-2024.pdf",
      jurisdiction: "EG",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "eg.eta.current-payroll-tax-faq-2026",
      publisher: "Egyptian Tax Authority",
      publisherType: "tax-authority",
      title: "Current payroll tax calculation and annual personal exemption FAQ",
      url: "https://portal.eta.gov.eg/ar/alasylt-alshayt",
      jurisdiction: "EG",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "eg.eta.income-tax-laws-register",
      publisher: "Egyptian Tax Authority",
      publisherType: "tax-authority",
      title: "Income tax laws register",
      url: "https://www.eta.gov.eg/ar/content/qwanyn-aldrybt-ly-aldkhl",
      jurisdiction: "EG",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const egyptPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `eg-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["article-8-annual-net-taxable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "netTaxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Egypt Article 8 scope",
            description: "The caller confirms that the supplied amount is annual net taxable income governed by the ordinary Article 8 matrix.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          netTaxableIncomeMinor: {
            type: "integer",
            title: "Annual net taxable income",
            description: "Caller-confirmed annual net taxable income in Egyptian pounds after applicable exemptions and deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EGP",
          },
        },
      },
      rounding: [
        { stage: "annual-net-income", mode: "floor", unitMinor: TEN_EGP_MINOR },
        { stage: "article-8-income-tax", mode: "half-up", unitMinor: 1 },
      ],
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
      const roundedNetTaxableIncomeMinor = Math.floor(facts.netTaxableIncomeMinor / TEN_EGP_MINOR) * TEN_EGP_MINOR;
      const schedule = selectSchedule(roundedNetTaxableIncomeMinor);
      const result = calculateProgressiveBands({
        taxableMinor: roundedNetTaxableIncomeMinor,
        bands: schedule.bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `eg.pit.${TAX_YEAR}.${schedule.id}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} Article 8 band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `eg.pit.${TAX_YEAR}.${schedule.id}.zero-income`,
          label: "Income tax on zero rounded net taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          suppliedNetTaxableIncomeMinor: facts.netTaxableIncomeMinor,
          roundedNetTaxableIncomeMinor,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function selectSchedule(netIncomeMinor) {
  if (netIncomeMinor <= 60_000_000) {
    return {
      id: "net-income-up-to-600000",
      bands: [
        { upperBoundMinor: 4_000_000, rateBasisPoints: 0 },
        { upperBoundMinor: 5_500_000, rateBasisPoints: 1_000 },
        { upperBoundMinor: 7_000_000, rateBasisPoints: 1_500 },
        { upperBoundMinor: 20_000_000, rateBasisPoints: 2_000 },
        { upperBoundMinor: 40_000_000, rateBasisPoints: 2_250 },
        { upperBoundMinor: null, rateBasisPoints: 2_500 },
      ],
    };
  }
  if (netIncomeMinor <= 70_000_000) {
    return {
      id: "net-income-600000-to-700000",
      bands: [
        { upperBoundMinor: 5_500_000, rateBasisPoints: 1_000 },
        { upperBoundMinor: 7_000_000, rateBasisPoints: 1_500 },
        { upperBoundMinor: 20_000_000, rateBasisPoints: 2_000 },
        { upperBoundMinor: 40_000_000, rateBasisPoints: 2_250 },
        { upperBoundMinor: null, rateBasisPoints: 2_500 },
      ],
    };
  }
  if (netIncomeMinor <= 80_000_000) {
    return {
      id: "net-income-700000-to-800000",
      bands: [
        { upperBoundMinor: 7_000_000, rateBasisPoints: 1_500 },
        { upperBoundMinor: 20_000_000, rateBasisPoints: 2_000 },
        { upperBoundMinor: 40_000_000, rateBasisPoints: 2_250 },
        { upperBoundMinor: null, rateBasisPoints: 2_500 },
      ],
    };
  }
  if (netIncomeMinor <= 90_000_000) {
    return {
      id: "net-income-800000-to-900000",
      bands: [
        { upperBoundMinor: 20_000_000, rateBasisPoints: 2_000 },
        { upperBoundMinor: 40_000_000, rateBasisPoints: 2_250 },
        { upperBoundMinor: null, rateBasisPoints: 2_500 },
      ],
    };
  }
  if (netIncomeMinor <= 120_000_000) {
    return {
      id: "net-income-900000-to-1200000",
      bands: [
        { upperBoundMinor: 40_000_000, rateBasisPoints: 2_250 },
        { upperBoundMinor: null, rateBasisPoints: 2_500 },
      ],
    };
  }
  return {
    id: "net-income-above-1200000",
    bands: [
      { upperBoundMinor: 120_000_000, rateBasisPoints: 2_500 },
      { upperBoundMinor: null, rateBasisPoints: 2_750 },
    ],
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
