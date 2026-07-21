import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze(["2025", "2026", "2027"]);
const BANDS = Object.freeze([
  { upperBoundMinor: 10_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 15_000_000, rateBasisPoints: 1_800 },
  { upperBoundMinor: 35_000_000, rateBasisPoints: 2_500 },
  { upperBoundMinor: 55_000_000, rateBasisPoints: 2_800 },
  { upperBoundMinor: 85_000_000, rateBasisPoints: 3_000 },
  { upperBoundMinor: 155_000_000, rateBasisPoints: 3_200 },
  { upperBoundMinor: null, rateBasisPoints: 3_700 },
]);

const DEFINITION = Object.freeze({
  code: "NA",
  name: "Namibia individual normal tax",
  currency: "NAD",
  supported: [
    "annual normal tax on caller-confirmed individual taxable income",
    "0%, 18%, 25%, 28%, 30%, 32% and 37% statutory bands",
    "Namibian years of assessment 2025 through 2027",
  ],
  unsupported: [
    "gross-income, exemption, deduction and taxable-income derivation",
    "employee-tax withholding, payroll periods, provisional tax and return reconciliation",
    "pension, retirement-fund, medical, insurance, farming, business and assessed-loss calculations",
    "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, taxpayer-status and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after all legally applicable exemptions and deductions.",
    "The amount is governed by Schedule 4's individual rates of normal tax.",
    "The package does not infer residence, source, employee withholding or filing status.",
  ],
  sources: [
    {
      sourceId: "na.gazette.income-tax-amendment-2024",
      publisher: "Government Gazette of the Republic of Namibia",
      publisherType: "official-gazette",
      title: "Income Tax Amendment Act, 2024 (Act No. 4 of 2024)",
      url: "https://www.lac.org.na/laws/2024/8442.pdf",
      jurisdiction: "NA",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "na.mof.tax-policy-unit",
      publisher: "Ministry of Finance, Namibia",
      publisherType: "finance-ministry",
      title: "Tax Policy Unit",
      url: "https://mof.gov.na/tax-policy-unit",
      jurisdiction: "NA",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "na.namra.individual-tax-scope",
      publisher: "Namibia Revenue Agency",
      publisherType: "tax-authority",
      title: "Individual Taxpayer Categories",
      url: "https://www.itas.namra.org.na/individual",
      jurisdiction: "NA",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const namibiaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((taxYear) => ({
      taxYear,
      modelVersion: `na-${taxYear}-v1`,
      status: taxYear === "2027" ? "current" : "historical-supported",
      order: Number(taxYear),
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "tax-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["annual-taxable-income"],
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
            title: "Confirmed Namibia individual normal-tax scope",
            description: "The caller confirms that the supplied amount is annual taxable income governed by Schedule 4's individual rates.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          taxableIncomeMinor: {
            type: "integer",
            title: "Annual taxable income",
            description: "Caller-confirmed annual taxable income in Namibia dollars after applicable exemptions and deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "NAD",
          },
        },
      },
      rounding: [{ stage: "individual-normal-tax", mode: "half-up", unitMinor: 1 }],
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
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const result = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `na.pit.${taxYear}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual taxable-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `na.pit.${taxYear}.zero-income`,
          label: "Normal tax on zero taxable income",
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
