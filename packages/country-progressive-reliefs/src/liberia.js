import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BANDS = Object.freeze([
  { upperBoundMinor: 7_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 20_000_000, rateBasisPoints: 500 },
  { upperBoundMinor: 80_000_000, rateBasisPoints: 1_500 },
  { upperBoundMinor: null, rateBasisPoints: 2_500 },
]);

const DEFINITION = Object.freeze({
  code: "LR",
  name: "Liberia employee personal income tax",
  currency: "LRD",
  supported: [
    "calendar-year 2026 employee personal income tax on caller-confirmed annual gross taxable income",
    "0%, 5%, 15% and 25% employee marginal bands",
  ],
  unsupported: [
    "cash and non-cash employment-benefit valuation",
    "annual LRD 100,000 exemption on qualifying non-cash benefits",
    "contractor payments subject to the separate 10% flat withholding rate",
    "board fees, services, rent, interest, dividends, royalties and other withholding schedules",
    "business, presumptive, corporate, mining and petroleum income tax",
    "monthly payroll withholding, employer remittance, annual reconciliation and filing balances",
    "gross-taxable-income derivation, residence, source, exemption and filing-obligation determinations",
    "penalties, interest, prior payments and refunds",
  ],
  assumptions: [
    "The caller supplied annual gross taxable employee income after applying any legally available exemption for qualifying non-cash benefits.",
    "The income is employee remuneration and not a contractor payment or another separately withheld income category.",
    "The package calculates annual employee PIT only and does not reproduce employer monthly withholding mechanics.",
  ],
  sources: [
    {
      sourceId: "lr.lra.employee-pit-table",
      publisher: "Liberia Revenue Authority",
      publisherType: "tax-authority",
      title: "Domestic Tax Education — Personal Income Tax",
      url: "https://revenue.lra.gov.lr/domestic-tax/tax-education/",
      jurisdiction: "LR",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "lr.lra.tax-amendment-2026-notice",
      publisher: "Liberia Revenue Authority",
      publisherType: "tax-authority",
      title: "Important Revenue Notice: Adjustment to Goods and Services Tax Rates",
      url: "https://revenue.lra.gov.lr/important-revenue-noticeadjustment-to-goods-and-services-tax-gst-rates/",
      jurisdiction: "LR",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const liberiaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `lr-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["annual-employee-gross-taxable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "annualGrossTaxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Liberia employee PIT scope",
            description: "The caller confirms that the supplied amount is annual gross taxable employee income governed by the employee PIT table.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          annualGrossTaxableIncomeMinor: {
            type: "integer",
            title: "Annual gross taxable employee income",
            description: "Caller-confirmed annual gross taxable employee income in Liberian dollars after the applicable qualifying non-cash-benefit exemption.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "LRD",
          },
        },
      },
      rounding: [{ stage: "employee-personal-income-tax", mode: "half-up", unitMinor: 1 }],
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
      const result = calculateProgressiveBands({
        taxableMinor: facts.annualGrossTaxableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = ["lr.lra.employee-pit-table"];
      const lines = result.bands.map((band) => ({
        ruleId: `lr.pit.${TAX_YEAR}.employee.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual employee PIT band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `lr.pit.${TAX_YEAR}.employee.zero-income`,
          label: "Personal income tax on zero employee income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          annualGrossTaxableIncomeMinor: facts.annualGrossTaxableIncomeMinor,
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
