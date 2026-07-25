import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const ORDINARY_INCOME_RATE_BASIS_POINTS = 2_200;
const NATIONAL_INSURANCE_RATE_BASIS_POINTS = 760;
const NATIONAL_INSURANCE_LOWER_LIMIT_MINOR = 9_965_000;
const NATIONAL_INSURANCE_CAP_RATE_BASIS_POINTS = 2_500;
const BRACKET_BANDS = Object.freeze([
  { lowerBoundMinor: 22_610_000, upperBoundMinor: 31_830_000, rateBasisPoints: 170 },
  { lowerBoundMinor: 31_830_000, upperBoundMinor: 72_505_000, rateBasisPoints: 400 },
  { lowerBoundMinor: 72_505_000, upperBoundMinor: 98_010_000, rateBasisPoints: 1_370 },
  { lowerBoundMinor: 98_010_000, upperBoundMinor: 146_720_000, rateBasisPoints: 1_680 },
  { lowerBoundMinor: 146_720_000, upperBoundMinor: null, rateBasisPoints: 1_780 },
]);

const DEFINITION = Object.freeze({
  code: "NO",
  name: "Norway 2026 ordinary-income, bracket-tax and salary-contribution model",
  currency: "NOK",
  supported: [
    "calendar-year 2026 ordinary-income tax at the standard 22% rate",
    "five-step 2026 bracket tax on caller-confirmed personal income",
    "7.6% salary national-insurance contribution for persons aged 17 to 69",
    "national-insurance lower limit and 25% contribution cap above that limit",
    "separate income-tax and national-insurance reporting with øre-level reconciliation",
  ],
  unsupported: [
    "gross-income, ordinary-income, personal-income, deduction and allowance derivation",
    "18.5% ordinary-income rate and special deductions for the Finnmark and Nord-Troms priority zone",
    "personal allowance, minimum standard deduction and other deduction calculations",
    "pension, business, fishing, hunting, childcare and age-specific national-insurance schedules",
    "wealth tax, dividend gross-up, shareholder tax, employer contributions and indirect taxes",
    "foreign-worker PAYE, withholding, prepayments, refunds and assessment reconciliation",
    "residence, source, treaty, social-security coverage and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied ordinary income after all deductions and allowances for the standard 22% rate.",
    "The caller supplied personal income for the five-step bracket-tax calculation.",
    "The caller supplied salary income covered by the 7.6% national-insurance schedule for a person aged 17 to 69.",
    "The taxpayer is not using the Finnmark and Nord-Troms priority-zone ordinary-income rate.",
  ],
  sources: [
    {
      sourceId: "no.finance-ministry.tax-rates-2026",
      publisher: "Norwegian Ministry of Finance",
      publisherType: "finance-ministry",
      title: "Tax rates, allowances and thresholds for 2026",
      url: "https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skatte-og-avgiftssatser/skattesatser-2026/id3121978/",
      jurisdiction: "NO",
      retrievedAt: "2026-07-25",
    },
    {
      sourceId: "no.skatteetaten.general-income-2026",
      publisher: "Norwegian Tax Administration",
      publisherType: "tax-authority",
      title: "General income tax rate",
      url: "https://www.skatteetaten.no/en/Rates/General-income/",
      jurisdiction: "NO",
      retrievedAt: "2026-07-25",
    },
    {
      sourceId: "no.skatteetaten.bracket-tax-2026",
      publisher: "Norwegian Tax Administration",
      publisherType: "tax-authority",
      title: "Bracket tax rates and thresholds",
      url: "https://www.skatteetaten.no/en/Rates/bracket-tax/",
      jurisdiction: "NO",
      retrievedAt: "2026-07-25",
    },
    {
      sourceId: "no.skatteetaten.national-insurance-2026",
      publisher: "Norwegian Tax Administration",
      publisherType: "tax-authority",
      title: "National Insurance contribution rates and lower limit",
      url: "https://www.skatteetaten.no/en/rates/national-insurance-contributions/",
      jurisdiction: "NO",
      retrievedAt: "2026-07-25",
    },
  ],
});

