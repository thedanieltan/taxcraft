import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([
  { taxYear: "2024-25", status: "historical-supported", order: 2024 },
  { taxYear: "2025-26", status: "historical-supported", order: 2025 },
  { taxYear: "2026-27", status: "current", order: 2026 },
]);

const BANDS_2024_25 = Object.freeze([
  { upperBoundMinor: 50_000_000, rateBasisPoints: 600 },
  { upperBoundMinor: 100_000_000, rateBasisPoints: 1_200 },
  { upperBoundMinor: 150_000_000, rateBasisPoints: 1_800 },
  { upperBoundMinor: 200_000_000, rateBasisPoints: 2_400 },
  { upperBoundMinor: 250_000_000, rateBasisPoints: 3_000 },
  { upperBoundMinor: null, rateBasisPoints: 3_600 },
]);

const BANDS_2025_26_ONWARD = Object.freeze([
  { upperBoundMinor: 100_000_000, rateBasisPoints: 600 },
  { upperBoundMinor: 150_000_000, rateBasisPoints: 1_800 },
  { upperBoundMinor: 200_000_000, rateBasisPoints: 2_400 },
  { upperBoundMinor: 250_000_000, rateBasisPoints: 3_000 },
  { upperBoundMinor: null, rateBasisPoints: 3_600 },
]);

const DEFINITION = Object.freeze({
  code: "LK",
  name: "Sri Lanka standard individual income tax",
  currency: "LKR",
  supported: [
    "standard individual income tax on caller-confirmed taxable income",
    "resident and non-resident individual standard-rate scope",
    "years of assessment 2024-25 through 2026-27",
  ],
  unsupported: [
    "personal, rental, solar-panel and other relief or deduction derivation",
    "gains from realization of investment assets, including the 15% individual capital-gains rate effective 3 June 2026",
    "terminal benefits and compensation for loss of office",
    "betting, gaming, liquor and tobacco business income subject to special rates",
    "Advance Personal Income Tax withholding tables and payroll-period calculations",
    "withholding tax, advance income tax, quarterly installments, filing balances, penalties, interest, prior payments and refunds",
    "residence, citizenship, source, exemption and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied taxable income after all legally available personal and other reliefs, deductions and exclusions.",
    "The amount is governed by the standard individual taxable-income schedule and excludes investment gains, terminal benefits and special-rate business income.",
    "The 2026-27 standard-rate model carries forward the published 2025-26 standard bands because the June 2026 amendment notice changes capital-gains and administrative provisions without publishing a replacement standard individual table.",
  ],
  sources: [
    {
      sourceId: "lk.ird.tax-chart-2024-25",
      publisher: "Inland Revenue Department, Sri Lanka",
      publisherType: "tax-authority",
      title: "Tax Chart — Year of Assessment 2024/2025",
      url: "https://www.ird.gov.lk/en/publications/SitePages/Tax_Chart_2425.aspx?menuid=140407",
      jurisdiction: "LK",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "lk.ird.tax-chart-2025-26",
      publisher: "Inland Revenue Department, Sri Lanka",
      publisherType: "tax-authority",
      title: "Tax Chart — Year of Assessment 2025/2026",
      url: "https://www.ird.gov.lk/en/publications/SitePages/tax_chart_2526.aspx?menuid=1401",
      jurisdiction: "LK",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "lk.ird.inland-revenue-amendment-2026-notice",
      publisher: "Inland Revenue Department, Sri Lanka",
      publisherType: "tax-authority",
      title: "Notice on Inland Revenue (Amendment) Act, No. 11 of 2026",
      url: "https://www.ird.gov.lk/en/Lists/Latest%20News%20%20Notices/Attachments/794/SEC_PN_IT_2026-02_E.pdf",
      jurisdiction: "LK",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "lk.ird.apit-tables-2025-26",
      publisher: "Inland Revenue Department, Sri Lanka",
      publisherType: "tax-authority",
      title: "Advance Personal Income Tax Tables 2025–2026",
      url: "https://www.ird.gov.lk/en/publications/sitepages/apit_tax_tables.aspx?menuid=1502",
      jurisdiction: "LK",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const sriLankaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map(({ taxYear, status, order }) => ({
      taxYear,
      modelVersion: `lk-${taxYear}-v1`,
      status,
      order,
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "year-of-assessment",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["standard-taxable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Sri Lanka standard individual-tax scope",
            description: "The caller confirms that the amount is taxable income governed by the standard individual rate table, after applicable reliefs and exclusions.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          taxableIncomeMinor: {
            type: "integer",
            title: "Taxable income",
            description: "Caller-confirmed taxable income in Sri Lankan rupees after applicable reliefs, deductions and exclusions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "LKR",
          },
        },
      },
      rounding: [{ stage: "standard-individual-income-tax", mode: "half-up", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map(({ taxYear }) => [taxYear, model(taxYear)])),
});

function model(taxYear) {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const bands = taxYear === "2024-25" ? BANDS_2024_25 : BANDS_2025_26_ONWARD;
      const result = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = sourceIdsForYear(taxYear);
      const lines = result.bands.map((band) => ({
        ruleId: `lk.pit.${taxYear}.standard-income.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} standard taxable-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `lk.pit.${taxYear}.standard-income.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function sourceIdsForYear(taxYear) {
  if (taxYear === "2024-25") return ["lk.ird.tax-chart-2024-25"];
  if (taxYear === "2025-26") return ["lk.ird.tax-chart-2025-26"];
  return [
    "lk.ird.tax-chart-2025-26",
    "lk.ird.inland-revenue-amendment-2026-notice",
    "lk.ird.apit-tables-2025-26",
  ];
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
