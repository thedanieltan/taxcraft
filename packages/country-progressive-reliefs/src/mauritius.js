import {
  ROUNDING_MODE,
  applyBasisPoints,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const FAIR_SHARE_THRESHOLD_MINOR = 1_200_000_000;
const INCOME_TAX_BANDS = Object.freeze([
  { upperBoundMinor: 50_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 100_000_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: null, rateBasisPoints: 2_000 },
]);
const TAX_YEARS = Object.freeze([
  { taxYear: "2025-26", status: "historical-supported", order: 2025 },
  { taxYear: "2026-27", status: "current", order: 2026 },
  { taxYear: "2027-28", status: "candidate", order: 2027 },
]);

const DEFINITION = Object.freeze({
  code: "MU",
  name: "Mauritius individual income tax and Fair Share Contribution",
  currency: "MUR",
  supported: [
    "individual income tax on caller-confirmed annual chargeable income",
    "Fair Share Contribution using caller-confirmed threshold income and leviable income",
    "income years 2025-26 through 2027-28",
  ],
  unsupported: [
    "gross-income, net-income, chargeable-income, dividend and leviable-income derivation",
    "dependent deductions, interest relief, medical insurance relief and other allowances",
    "residence, source, exemption, filing and relief-eligibility determinations",
    "PAYE withholding by pay period, cumulative payroll calculations and employer remittance",
    "director and board-member withholding elections",
    "social contributions, CSG income allowances and Revenue Minimum Garantie allowances",
    "presumptive tax, tax deduction at source, penalties, interest, prior payments and refunds",
  ],
  assumptions: [
    "The caller supplied annual chargeable income after all legally applicable deductions, exemptions, reliefs and allowances.",
    "The caller supplied the Fair Share Contribution Income Threshold and leviable income using the statutory inclusions and exclusions.",
    "The result is an annual individual income-tax and Fair Share Contribution calculation and not a PAYE withholding schedule.",
  ],
  sources: [
    {
      sourceId: "mu.mra.paye-rates-2025",
      publisher: "Mauritius Revenue Authority",
      publisherType: "tax-authority",
      title: "Pay As You Earn (PAYE)",
      url: "https://www.mra.mu/employers/paye",
      jurisdiction: "MU",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "mu.mra.fair-share-contribution",
      publisher: "Mauritius Revenue Authority",
      publisherType: "tax-authority",
      title: "Fair Share Contribution",
      url: "https://www.mra.mu/index.php/employers/paye/fair-share-contribution",
      jurisdiction: "MU",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const mauritiusPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map(({ taxYear, status, order }) => ({
      taxYear,
      modelVersion: `mu-${taxYear}-v1`,
      status,
      order,
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "income-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["annual-chargeable-income", "fair-share-contribution"],
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
          "chargeableIncomeMinor",
          "fairShareThresholdIncomeMinor",
          "fairShareLeviableIncomeMinor",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Mauritius annual individual-tax scope",
            description: "The caller confirms that the supplied amounts use the applicable Mauritius annual income-tax and Fair Share Contribution definitions.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          chargeableIncomeMinor: {
            type: "integer",
            title: "Annual chargeable income",
            description: "Caller-confirmed annual chargeable income after applicable deductions, exemptions, reliefs and allowances.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "MUR",
          },
          fairShareThresholdIncomeMinor: {
            type: "integer",
            title: "Fair Share Contribution Income Threshold",
            description: "Caller-confirmed statutory threshold income, including applicable net income and included resident dividends.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "MUR",
          },
          fairShareLeviableIncomeMinor: {
            type: "integer",
            title: "Fair Share Contribution leviable income",
            description: "Caller-confirmed statutory leviable income, including applicable chargeable income and included resident dividends.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "MUR",
          },
        },
      },
      rounding: [
        { stage: "individual-income-tax", mode: "half-up", unitMinor: 1 },
        { stage: "fair-share-contribution", mode: "half-up", unitMinor: 1 },
      ],
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
      const issues = [];
      if (facts.fairShareLeviableIncomeMinor < facts.chargeableIncomeMinor) {
        issues.push({
          code: "facts.inconsistent",
          path: "$.fairShareLeviableIncomeMinor",
          message: "Fair Share leviable income cannot be lower than chargeable income.",
        });
      }
      if (facts.fairShareThresholdIncomeMinor < facts.fairShareLeviableIncomeMinor) {
        issues.push({
          code: "facts.inconsistent",
          path: "$.fairShareThresholdIncomeMinor",
          message: "Fair Share threshold income cannot be lower than Fair Share leviable income.",
        });
      }
      return issues.length ? { ok: false, issues } : { ok: true, facts };
    },
    calculate({ facts }) {
      const incomeTax = calculateProgressiveBands({
        taxableMinor: facts.chargeableIncomeMinor,
        bands: INCOME_TAX_BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const fairShareExcessMinor = facts.fairShareThresholdIncomeMinor > FAIR_SHARE_THRESHOLD_MINOR
        ? Math.max(0, facts.fairShareLeviableIncomeMinor - FAIR_SHARE_THRESHOLD_MINOR)
        : 0;
      const fairShareContributionMinor = applyBasisPoints(
        fairShareExcessMinor,
        1_500,
        ROUNDING_MODE.HALF_UP,
      );
      const incomeTaxSourceIds = ["mu.mra.paye-rates-2025"];
      const fairShareSourceIds = ["mu.mra.fair-share-contribution", "mu.mra.paye-rates-2025"];
      const lines = incomeTax.bands.map((band) => ({
        ruleId: `mu.pit.${taxYear}.income-tax.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual chargeable-income band`,
        amountMinor: band.taxMinor,
        sourceIds: incomeTaxSourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `mu.pit.${taxYear}.income-tax.zero-income`,
          label: "Income tax on zero chargeable income",
          amountMinor: 0,
          sourceIds: incomeTaxSourceIds,
        });
      }
      lines.push({
        ruleId: `mu.pit.${taxYear}.fair-share-contribution`,
        label: "15% Fair Share Contribution on leviable income above MUR 12 million",
        amountMinor: fairShareContributionMinor,
        sourceIds: fairShareSourceIds,
      });
      return {
        currency: DEFINITION.currency,
        totals: {
          chargeableIncomeMinor: facts.chargeableIncomeMinor,
          incomeTaxMinor: incomeTax.taxMinor,
          fairShareThresholdIncomeMinor: facts.fairShareThresholdIncomeMinor,
          fairShareLeviableIncomeMinor: facts.fairShareLeviableIncomeMinor,
          fairShareContributionMinor,
          totalTaxAndContributionMinor: incomeTax.taxMinor + fairShareContributionMinor,
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