export const norwayPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `no-${TAX_YEAR}-ordinary-bracket-ni-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["ordinary-income", "personal-income-bracket-tax", "salary-national-insurance"],
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
          "standardOrdinaryIncomeRateConfirmed",
          "salaryNationalInsuranceScheduleConfirmed",
          "ordinaryIncomeTaxBaseMinor",
          "personalIncomeMinor",
          "salaryIncomeForNationalInsuranceMinor",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Norway 2026 composite scope",
            description: "The caller confirms the supplied tax bases fit the supported Norway 2026 ordinary-income, bracket-tax and salary-contribution scope.",
            "x-taxcraft-kind": "confirmed-status",
          },
          standardOrdinaryIncomeRateConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed standard ordinary-income rate",
            description: "The caller confirms the standard 22% ordinary-income rate applies, rather than the priority-zone rate.",
            "x-taxcraft-kind": "confirmed-status",
          },
          salaryNationalInsuranceScheduleConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed salary national-insurance schedule",
            description: "The caller confirms the 7.6% salary schedule for a person aged 17 to 69 applies.",
            "x-taxcraft-kind": "confirmed-status",
          },
          ordinaryIncomeTaxBaseMinor: {
            type: "integer",
            minimum: 0,
            title: "Ordinary-income tax base",
            description: "Caller-confirmed ordinary income in Norwegian øre after deductions and allowances.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "NOK",
          },
          personalIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Personal income for bracket tax",
            description: "Caller-confirmed personal income in Norwegian øre for the five-step bracket-tax calculation.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "NOK",
          },
          salaryIncomeForNationalInsuranceMinor: {
            type: "integer",
            minimum: 0,
            title: "Salary income for national insurance",
            description: "Caller-confirmed salary income in Norwegian øre covered by the 7.6% contribution schedule.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "NOK",
          },
        },
      },
      rounding: [
        { stage: "ordinary-income-tax", mode: "floor", unitMinor: 1 },
        { stage: "bracket-tax-band", mode: "floor", unitMinor: 1 },
        { stage: "national-insurance-contribution", mode: "floor", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: { [TAX_YEAR]: model() },
});

function model() {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const ordinaryIncomeTaxMinor = applyRate(
        facts.ordinaryIncomeTaxBaseMinor,
        ORDINARY_INCOME_RATE_BASIS_POINTS,
      );
      const bracketTaxMinor = calculateBracketTax(facts.personalIncomeMinor);
      const nationalInsuranceContributionMinor = calculateNationalInsurance(
        facts.salaryIncomeForNationalInsuranceMinor,
      );
      const incomeTaxMinor = ordinaryIncomeTaxMinor + bracketTaxMinor;
      const totalLiabilityMinor = incomeTaxMinor + nationalInsuranceContributionMinor;

      return {
        currency: DEFINITION.currency,
        totals: {
          ordinaryIncomeTaxBaseMinor: facts.ordinaryIncomeTaxBaseMinor,
          ordinaryIncomeTaxMinor,
          personalIncomeMinor: facts.personalIncomeMinor,
          bracketTaxMinor,
          salaryIncomeForNationalInsuranceMinor: facts.salaryIncomeForNationalInsuranceMinor,
          nationalInsuranceContributionMinor,
          incomeTaxMinor,
          totalLiabilityMinor,
        },
        lines: [
          {
            ruleId: `no.pit.${TAX_YEAR}.ordinary-income-tax`,
            label: "Tax on ordinary income at the standard rate",
            amountMinor: ordinaryIncomeTaxMinor,
            sourceIds: ["no.finance-ministry.tax-rates-2026", "no.skatteetaten.general-income-2026"],
          },
          {
            ruleId: `no.pit.${TAX_YEAR}.bracket-tax`,
            label: "Five-step bracket tax on personal income",
            amountMinor: bracketTaxMinor,
            sourceIds: ["no.finance-ministry.tax-rates-2026", "no.skatteetaten.bracket-tax-2026"],
          },
          {
            ruleId: `no.pit.${TAX_YEAR}.salary-national-insurance`,
            label: "Salary National Insurance contribution",
            amountMinor: nationalInsuranceContributionMinor,
            sourceIds: ["no.finance-ministry.tax-rates-2026", "no.skatteetaten.national-insurance-2026"],
          },
        ],
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function calculateBracketTax(personalIncomeMinor) {
  return BRACKET_BANDS.reduce((total, band) => {
    const upperBoundMinor = band.upperBoundMinor ?? personalIncomeMinor;
    const taxableMinor = Math.max(
      0,
      Math.min(personalIncomeMinor, upperBoundMinor) - band.lowerBoundMinor,
    );
    return total + applyRate(taxableMinor, band.rateBasisPoints);
  }, 0);
}

function calculateNationalInsurance(salaryIncomeMinor) {
  if (salaryIncomeMinor <= NATIONAL_INSURANCE_LOWER_LIMIT_MINOR) return 0;
  const standardContributionMinor = applyRate(
    salaryIncomeMinor,
    NATIONAL_INSURANCE_RATE_BASIS_POINTS,
  );
  const cappedContributionMinor = applyRate(
    salaryIncomeMinor - NATIONAL_INSURANCE_LOWER_LIMIT_MINOR,
    NATIONAL_INSURANCE_CAP_RATE_BASIS_POINTS,
  );
  return Math.min(standardContributionMinor, cappedContributionMinor);
}

function applyRate(amountMinor, basisPoints) {
  return Math.floor(amountMinor * basisPoints / 10_000);
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}
