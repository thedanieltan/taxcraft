import {
  ROUNDING_MODE,
  applyBasisPoints,
  applyTaxCredit,
  calculateProgressiveBands,
  definePitCountryPackage,
  sumTaxLayers,
} from "@taxcraft/country-sdk";

const MODELS = Object.freeze({
  "2024": {
    singleStandardBandMinor: 4_200_000,
    marriedBaseBandMinor: 5_100_000,
    marriedSecondIncomeIncreaseMaxMinor: 3_300_000,
    singlePersonalCreditMinor: 187_500,
    marriedPersonalCreditMinor: 375_000,
    employeeCreditMaxMinor: 187_500,
    uscBands: [
      [1_201_200, 50],
      [2_576_000, 200],
      [7_004_400, 400],
      [null, 800],
    ],
  },
  "2025": {
    singleStandardBandMinor: 4_400_000,
    marriedBaseBandMinor: 5_300_000,
    marriedSecondIncomeIncreaseMaxMinor: 3_500_000,
    singlePersonalCreditMinor: 200_000,
    marriedPersonalCreditMinor: 400_000,
    employeeCreditMaxMinor: 200_000,
    uscBands: [
      [1_201_200, 50],
      [2_738_200, 200],
      [7_004_400, 300],
      [null, 800],
    ],
  },
  "2026": {
    singleStandardBandMinor: 4_400_000,
    marriedBaseBandMinor: 5_300_000,
    marriedSecondIncomeIncreaseMaxMinor: 3_500_000,
    singlePersonalCreditMinor: 200_000,
    marriedPersonalCreditMinor: 400_000,
    employeeCreditMaxMinor: 200_000,
    uscBands: [
      [1_201_200, 50],
      [2_870_000, 200],
      [7_004_400, 300],
      [null, 800],
    ],
  },
});

const TAX_YEARS = Object.freeze(Object.keys(MODELS));
const USC_EXEMPTION_LIMIT_MINOR = 1_300_000;
const EMPLOYEE_CREDIT_RATE_BASIS_POINTS = 2_000;

const DEFINITION = Object.freeze({
  code: "IE",
  name: "Ireland household Income Tax and USC",
  currency: "EUR",
  supported: [
    "single PAYE, married or civil-partner one-income, and married or civil-partner two-income filing schedules",
    "20% and 40% Income Tax bands with year-specific standard-rate cut-off points",
    "personal and non-transferable Employee Tax Credits",
    "individual Universal Social Charge calculations using the standard schedule",
    "calendar years 2024 through 2026",
  ],
  unsupported: [
    "taxable-income, deduction, pension-relief and USC-income derivation",
    "earned-income, age, child, home-carer, rent and other credits or reliefs",
    "reduced USC rates, USC surcharge and exempt-income classification",
    "Pay Related Social Insurance contributions",
    "separate assessment, allocation elections, marginal relief and legal filing-status determinations",
    "withholding reconciliation, prior payments, refunds and preliminary tax",
  ],
  assumptions: [
    "The caller supplied each person's taxable income, qualifying PAYE income and USC income.",
    "The selected household schedule and lower-earner band income are legally applicable.",
    "Only the personal and Employee Tax Credits are applied, and only standard USC rates are calculated.",
  ],
  sources: [
    {
      sourceId: "ie.revenue.rates-bands-reliefs-2024-2026",
      publisher: "Revenue Commissioners",
      publisherType: "tax-authority",
      title: "Tax rates, bands and reliefs",
      url: "https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/tax-relief-charts/index.aspx",
      jurisdiction: "IE",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "ie.revenue.standard-rate-band",
      publisher: "Revenue Commissioners",
      publisherType: "tax-authority",
      title: "How your Income Tax is calculated",
      url: "https://www.revenue.ie/en/jobs-and-pensions/calculating-your-income-tax/how-income-tax-is-calculated.aspx",
      jurisdiction: "IE",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "ie.revenue.employee-tax-credit",
      publisher: "Revenue Commissioners",
      publisherType: "tax-authority",
      title: "Employee Tax Credit",
      url: "https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/income-and-employment/employee-tax-credit/index.aspx",
      jurisdiction: "IE",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "ie.revenue.usc-standard-rates",
      publisher: "Revenue Commissioners",
      publisherType: "tax-authority",
      title: "Standard rates and thresholds of USC",
      url: "https://www.revenue.ie/en/jobs-and-pensions/usc/standard-rates-thresholds.aspx",
      jurisdiction: "IE",
      retrievedAt: "2026-07-18",
    },
    {
      sourceId: "ie.revenue.usc-exemption",
      publisher: "Revenue Commissioners",
      publisherType: "tax-authority",
      title: "Income exempt from USC",
      url: "https://www.revenue.ie/en/jobs-and-pensions/usc/income-exempt-usc.aspx",
      jurisdiction: "IE",
      retrievedAt: "2026-07-18",
    },
  ],
});

