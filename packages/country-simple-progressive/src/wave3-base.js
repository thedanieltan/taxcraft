import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);

export const SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS = Object.freeze([
  {
    code: "BB",
    name: "Barbados individual income tax",
    currency: "BBD",
    taxYearBasis: "calendar-year",
    kind: "annual-taxable-income",
    scopeTitle: "Confirmed Barbados taxable income",
    scopeDescription: "The caller confirms annual taxable income after the applicable personal allowance and deductions.",
    taxableIncomeTitle: "Taxable income after allowances",
    models: {
      "2024": { bands: [[5_000_000, 1250], [null, 2850]] },
      "2025": { bands: [[5_000_000, 1250], [null, 2850]] },
      "2026": { bands: [[5_000_000, 1150], [null, 2750]] },
    },
    supported: [
      "individual income tax on caller-confirmed taxable income",
      "12.5% and 28.5% bands for 2024 and 2025",
      "11.5% and 27.5% bands for 2026",
    ],
    unsupported: [
      "personal-allowance and taxable-income derivation",
      "compensatory, reverse and other tax credits",
      "PAYE reconciliation, National Insurance and other deductions",
      "residence, source and filing-obligation decisions",
    ],
    assumptions: [
      "The caller supplied taxable income after the applicable personal allowance and deductions.",
      "Credits, withholding and social contributions are excluded from the result.",
    ],
    sources: [
      {
        sourceId: "bb.bra.personal-income-tax-rates-2020-2025",
        publisher: "Barbados Revenue Authority",
        publisherType: "tax-authority",
        title: "Personal Income Tax policy note",
        url: "https://bra.gov.bb/News/Policy-Notes/Personal-Income-Tax-PIT",
        jurisdiction: "BB",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "bb.bra.personal-income-tax-rates-2026",
        publisher: "Barbados Revenue Authority",
        publisherType: "tax-authority",
        title: "Reduction of Personal Income Tax Rates — Income Year 2026",
        url: "https://bra.gov.bb/News/Policy-Notes/Reduction-of-Personal-Income-Tax-R",
        jurisdiction: "BB",
        retrievedAt: "2026-07-18",
      },
    ],
  },
  {
    code: "TT",
    name: "Trinidad and Tobago individual income tax",
    currency: "TTD",
    taxYearBasis: "calendar-year",
    kind: "annual-taxable-income",
    scopeTitle: "Confirmed Trinidad and Tobago chargeable income",
    scopeDescription: "The caller confirms annual chargeable income after allowable deductions and allowances.",
    taxableIncomeTitle: "Chargeable income",
    models: {
      "2024": { bands: [[100_000_000, 2500], [null, 3000]] },
      "2025": { bands: [[100_000_000, 2500], [null, 3000]] },
      "2026": { bands: [[100_000_000, 2500], [null, 3000]] },
    },
    supported: [
      "individual income tax on caller-confirmed chargeable income",
      "25% on the first TTD 1,000,000 and 30% on the excess",
      "calendar years 2024 through 2026",
    ],
    unsupported: [
      "chargeable-income, allowance and deduction derivation",
      "tax credits and PAYE reconciliation",
      "Business Levy, Health Surcharge and National Insurance",
      "residence, source and filing-obligation decisions",
    ],
    assumptions: [
      "The caller supplied chargeable income after all applicable deductions and allowances.",
      "The result excludes credits, Business Levy, Health Surcharge and National Insurance.",
    ],
    sources: [
      {
        sourceId: "tt.ird.individual-income-tax-rates",
        publisher: "Inland Revenue Division",
        publisherType: "tax-authority",
        title: "Self Employed/Sole Trader — Income Tax",
        url: "https://www.ird.gov.tt/self-employed-sole-trader",
        jurisdiction: "TT",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "tt.ird.paye-income-tax-computation",
        publisher: "Inland Revenue Division",
        publisherType: "tax-authority",
        title: "Responsibilities of Corporations — How to Compute PAYE",
        url: "https://www.ird.gov.tt/corporations",
        jurisdiction: "TT",
        retrievedAt: "2026-07-18",
      },
    ],
  },
  {
    code: "SC",
    name: "Seychelles monthly employment income tax",
    currency: "SCR",
    taxYearBasis: "calendar-year",
    kind: "monthly-employment",
    models: {
      "2024": {},
      "2025": {},
      "2026": {},
    },
    supported: [
      "monthly employment income tax on gross cash emoluments",
      "separate citizen and non-citizen schedules",
      "calendar years 2024 through 2026",
    ],
    unsupported: [
      "annual aggregation across employers or fluctuating monthly income",
      "non-monetary benefits tax and special-project 3% income",
      "arrears attribution, exemptions and employer payroll reconciliation",
      "citizenship, residence and employment-status decisions",
    ],
    assumptions: [
      "The caller supplied gross monthly cash emoluments from one employment source.",
      "Citizen or non-citizen treatment is caller-confirmed.",
      "The result excludes non-monetary benefits tax and special-project income.",
    ],
    sources: [
      {
        sourceId: "sc.src.employment-income-tax-rates",
        publisher: "Seychelles Revenue Commission",
        publisherType: "tax-authority",
        title: "Income and Non-Monetary Benefits Tax — Income Tax Rates",
        url: "https://src.gov.sc/income-and-non-monetary-benefits-tax/",
        jurisdiction: "SC",
        retrievedAt: "2026-07-18",
      },
      {
        sourceId: "sc.src.payroll-regulations-2024",
        publisher: "Seychelles Revenue Commission",
        publisherType: "tax-authority",
        title: "Income and Non-Monetary Benefits Tax Payroll Regulations 2024",
        url: "https://src.gov.sc/src-highlights-changes-made-to-income-and-non-monetary-benefits-tax-payroll-regulations-2024/",
        jurisdiction: "SC",
        retrievedAt: "2026-07-18",
      },
    ],
  },
]);

