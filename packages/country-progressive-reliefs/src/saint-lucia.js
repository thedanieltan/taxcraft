import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const MAX_SUPPORTED_CHARGEABLE_INCOME_MINOR = 3_000_000;
const BANDS = Object.freeze([
  { upperBoundMinor: 1_000_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: 2_000_000, rateBasisPoints: 1_500 },
  { upperBoundMinor: MAX_SUPPORTED_CHARGEABLE_INCOME_MINOR, rateBasisPoints: 2_000 },
]);

const DEFINITION = Object.freeze({
  code: "LC",
  name: "Saint Lucia individual income tax",
  currency: "XCD",
  supported: [
    "income-year 2026 individual income tax on caller-confirmed annual chargeable income through XCD 30,000",
    "10% on the first XCD 10,000 of annual chargeable income",
    "15% on the next XCD 10,000 and 20% on the next XCD 10,000",
  ],
  unsupported: [
    "annual chargeable income above XCD 30,000 because the current IRD page publishes an internally inconsistent fixed tax amount for the 30% band",
    "assessable-income, allowance, deduction and chargeable-income derivation",
    "personal, child, education, medical, insurance, mortgage, investment and other deduction eligibility",
    "pension-income exemption and tax-code determination",
    "PAYE tables, periodic withholding, NIC, filing balances, penalties, interest, prior payments and refunds",
    "residence, source, exemption and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual chargeable income after all legally applicable allowances, deductions and exemptions.",
    "The amount is governed by the ordinary individual chargeable-income schedule.",
    "Calculations fail closed above XCD 30,000 because the IRD page's published 30% fixed amount does not reconcile with the preceding bands.",
  ],
  sources: [
    {
      sourceId: "lc.ird.individual-income-tax-rates",
      publisher: "Inland Revenue Department, Saint Lucia",
      publisherType: "tax-authority",
      title: "FAQs: Allowances and Deductions",
      url: "https://irdstlucia.gov.lc/index.php/component/content/category/30-faqs-allowances-deductions?Itemid=101",
      jurisdiction: "LC",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "lc.gov.income-tax-amendments-2026",
      publisher: "Government of Saint Lucia",
      publisherType: "government-agency",
      title: "Tax Code Updates Essential Following Announcement of Income Tax Changes",
      url: "https://www.govt.lc/news/tax-code-updates-essential-following-announcement-of-income-tax-changes",
      jurisdiction: "LC",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "lc.gov.budget-2026-no-new-taxes",
      publisher: "Government of Saint Lucia",
      publisherType: "official-budget",
      title: "Budget 2026/27: More Support for Families, More Space for Business, No New Taxes",
      url: "https://sustainabledevelopment.govt.lc/news/budget-2026-27-more-support-for-families-more-space-for-business-no-new-taxes",
      jurisdiction: "LC",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const saintLuciaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `lc-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "income-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["annual-chargeable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "annualChargeableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Saint Lucia annual individual-tax scope",
            description: "The caller confirms that the supplied amount is annual chargeable income governed by the ordinary individual rate schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          annualChargeableIncomeMinor: {
            type: "integer",
            title: "Annual chargeable income",
            description: "Caller-confirmed annual chargeable income in East Caribbean dollars after applicable allowances, deductions and exemptions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "XCD",
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
      if (facts.annualChargeableIncomeMinor > MAX_SUPPORTED_CHARGEABLE_INCOME_MINOR) {
        return {
          ok: false,
          issues: [{
            code: "facts.unsupported-scope",
            path: "$.annualChargeableIncomeMinor",
            message: "Annual chargeable income above XCD 30,000 is unsupported because the IRD's published fixed amount for the 30% band does not reconcile with the preceding bands.",
          }],
        };
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const result = calculateProgressiveBands({
        taxableMinor: facts.annualChargeableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `lc.pit.${TAX_YEAR}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual chargeable-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `lc.pit.${TAX_YEAR}.zero-income`,
          label: "Income tax on zero chargeable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          annualChargeableIncomeMinor: facts.annualChargeableIncomeMinor,
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