export const irelandPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: TAX_YEARS.map((taxYear) => ({
      taxYear,
      modelVersion: `ie-${taxYear}-v1`,
      status: taxYear === "2026" ? "current" : "historical-supported",
      order: Number(taxYear),
    })),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["income-tax", "universal-social-charge"],
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
          "filingSchedule",
          "primaryTaxableIncomeMinor",
          "secondaryTaxableIncomeMinor",
          "lowerEarnerBandIncomeMinor",
          "primaryPayeIncomeMinor",
          "secondaryPayeIncomeMinor",
          "primaryUscIncomeMinor",
          "secondaryUscIncomeMinor"
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Ireland PAYE Income Tax and standard USC scope",
            description: "The caller confirms the selected filing schedule and supplied Income Tax, PAYE-credit and USC income bases apply.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          filingSchedule: {
            type: "string",
            title: "Household filing schedule",
            description: "Select the legally applicable single PAYE, married one-income or married two-income schedule.",
            enum: ["single-paye", "married-one-paye", "married-two-paye"],
            "x-taxcraft-kind": "plain",
          },
          primaryTaxableIncomeMinor: moneyFact("Primary taxable income", "Taxable income of the primary individual after applicable deductions."),
          secondaryTaxableIncomeMinor: moneyFact("Secondary taxable income", "Taxable income of the second individual; enter zero for single and one-income schedules."),
          lowerEarnerBandIncomeMinor: moneyFact("Lower-earner band income", "Caller-confirmed lower-earner income used to determine the married two-income standard-rate-band increase; enter zero for other schedules."),
          primaryPayeIncomeMinor: moneyFact("Primary qualifying PAYE income", "Primary qualifying PAYE income used to cap the non-transferable Employee Tax Credit."),
          secondaryPayeIncomeMinor: moneyFact("Secondary qualifying PAYE income", "Secondary qualifying PAYE income used to cap the second Employee Tax Credit; enter zero for single and one-income schedules."),
          primaryUscIncomeMinor: moneyFact("Primary USC income", "Primary individual's annual income subject to the standard USC schedule."),
          secondaryUscIncomeMinor: moneyFact("Secondary USC income", "Second individual's annual income subject to the standard USC schedule; enter zero for single and one-income schedules."),
        },
      },
      rounding: [
        { stage: "income-tax-bands", mode: "half-up", unitMinor: 1 },
        { stage: "employee-tax-credits", mode: "half-up", unitMinor: 1 },
        { stage: "universal-social-charge", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: Object.fromEntries(TAX_YEARS.map((taxYear) => [taxYear, model(taxYear)])),
});

export const householdFilingPackages = Object.freeze([irelandPackage]);
export const householdFilingPackagesByJurisdiction = Object.freeze({ IE: irelandPackage });