export const simpleProgressiveWave3Packages = Object.freeze(
  SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS.map(createPackage),
);

function createPackage(definition) {
  return definition.kind === "monthly-employment"
    ? createSeychellesPackage(definition)
    : createAnnualPackage(definition);
}

function taxYears(code) {
  return TAX_YEARS.map((year) => ({
    taxYear: String(year),
    modelVersion: `${code.toLowerCase()}-${year}-v1`,
    status: year === 2026 ? "current" : "historical-supported",
    order: year,
  }));
}

function manifest(definition, factsSchema, incomeSchedule) {
  return {
    jurisdiction: definition.code,
    name: definition.name,
    storesUserPII: false,
    advisory: false,
    taxYears: taxYears(definition.code),
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: definition.taxYearBasis,
      currencyCodes: [definition.currency],
      incomeSchedules: [incomeSchedule],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema,
      rounding: [{ stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  };
}

function createAnnualPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "taxableIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: definition.scopeTitle,
        description: definition.scopeDescription,
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      taxableIncomeMinor: {
        type: "integer",
        title: definition.taxableIncomeTitle,
        description: `Caller-confirmed annual tax base in ${definition.currency}.`,
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": definition.currency,
      },
    },
  };

  return definePitCountryPackage({
    manifest: manifest(definition, factsSchema, "annual-taxable-income"),
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [
      String(year),
      progressiveModel(definition, year, "taxableIncomeMinor"),
    ])),
  });
}

function createSeychellesPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "citizenshipStatus", "monthlyGrossEmolumentsMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Seychelles employment-income scope",
        description: "The caller confirms the amount is monthly cash emoluments from one employment source.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      citizenshipStatus: {
        type: "string",
        title: "Citizen or non-citizen schedule",
        description: "Caller-confirmed schedule for the employee.",
        enum: ["citizen", "non-citizen"],
        "x-taxcraft-kind": "plain",
      },
      monthlyGrossEmolumentsMinor: {
        type: "integer",
        title: "Monthly gross cash emoluments",
        description: "Monthly gross cash emoluments from one employment source in SCR.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "SCR",
      },
    },
  };

  return definePitCountryPackage({
    manifest: manifest(definition, factsSchema, "monthly-employment"),
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), seychellesModel(definition, year)])),
  });
}

function progressiveModel(definition, year, amountField) {
  const bands = definition.models[String(year)].bands.map(([upperBoundMinor, rateBasisPoints]) => ({
    upperBoundMinor,
    rateBasisPoints,
  }));
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      return progressiveResult(definition, year, facts[amountField], bands, amountField);
    },
  };
}

function seychellesModel(definition, year) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const bands = facts.citizenshipStatus === "citizen"
        ? [
          { upperBoundMinor: 855_550, rateBasisPoints: 0 },
          { upperBoundMinor: 1_000_000, rateBasisPoints: 1500 },
          { upperBoundMinor: 8_333_300, rateBasisPoints: 2000 },
          { upperBoundMinor: null, rateBasisPoints: 3000 },
        ]
        : [
          { upperBoundMinor: 1_000_000, rateBasisPoints: 1500 },
          { upperBoundMinor: 8_333_300, rateBasisPoints: 2000 },
          { upperBoundMinor: null, rateBasisPoints: 3000 },
        ];
      const result = progressiveResult(
        definition,
        year,
        facts.monthlyGrossEmolumentsMinor,
        bands,
        "monthlyGrossEmolumentsMinor",
      );
      return {
        ...result,
        totals: {
          citizenshipStatus: facts.citizenshipStatus,
          monthlyGrossEmolumentsMinor: facts.monthlyGrossEmolumentsMinor,
          incomeTaxMinor: result.totals.incomeTaxMinor,
        },
      };
    },
  };
}

function progressiveResult(definition, year, taxBaseMinor, bands, totalKey) {
  const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
  const result = calculateProgressiveBands({
    taxableMinor: taxBaseMinor,
    bands,
    rounding: ROUNDING_MODE.HALF_UP,
  });
  const lines = result.bands.map((band) => ({
    ruleId: `${definition.code.toLowerCase()}.pit.${year}.band-${band.index + 1}`,
    label: `${formatRate(band.rateBasisPoints)} progressive band`,
    amountMinor: band.taxMinor,
    sourceIds,
  }));
  if (lines.length === 0) {
    lines.push({
      ruleId: `${definition.code.toLowerCase()}.pit.${year}.zero-income`,
      label: "Income tax on zero tax base",
      amountMinor: 0,
      sourceIds,
    });
  }
  return {
    currency: definition.currency,
    totals: {
      [totalKey]: taxBaseMinor,
      incomeTaxMinor: result.taxMinor,
    },
    lines,
    assumptions: [...definition.assumptions],
    coverage: coverage(definition),
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
