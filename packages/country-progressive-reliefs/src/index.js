import {
  ROUNDING_MODE,
  applyTaxCredit,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);
const ANNUAL_BANDS = Object.freeze([
  { upperBoundMinor: 28_800_000, rateBasisPoints: 1000 },
  { upperBoundMinor: 38_800_000, rateBasisPoints: 2500 },
  { upperBoundMinor: 600_000_000, rateBasisPoints: 3000 },
  { upperBoundMinor: 960_000_000, rateBasisPoints: 3250 },
  { upperBoundMinor: null, rateBasisPoints: 3500 },
]);
const MONTHLY_BANDS = Object.freeze([
  { upperBoundMinor: 2_400_000, rateBasisPoints: 1000 },
  { upperBoundMinor: 3_233_300, rateBasisPoints: 2500 },
  { upperBoundMinor: 50_000_000, rateBasisPoints: 3000 },
  { upperBoundMinor: 80_000_000, rateBasisPoints: 3250 },
  { upperBoundMinor: null, rateBasisPoints: 3500 },
]);
const ANNUAL_PERSONAL_RELIEF_MINOR = 2_880_000;
const MONTHLY_PERSONAL_RELIEF_MINOR = 240_000;

export const progressiveReliefPackages = Object.freeze([createKenyaPackage()]);
export const progressiveReliefPackagesByJurisdiction = Object.freeze(Object.fromEntries(
  progressiveReliefPackages.map((countryPackage) => [
    countryPackage.manifest.jurisdiction,
    countryPackage,
  ]),
));

function createKenyaPackage() {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "incomePeriod", "individualTaxSchedule", "taxableEmploymentIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Kenya employment-income-tax scope",
        description: "The caller confirms the amount is taxable employment income after applicable deductions.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      incomePeriod: {
        type: "string",
        title: "Income period",
        description: "Select whether the entered taxable employment income covers one month or one complete year of income.",
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
      taxableEmploymentIncomeMinor: {
        type: "integer",
        title: "Taxable employment income",
        description: "Caller-confirmed taxable employment income in KES after allowable deductions.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "KES",
      },
    },
  };

  const definition = {
    code: "KE",
    name: "Kenya employment income tax",
    currency: "KES",
    supported: [
      "monthly or annual employment income tax on caller-confirmed taxable employment income",
      "10%, 25%, 30%, 32.5% and 35% individual tax bands",
      "standard personal relief for resident individuals",
      "years of income 2024 through 2026",
    ],
    unsupported: [
      "taxable-employment-income and deduction derivation",
      "insurance relief, disability exemptions and other personal reliefs",
      "Affordable Housing Levy, Social Health Insurance Fund and pension contributions",
      "withholding reconciliation, prior tax payments and refunds",
      "residence, source and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied taxable employment income after all applicable deductions.",
      "The caller selected the legally applicable resident or non-resident schedule without providing identity data.",
      "Only the standard resident personal relief is applied; all other reliefs and exemptions are excluded.",
    ],
    sources: [
      {
        sourceId: "ke.kra.paye-rates-and-relief",
        publisher: "Kenya Revenue Authority",
        publisherType: "tax-authority",
        title: "Pay As You Earn (PAYE)",
        url: "https://www.kra.go.ke/individual/filing-paying/types-of-taxes/paye",
        jurisdiction: "KE",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "ke.kra.individual-income-tax",
        publisher: "Kenya Revenue Authority",
        publisherType: "tax-authority",
        title: "Individual Income Tax",
        url: "https://www.kra.go.ke/individual/filing-paying/types-of-taxes/individual-income-tax",
        jurisdiction: "KE",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "ke.kra.paye-amendments-2024",
        publisher: "Kenya Revenue Authority",
        publisherType: "tax-authority",
        title: "Amendments to PAYE Computation Pursuant to the Tax Laws (Amendment) Act, 2024",
        url: "https://www.kra.go.ke/news-center/public-notices/2157-amendments-to-paye-computation-pursuant-to-the-tax-laws-amendment-act%2C-2024",
        jurisdiction: "KE",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "ke.kra.employer-reliefs-guidance-2025",
        publisher: "Kenya Revenue Authority",
        publisherType: "tax-authority",
        title: "Guidance on Employer Obligations in Applying Income Tax Deductions, Reliefs and Exemptions",
        url: "https://www.kra.go.ke/news-center/public-notices/2307-guidance-on-employer-obligations-in-applying-income-tax-deductions%2C-reliefs-and-exemptions",
        jurisdiction: "KE",
        retrievedAt: "2026-07-18",
      },
    ],
  };

  return definePitCountryPackage({
    manifest: {
      jurisdiction: definition.code,
      name: definition.name,
      storesUserPII: false,
      advisory: false,
      taxYears: TAX_YEARS.map((year) => ({
        taxYear: String(year),
        modelVersion: `ke-${year}-v1`,
        status: year === 2026 ? "current" : "historical-supported",
        order: year,
      })),
      pit: {
        contractVersion: "taxcraft.pit-country-package.v1",
        taxUnit: "individual",
        taxYearBasis: "year-of-income",
        currencyCodes: [definition.currency],
        incomeSchedules: ["employment-income"],
        taxLayers: {
          national: true,
          subnational: false,
          local: false,
          subdivisionRequired: false,
        },
        factsSchema,
        rounding: [
          { stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 },
          { stage: "personal-relief", mode: "half-up", unitMinor: 1 },
        ],
        maintenance: { mode: "manual", sourceWatch: false },
      },
    },
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), kenyaModel(definition, year)])),
  });
}

function kenyaModel(definition, year) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const monthly = facts.incomePeriod === "monthly";
      const result = calculateProgressiveBands({
        taxableMinor: facts.taxableEmploymentIncomeMinor,
        bands: monthly ? MONTHLY_BANDS : ANNUAL_BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const availableReliefMinor = facts.individualTaxSchedule === "resident"
        ? (monthly ? MONTHLY_PERSONAL_RELIEF_MINOR : ANNUAL_PERSONAL_RELIEF_MINOR)
        : 0;
      const relief = applyTaxCredit({
        taxMinor: result.taxMinor,
        creditMinor: availableReliefMinor,
        refundable: false,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `ke.pit.${year}.${facts.incomePeriod}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} individual income-tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `ke.pit.${year}.${facts.incomePeriod}.zero-income`,
          label: "Income tax on zero taxable employment income",
          amountMinor: 0,
          sourceIds,
        });
      }
      if (relief.appliedCreditMinor > 0) {
        lines.push({
          ruleId: `ke.pit.${year}.${facts.incomePeriod}.personal-relief`,
          label: "Standard resident personal relief applied",
          amountMinor: -relief.appliedCreditMinor,
          sourceIds,
        });
      }
      return {
        currency: definition.currency,
        totals: {
          taxableEmploymentIncomeMinor: facts.taxableEmploymentIncomeMinor,
          grossIncomeTaxMinor: result.taxMinor,
          availablePersonalReliefMinor: availableReliefMinor,
          personalReliefAppliedMinor: relief.appliedCreditMinor,
          incomeTaxMinor: relief.taxAfterCreditMinor,
        },
        lines,
        assumptions: [...definition.assumptions],
        coverage: coverage(definition),
      };
    },
  };
}

function coverage(definition) {
  return {
    supported: [...definition.supported],
    unsupported: [...definition.unsupported],
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