function model(taxYear) {
  const parameters = MODELS[taxYear];
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      const secondaryValues = [
        facts.secondaryTaxableIncomeMinor,
        facts.lowerEarnerBandIncomeMinor,
        facts.secondaryPayeIncomeMinor,
        facts.secondaryUscIncomeMinor,
      ];
      if (facts.primaryPayeIncomeMinor === 0) {
        return inconsistent("$.primaryPayeIncomeMinor", "The selected PAYE filing schedules require qualifying primary PAYE income.");
      }
      if (facts.filingSchedule !== "married-two-paye" && secondaryValues.some((value) => value !== 0)) {
        return inconsistent("$.filingSchedule", "Secondary and lower-earner amounts must be zero for single and one-income schedules.");
      }
      if (facts.filingSchedule === "married-two-paye") {
        if (facts.secondaryPayeIncomeMinor === 0 || facts.lowerEarnerBandIncomeMinor === 0) {
          return inconsistent("$.filingSchedule", "The married two-income schedule requires secondary PAYE income and lower-earner band income.");
        }
        const higherPayeIncomeMinor = Math.max(facts.primaryPayeIncomeMinor, facts.secondaryPayeIncomeMinor);
        if (facts.lowerEarnerBandIncomeMinor > higherPayeIncomeMinor) {
          return inconsistent("$.lowerEarnerBandIncomeMinor", "Lower-earner band income cannot exceed the higher qualifying PAYE income entered.");
        }
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const household = householdParameters(parameters, facts);
      const combinedTaxableIncomeMinor = facts.primaryTaxableIncomeMinor + facts.secondaryTaxableIncomeMinor;
      if (!Number.isSafeInteger(combinedTaxableIncomeMinor)) throw new Error("Combined taxable income exceeds safe integer output.");

      const incomeTax = calculateProgressiveBands({
        taxableMinor: combinedTaxableIncomeMinor,
        bands: [
          { upperBoundMinor: household.standardRateBandMinor, rateBasisPoints: 2_000 },
          { upperBoundMinor: null, rateBasisPoints: 4_000 },
        ],
        rounding: ROUNDING_MODE.HALF_UP,
      });

      const primaryEmployeeCreditMinor = employeeCredit(facts.primaryPayeIncomeMinor, parameters.employeeCreditMaxMinor);
      const secondaryEmployeeCreditMinor = facts.filingSchedule === "married-two-paye"
        ? employeeCredit(facts.secondaryPayeIncomeMinor, parameters.employeeCreditMaxMinor)
        : 0;
      const afterPersonal = applyTaxCredit({
        taxMinor: incomeTax.taxMinor,
        creditMinor: household.personalCreditMinor,
        refundable: false,
      });
      const afterPrimaryEmployee = applyTaxCredit({
        taxMinor: afterPersonal.taxAfterCreditMinor,
        creditMinor: primaryEmployeeCreditMinor,
        refundable: false,
      });
      const afterSecondaryEmployee = applyTaxCredit({
        taxMinor: afterPrimaryEmployee.taxAfterCreditMinor,
        creditMinor: secondaryEmployeeCreditMinor,
        refundable: false,
      });

      const primaryUsc = calculateUsc(facts.primaryUscIncomeMinor, parameters.uscBands);
      const secondaryUsc = calculateUsc(facts.secondaryUscIncomeMinor, parameters.uscBands);
      const usc = sumTaxLayers([
        { id: "primary-usc", amountMinor: primaryUsc.taxMinor },
        { id: "secondary-usc", amountMinor: secondaryUsc.taxMinor },
      ]);
      const combined = sumTaxLayers([
        { id: "income-tax", amountMinor: afterSecondaryEmployee.taxAfterCreditMinor },
        { id: "usc", amountMinor: usc.totalMinor },
      ]);

      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = incomeTax.bands.map((band) => ({
        ruleId: `ie.pit.${taxYear}.income-tax.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} household Income Tax band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      appendCreditLine(lines, `ie.pit.${taxYear}.personal-credit`, "Personal Tax Credit applied", afterPersonal.appliedCreditMinor, sourceIds);
      appendCreditLine(lines, `ie.pit.${taxYear}.primary-employee-credit`, "Primary Employee Tax Credit applied", afterPrimaryEmployee.appliedCreditMinor, sourceIds);
      appendCreditLine(lines, `ie.pit.${taxYear}.secondary-employee-credit`, "Secondary Employee Tax Credit applied", afterSecondaryEmployee.appliedCreditMinor, sourceIds);
      appendUscLines(lines, taxYear, "primary", primaryUsc, sourceIds);
      appendUscLines(lines, taxYear, "secondary", secondaryUsc, sourceIds);
      if (lines.length === 0) {
        lines.push({
          ruleId: `ie.pit.${taxYear}.zero-liability`,
          label: "Zero Income Tax and USC liability",
          amountMinor: 0,
          sourceIds,
        });
      }

      return {
        currency: DEFINITION.currency,
        totals: {
          combinedTaxableIncomeMinor,
          standardRateBandMinor: household.standardRateBandMinor,
          grossIncomeTaxMinor: incomeTax.taxMinor,
          availablePersonalCreditMinor: household.personalCreditMinor,
          personalCreditAppliedMinor: afterPersonal.appliedCreditMinor,
          availablePrimaryEmployeeCreditMinor: primaryEmployeeCreditMinor,
          primaryEmployeeCreditAppliedMinor: afterPrimaryEmployee.appliedCreditMinor,
          availableSecondaryEmployeeCreditMinor: secondaryEmployeeCreditMinor,
          secondaryEmployeeCreditAppliedMinor: afterSecondaryEmployee.appliedCreditMinor,
          incomeTaxMinor: afterSecondaryEmployee.taxAfterCreditMinor,
          primaryUscIncomeMinor: facts.primaryUscIncomeMinor,
          primaryUscMinor: primaryUsc.taxMinor,
          secondaryUscIncomeMinor: facts.secondaryUscIncomeMinor,
          secondaryUscMinor: secondaryUsc.taxMinor,
          uscMinor: usc.totalMinor,
          incomeTaxAndUscMinor: combined.totalMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function moneyFact(title, description) {
  return {
    type: "integer",
    title,
    description,
    minimum: 0,
    "x-taxcraft-kind": "money-minor",
    "x-taxcraft-currency": "EUR",
  };
}

function householdParameters(parameters, facts) {
  if (facts.filingSchedule === "single-paye") {
    return {
      standardRateBandMinor: parameters.singleStandardBandMinor,
      personalCreditMinor: parameters.singlePersonalCreditMinor,
    };
  }
  const increaseMinor = facts.filingSchedule === "married-two-paye"
    ? Math.min(parameters.marriedSecondIncomeIncreaseMaxMinor, facts.lowerEarnerBandIncomeMinor)
    : 0;
  return {
    standardRateBandMinor: parameters.marriedBaseBandMinor + increaseMinor,
    personalCreditMinor: parameters.marriedPersonalCreditMinor,
  };
}

function employeeCredit(payeIncomeMinor, maximumMinor) {
  return Math.min(
    maximumMinor,
    applyBasisPoints(payeIncomeMinor, EMPLOYEE_CREDIT_RATE_BASIS_POINTS, ROUNDING_MODE.HALF_UP),
  );
}

function calculateUsc(incomeMinor, bands) {
  if (incomeMinor <= USC_EXEMPTION_LIMIT_MINOR) {
    return { taxableMinor: incomeMinor, taxMinor: 0, bands: [], exempt: true };
  }
  return {
    ...calculateProgressiveBands({
      taxableMinor: incomeMinor,
      bands: bands.map(([upperBoundMinor, rateBasisPoints]) => ({ upperBoundMinor, rateBasisPoints })),
      rounding: ROUNDING_MODE.HALF_UP,
    }),
    exempt: false,
  };
}

function appendCreditLine(lines, ruleId, label, amountMinor, sourceIds) {
  if (amountMinor > 0) lines.push({ ruleId, label, amountMinor: -amountMinor, sourceIds });
}

function appendUscLines(lines, taxYear, person, result, sourceIds) {
  if (result.exempt) {
    lines.push({
      ruleId: `ie.pit.${taxYear}.${person}-usc-exemption`,
      label: `${capitalize(person)} USC exemption applies`,
      amountMinor: 0,
      sourceIds,
    });
    return;
  }
  result.bands.forEach((band) => lines.push({
    ruleId: `ie.pit.${taxYear}.${person}-usc.band-${band.index + 1}`,
    label: `${capitalize(person)} USC at ${formatRate(band.rateBasisPoints)}`,
    amountMinor: band.taxMinor,
    sourceIds,
  }));
}

function inconsistent(path, message) {
  return { ok: false, issues: [{ code: "facts.inconsistent", path, message }] };
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

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
