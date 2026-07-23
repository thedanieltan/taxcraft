import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const WHOLE_EURO_MINOR = 100;
const RATE_DENOMINATOR = 1_000_000;
const AGE_SCHEDULES = Object.freeze([
  "below-aow-all-year",
  "full-year-aow-born-1946-or-later",
  "full-year-aow-born-before-1946",
]);

const PARAMETERS = Object.freeze({
  secondBandUpperEuro: 78_426,
  generalCreditTaperStartEuro: 29_736,
  generalCreditEndEuro: 78_426,
  employmentCreditBand1Euro: 11_965,
  employmentCreditBand2Euro: 25_845,
  employmentCreditBand3Euro: 45_592,
  employmentCreditEndEuro: 132_920,
});

const DEFINITION = Object.freeze({
  code: "NL",
  name: "Netherlands resident Box 1 income tax and standard credits",
  currency: "EUR",
  supported: [
    "calendar-year 2026 resident Box 1 tax on caller-confirmed taxable income from work and home",
    "three published Box 1 bands for people below AOW age for the full year",
    "full-year AOW schedules for people born before 1 January 1946 and people born on or after that date",
    "2026 general tax credit from caller-confirmed aggregate income",
    "2026 employment tax credit from caller-confirmed employment income",
    "published whole-euro Box 1 band calculation and whole-euro public credit-table calculation",
  ],
  unsupported: [
    "the year in which the caller reaches AOW age, including month-specific rates and prorated credits",
    "gross-income, deduction, own-home, loss and Box 1 taxable-income derivation",
    "aggregate-income and employment-income derivation",
    "income-dependent combination credit, elderly credits, disability credit and green-investment credit",
    "credit transfers, partner payments, credit component allocation and partial insurance periods",
    "Box 2 and Box 3 tax, tariff adjustment for deductions, special-rate income and protective assessments",
    "withholding, payroll administration, social-insurance eligibility, prior payments and assessment reconciliation",
    "residence, source, AOW status, birth-cohort, credit eligibility, treaty and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied Box 1 taxable income, aggregate income and employment income after legally applicable classifications and deductions.",
    "The caller selected an age schedule that applies for the full 2026 calendar year.",
    "The caller was resident and fully liable for the included Dutch income-tax and national-insurance schedule for the full year.",
    "The published Belastingdienst credit tables are used; the tax authority notes that assessment rounding can differ by one euro for full-year AOW credits.",
    "General and employment credits are treated as non-refundable and are limited to the included Box 1 tax liability.",
  ],
  sources: [
    {
      sourceId: "nl.belastingdienst.box-1-rates-2026",
      publisher: "Belastingdienst",
      publisherType: "tax-authority",
      title: "Box 1 explanation and rates — 2026",
      url: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/boxen_en_tarieven/box_1/box_1",
      jurisdiction: "NL",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "nl.belastingdienst.general-tax-credit-2026",
      publisher: "Belastingdienst",
      publisherType: "tax-authority",
      title: "General tax credit table — 2026",
      url: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/algemene_heffingskorting/tabel-algemene-heffingskorting-2026",
      jurisdiction: "NL",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "nl.belastingdienst.employment-tax-credit-2026",
      publisher: "Belastingdienst",
      publisherType: "tax-authority",
      title: "Employment tax credit table — 2026",
      url: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/arbeidskorting/tabel-arbeidskorting-2026",
      jurisdiction: "NL",
      retrievedAt: "2026-07-24",
    },
    {
      sourceId: "nl.belastingdienst.fisin-tax-calculation-2026",
      publisher: "Belastingdienst",
      publisherType: "tax-authority",
      title: "2026 income-tax calculation guidance",
      url: "https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2026/belastingberekening",
      jurisdiction: "NL",
      retrievedAt: "2026-07-24",
    },
  ],
});

export const netherlandsPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `nl-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["resident-box-1-with-standard-credits"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "scopeConfirmed",
          "ageSchedule",
          "box1TaxableIncomeMinor",
          "aggregateIncomeForGeneralCreditMinor",
          "employmentIncomeForEmploymentCreditMinor",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Netherlands resident Box 1 scope",
            description: "The caller confirms the supplied amounts and full-year age schedule are legally applicable.",
            "x-taxcraft-kind": "confirmed-status",
          },
          ageSchedule: {
            type: "string",
            enum: AGE_SCHEDULES,
            title: "Full-year AOW age schedule",
            description: "Select below-AOW for all of 2026 or the applicable full-year AOW birth cohort.",
            "x-taxcraft-kind": "enum",
          },
          box1TaxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Box 1 taxable income",
            description: "Caller-confirmed 2026 taxable income from work and home in euro cents.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
          aggregateIncomeForGeneralCreditMinor: {
            type: "integer",
            minimum: 0,
            title: "Aggregate income for general tax credit",
            description: "Caller-confirmed aggregate income used to taper the general tax credit, including relevant Box 1, Box 2 and Box 3 income.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
          employmentIncomeForEmploymentCreditMinor: {
            type: "integer",
            minimum: 0,
            title: "Employment income for employment tax credit",
            description: "Caller-confirmed employment income used for the employment tax credit in euro cents.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [
        { stage: "income-inputs", mode: "floor", unitMinor: WHOLE_EURO_MINOR },
        { stage: "box-1-band-tax", mode: "floor", unitMinor: WHOLE_EURO_MINOR },
        { stage: "published-credit-table", mode: "half-up", unitMinor: WHOLE_EURO_MINOR },
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
      const taxableIncomeEuro = Math.floor(facts.box1TaxableIncomeMinor / WHOLE_EURO_MINOR);
      const aggregateIncomeEuro = Math.floor(facts.aggregateIncomeForGeneralCreditMinor / WHOLE_EURO_MINOR);
      const employmentIncomeEuro = Math.floor(facts.employmentIncomeForEmploymentCreditMinor / WHOLE_EURO_MINOR);
      const schedule = scheduleParameters(facts.ageSchedule);
      const bands = calculateBox1Bands(taxableIncomeEuro, schedule);
      const grossBox1TaxMinor = bands.reduce((sum, band) => sum + band.taxMinor, 0);
      const availableGeneralCreditMinor = calculateGeneralCreditEuro(aggregateIncomeEuro, schedule) * WHOLE_EURO_MINOR;
      const availableEmploymentCreditMinor = calculateEmploymentCreditEuro(employmentIncomeEuro, schedule) * WHOLE_EURO_MINOR;
      const generalCreditAppliedMinor = Math.min(grossBox1TaxMinor, availableGeneralCreditMinor);
      const taxAfterGeneralCreditMinor = grossBox1TaxMinor - generalCreditAppliedMinor;
      const employmentCreditAppliedMinor = Math.min(taxAfterGeneralCreditMinor, availableEmploymentCreditMinor);
      const incomeTaxMinor = taxAfterGeneralCreditMinor - employmentCreditAppliedMinor;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = bands.map((band) => ({
        ruleId: `nl.pit.${TAX_YEAR}.${facts.ageSchedule}.box-1-band-${band.index + 1}`,
        label: `${formatRatePpm(band.ratePpm)} Box 1 band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (generalCreditAppliedMinor > 0) {
        lines.push({
          ruleId: `nl.pit.${TAX_YEAR}.${facts.ageSchedule}.general-tax-credit`,
          label: "General tax credit applied",
          amountMinor: -generalCreditAppliedMinor,
          sourceIds,
        });
      }
      if (employmentCreditAppliedMinor > 0) {
        lines.push({
          ruleId: `nl.pit.${TAX_YEAR}.${facts.ageSchedule}.employment-tax-credit`,
          label: "Employment tax credit applied",
          amountMinor: -employmentCreditAppliedMinor,
          sourceIds,
        });
      }
      if (lines.length === 0) {
        lines.push({
          ruleId: `nl.pit.${TAX_YEAR}.${facts.ageSchedule}.zero-income`,
          label: "Box 1 tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          box1TaxableIncomeMinor: facts.box1TaxableIncomeMinor,
          roundedBox1TaxableIncomeMinor: taxableIncomeEuro * WHOLE_EURO_MINOR,
          aggregateIncomeForGeneralCreditMinor: facts.aggregateIncomeForGeneralCreditMinor,
          roundedAggregateIncomeForGeneralCreditMinor: aggregateIncomeEuro * WHOLE_EURO_MINOR,
          employmentIncomeForEmploymentCreditMinor: facts.employmentIncomeForEmploymentCreditMinor,
          roundedEmploymentIncomeForEmploymentCreditMinor: employmentIncomeEuro * WHOLE_EURO_MINOR,
          firstBandUpperMinor: schedule.firstBandUpperEuro * WHOLE_EURO_MINOR,
          grossBox1TaxMinor,
          availableGeneralCreditMinor,
          generalCreditAppliedMinor,
          availableEmploymentCreditMinor,
          employmentCreditAppliedMinor,
          totalCreditsAppliedMinor: generalCreditAppliedMinor + employmentCreditAppliedMinor,
          incomeTaxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function scheduleParameters(ageSchedule) {
  if (ageSchedule === "below-aow-all-year") {
    return {
      firstBandUpperEuro: 38_883,
      firstBandRatePpm: 357_500,
      generalCreditMaximumEuro: 3_115,
      generalCreditTaperRatePpm: 63_980,
      employmentCredit: {
        firstRatePpm: 83_240,
        secondBaseEuro: 996,
        secondRatePpm: 310_090,
        thirdBaseEuro: 5_300,
        thirdRatePpm: 19_500,
        fourthBaseEuro: 5_685,
        fourthRatePpm: 65_100,
      },
    };
  }
  return {
    firstBandUpperEuro: ageSchedule === "full-year-aow-born-before-1946" ? 41_123 : 38_883,
    firstBandRatePpm: 178_500,
    generalCreditMaximumEuro: 1_556,
    generalCreditTaperRatePpm: 31_950,
    employmentCredit: {
      firstRatePpm: 41_560,
      secondBaseEuro: 498,
      secondRatePpm: 154_830,
      thirdBaseEuro: 2_647,
      thirdRatePpm: 9_740,
      fourthBaseEuro: 2_840,
      fourthRatePpm: 32_500,
    },
  };
}

function calculateBox1Bands(taxableIncomeEuro, schedule) {
  const definitions = [
    { upperEuro: schedule.firstBandUpperEuro, ratePpm: schedule.firstBandRatePpm },
    { upperEuro: PARAMETERS.secondBandUpperEuro, ratePpm: 375_600 },
    { upperEuro: null, ratePpm: 495_000 },
  ];
  const bands = [];
  let lowerEuro = 0;
  let remainingEuro = taxableIncomeEuro;
  for (let index = 0; index < definitions.length && remainingEuro > 0; index += 1) {
    const definition = definitions[index];
    const widthEuro = definition.upperEuro === null ? remainingEuro : definition.upperEuro - lowerEuro;
    const taxableBandEuro = Math.min(remainingEuro, widthEuro);
    const taxEuro = floorRateEuro(taxableBandEuro, definition.ratePpm);
    bands.push({ index, taxableBandEuro, ratePpm: definition.ratePpm, taxMinor: taxEuro * WHOLE_EURO_MINOR });
    remainingEuro -= taxableBandEuro;
    if (definition.upperEuro !== null) lowerEuro = definition.upperEuro;
  }
  return bands;
}

function calculateGeneralCreditEuro(aggregateIncomeEuro, schedule) {
  if (aggregateIncomeEuro <= PARAMETERS.generalCreditTaperStartEuro) return schedule.generalCreditMaximumEuro;
  if (aggregateIncomeEuro > PARAMETERS.generalCreditEndEuro) return 0;
  const numerator = schedule.generalCreditMaximumEuro * RATE_DENOMINATOR
    - (aggregateIncomeEuro - PARAMETERS.generalCreditTaperStartEuro) * schedule.generalCreditTaperRatePpm;
  return roundHalfUpNonNegative(numerator);
}

function calculateEmploymentCreditEuro(employmentIncomeEuro, schedule) {
  const credit = schedule.employmentCredit;
  let numerator;
  if (employmentIncomeEuro <= PARAMETERS.employmentCreditBand1Euro) {
    numerator = employmentIncomeEuro * credit.firstRatePpm;
  } else if (employmentIncomeEuro <= PARAMETERS.employmentCreditBand2Euro) {
    numerator = credit.secondBaseEuro * RATE_DENOMINATOR
      + (employmentIncomeEuro - PARAMETERS.employmentCreditBand1Euro) * credit.secondRatePpm;
  } else if (employmentIncomeEuro <= PARAMETERS.employmentCreditBand3Euro) {
    numerator = credit.thirdBaseEuro * RATE_DENOMINATOR
      + (employmentIncomeEuro - PARAMETERS.employmentCreditBand2Euro) * credit.thirdRatePpm;
  } else if (employmentIncomeEuro <= PARAMETERS.employmentCreditEndEuro) {
    numerator = credit.fourthBaseEuro * RATE_DENOMINATOR
      - (employmentIncomeEuro - PARAMETERS.employmentCreditBand3Euro) * credit.fourthRatePpm;
  } else {
    return 0;
  }
  return roundHalfUpNonNegative(numerator);
}

function floorRateEuro(amountEuro, ratePpm) {
  return Math.floor((amountEuro * ratePpm) / RATE_DENOMINATOR);
}

function roundHalfUpNonNegative(numerator) {
  if (numerator <= 0) return 0;
  return Math.floor((numerator + RATE_DENOMINATOR / 2) / RATE_DENOMINATOR);
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}

function formatRatePpm(ratePpm) {
  const percentTimesThousand = Math.floor(ratePpm / 10);
  const whole = Math.floor(percentTimesThousand / 1_000);
  const fraction = String(percentTimesThousand % 1_000).padStart(3, "0").replace(/0+$/, "");
  return fraction.length === 0 ? `${whole}%` : `${whole}.${fraction}%`;
}
