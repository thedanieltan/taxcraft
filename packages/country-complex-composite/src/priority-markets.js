import {
  ROUNDING_MODE,
  applyBasisPoints,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const INDIA_TAX_YEAR = "2026-27";
const CALENDAR_TAX_YEAR = "2026";

const INDIA_NEW_BANDS = Object.freeze([
  { upperBoundMinor: 40_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 80_000_000, rateBasisPoints: 500 },
  { upperBoundMinor: 120_000_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: 160_000_000, rateBasisPoints: 1_500 },
  { upperBoundMinor: 200_000_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: 240_000_000, rateBasisPoints: 2_500 },
  { upperBoundMinor: null, rateBasisPoints: 3_000 },
]);
const INDIA_OLD_UNDER_60_BANDS = Object.freeze([
  { upperBoundMinor: 25_000_000, rateBasisPoints: 0 },
  { upperBoundMinor: 50_000_000, rateBasisPoints: 500 },
  { upperBoundMinor: 100_000_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: null, rateBasisPoints: 3_000 },
]);

const CANADA_FEDERAL_BANDS = Object.freeze([
  { upperBoundMinor: 5_852_300, rateBasisPoints: 1_400 },
  { upperBoundMinor: 11_704_500, rateBasisPoints: 2_050 },
  { upperBoundMinor: 18_144_000, rateBasisPoints: 2_600 },
  { upperBoundMinor: 25_848_200, rateBasisPoints: 2_900 },
  { upperBoundMinor: null, rateBasisPoints: 3_300 },
]);
const CANADA_ONTARIO_BANDS = Object.freeze([
  { upperBoundMinor: 5_389_100, rateBasisPoints: 505 },
  { upperBoundMinor: 10_778_500, rateBasisPoints: 915 },
  { upperBoundMinor: 15_000_000, rateBasisPoints: 1_116 },
  { upperBoundMinor: 22_000_000, rateBasisPoints: 1_216 },
  { upperBoundMinor: null, rateBasisPoints: 1_316 },
]);

const JAPAN_BANDS = Object.freeze([
  { upperBoundMinor: 1_950_000, rateBasisPoints: 500 },
  { upperBoundMinor: 3_300_000, rateBasisPoints: 1_000 },
  { upperBoundMinor: 6_950_000, rateBasisPoints: 2_000 },
  { upperBoundMinor: 9_000_000, rateBasisPoints: 2_300 },
  { upperBoundMinor: 18_000_000, rateBasisPoints: 3_300 },
  { upperBoundMinor: 40_000_000, rateBasisPoints: 4_000 },
  { upperBoundMinor: null, rateBasisPoints: 4_500 },
]);

const SPAIN_STATE_BANDS = Object.freeze([
  { upperBoundMinor: 1_245_000, rateBasisPoints: 950 },
  { upperBoundMinor: 2_020_000, rateBasisPoints: 1_200 },
  { upperBoundMinor: 3_520_000, rateBasisPoints: 1_500 },
  { upperBoundMinor: 6_000_000, rateBasisPoints: 1_850 },
  { upperBoundMinor: 30_000_000, rateBasisPoints: 2_250 },
  { upperBoundMinor: null, rateBasisPoints: 2_450 },
]);

const ITALY_NATIONAL_BANDS = Object.freeze([
  { upperBoundMinor: 2_800_000, rateBasisPoints: 2_300 },
  { upperBoundMinor: 5_000_000, rateBasisPoints: 3_300 },
  { upperBoundMinor: null, rateBasisPoints: 4_300 },
]);

const INDIA_SOURCES = Object.freeze([
  {
    sourceId: "in.income-tax.ay-2026-27-individual-rates",
    publisher: "Income Tax Department of India",
    publisherType: "tax-authority",
    title: "Salaried individuals — tax slabs, rebates and cess for AY 2026-27",
    url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1?mobile-app=1",
    jurisdiction: "IN",
    retrievedAt: "2026-07-25",
  },
  {
    sourceId: "in.income-tax.itr2-ay-2026-27-new-regime",
    publisher: "Income Tax Department of India",
    publisherType: "tax-authority",
    title: "ITR-2 AY 2026-27 new-regime rates and section 87A rebate",
    url: "https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/file-itr-2-online",
    jurisdiction: "IN",
    retrievedAt: "2026-07-25",
  },
]);

const CANADA_SOURCES = Object.freeze([
  {
    sourceId: "ca.cra.tax-rates-2026",
    publisher: "Canada Revenue Agency",
    publisherType: "tax-authority",
    title: "Current year federal and provincial income tax rates and brackets — 2026",
    url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html",
    jurisdiction: "CA",
    retrievedAt: "2026-07-25",
  },
  {
    sourceId: "ca.cra.ontario-payroll-tables-2026",
    publisher: "Canada Revenue Agency",
    publisherType: "tax-authority",
    title: "Payroll deductions tables — Ontario — 2026",
    url: "https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032-payroll-deductions-tables/t4032on-jan/t4032on-january-general-information.html",
    jurisdiction: "CA",
    retrievedAt: "2026-07-25",
  },
]);

const JAPAN_SOURCES = Object.freeze([
  {
    sourceId: "jp.nta.income-tax-rates-2026",
    publisher: "National Tax Agency Japan",
    publisherType: "tax-authority",
    title: "Income tax rates — 2026",
    url: "https://www.nta.go.jp/taxes/kids/jissen/page07.htm",
    jurisdiction: "JP",
    retrievedAt: "2026-07-25",
  },
  {
    sourceId: "jp.nta.salary-tax-guide-2026",
    publisher: "National Tax Agency Japan",
    publisherType: "tax-authority",
    title: "Tax for salary earners — 2026 income tax and reconstruction surtax",
    url: "https://www.nta.go.jp/publication/pamph/koho/kurashi/html/02_1.htm",
    jurisdiction: "JP",
    retrievedAt: "2026-07-25",
  },
]);

const SPAIN_SOURCES = Object.freeze([
  {
    sourceId: "es.aeat.state-general-scale-2025-current",
    publisher: "Spanish Tax Agency",
    publisherType: "tax-authority",
    title: "State tax on the general taxable base",
    url: "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-general/gravamen-estatal.html",
    jurisdiction: "ES",
    retrievedAt: "2026-07-25",
  },
]);

const ITALY_SOURCES = Object.freeze([
  {
    sourceId: "it.inps.irpef-reduction-2026",
    publisher: "Italian National Social Security Institute",
    publisherType: "government-agency",
    title: "2026 IRPEF reduction for the second income bracket",
    url: "https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.riduzione-irpef-e-incremento-delle-maggiorazioni-sociali.html",
    jurisdiction: "IT",
    retrievedAt: "2026-07-25",
  },
  {
    sourceId: "it.inps.local-irpef-additions-2026",
    publisher: "Italian National Social Security Institute",
    publisherType: "government-agency",
    title: "Regional and municipal IRPEF additions — 2026",
    url: "https://www.inps.it/it/it/dettaglio-approfondimento.schede-informative.53546.pensioni-addizionali-irpef-regionali-e-comunali.html",
    jurisdiction: "IT",
    retrievedAt: "2026-07-25",
  },
]);

export const indiaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: "IN",
    name: "India AY 2026-27 old and new individual tax regimes",
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: INDIA_TAX_YEAR, modelVersion: "in-2026-27-regime-comparison-v1", status: "current", order: 202627 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "assessment-year",
      currencyCodes: ["INR"],
      incomeSchedules: ["new-regime", "old-regime-under-60"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxRegime", "residentRebateSchedule", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: confirmed("Confirmed India ordinary-rate scope"),
          taxRegime: enumFact("Tax regime", ["new", "old-under-60"]),
          residentRebateSchedule: enumFact("Section 87A rebate schedule", ["resident", "not-applicable"]),
          taxableIncomeMinor: moneyFact("Taxable income", "Caller-confirmed taxable income in Indian paise excluding special-rate income.", "INR"),
        },
      },
      rounding: [
        { stage: "slab-tax", mode: "floor", unitMinor: 1 },
        { stage: "health-education-cess", mode: "floor", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: INDIA_SOURCES,
  models: { [INDIA_TAX_YEAR]: indiaModel() },
});

export const canadaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: "CA",
    name: "Canada 2026 federal and Ontario income-tax brackets",
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: CALENDAR_TAX_YEAR, modelVersion: "ca-2026-federal-ontario-v1", status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: ["CAD"],
      incomeSchedules: ["federal", "ontario"],
      taxLayers: { national: true, subnational: true, local: false, subdivisionRequired: true },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "province", "federalTaxableIncomeMinor", "provincialTaxableIncomeMinor"],
        properties: {
          scopeConfirmed: confirmed("Confirmed Canada federal and Ontario scope"),
          province: enumFact("Province", ["ON"]),
          federalTaxableIncomeMinor: moneyFact("Federal taxable income", "Caller-confirmed federal taxable income in Canadian cents.", "CAD"),
          provincialTaxableIncomeMinor: moneyFact("Ontario taxable income", "Caller-confirmed Ontario taxable income in Canadian cents.", "CAD"),
        },
      },
      rounding: [
        { stage: "federal-bracket-tax", mode: "floor", unitMinor: 1 },
        { stage: "ontario-bracket-tax", mode: "floor", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: CANADA_SOURCES,
  models: { [CALENDAR_TAX_YEAR]: canadaModel() },
});

export const japanPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: "JP",
    name: "Japan 2026 national income tax and reconstruction surtax",
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: CALENDAR_TAX_YEAR, modelVersion: "jp-2026-national-reconstruction-v1", status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: ["JPY"],
      incomeSchedules: ["national-ordinary-income", "reconstruction-surtax"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: confirmed("Confirmed Japan ordinary national-income scope"),
          taxableIncomeMinor: moneyFact("Taxable income", "Caller-confirmed taxable income in Japanese yen before statutory rounding down to JPY 1,000.", "JPY"),
        },
      },
      rounding: [
        { stage: "taxable-income", mode: "floor", unitMinor: 1_000 },
        { stage: "reconstruction-surtax", mode: "floor", unitMinor: 1 },
        { stage: "combined-tax", mode: "floor", unitMinor: 100 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: JAPAN_SOURCES,
  models: { [CALENDAR_TAX_YEAR]: japanModel() },
});

export const spainPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: "ES",
    name: "Spain 2026 state general-base income tax",
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: CALENDAR_TAX_YEAR, modelVersion: "es-2026-state-general-scale-v1", status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: ["EUR"],
      incomeSchedules: ["state-general-base"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "generalTaxableBaseMinor", "personalFamilyMinimumMinor"],
        properties: {
          scopeConfirmed: confirmed("Confirmed Spain state general-base scope"),
          generalTaxableBaseMinor: moneyFact("General taxable base", "Caller-confirmed general taxable base in euro cents.", "EUR"),
          personalFamilyMinimumMinor: moneyFact("Personal and family minimum portion", "Caller-confirmed portion of the general taxable base corresponding to the personal and family minimum.", "EUR"),
        },
      },
      rounding: [{ stage: "state-general-tax", mode: "floor", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: SPAIN_SOURCES,
  models: { [CALENDAR_TAX_YEAR]: spainModel() },
});

export const italyPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: "IT",
    name: "Italy 2026 national IRPEF and caller-confirmed local additions",
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: CALENDAR_TAX_YEAR, modelVersion: "it-2026-national-local-additions-v1", status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: ["EUR"],
      incomeSchedules: ["national-irpef", "regional-addition", "municipal-addition"],
      taxLayers: { national: true, subnational: true, local: true, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "scopeConfirmed",
          "nationalTaxableIncomeMinor",
          "regionalTaxableIncomeMinor",
          "municipalTaxableIncomeMinor",
          "regionalRateBasisPoints",
          "municipalRateBasisPoints",
        ],
        properties: {
          scopeConfirmed: confirmed("Confirmed Italy IRPEF scope"),
          nationalTaxableIncomeMinor: moneyFact("National IRPEF taxable income", "Caller-confirmed national IRPEF taxable income in euro cents.", "EUR"),
          regionalTaxableIncomeMinor: moneyFact("Regional-addition taxable income", "Caller-confirmed regional-addition taxable income in euro cents.", "EUR"),
          municipalTaxableIncomeMinor: moneyFact("Municipal-addition taxable income", "Caller-confirmed municipal-addition taxable income in euro cents.", "EUR"),
          regionalRateBasisPoints: rateFact("Regional addition rate", 1_000),
          municipalRateBasisPoints: rateFact("Municipal addition rate", 1_000),
        },
      },
      rounding: [
        { stage: "national-irpef", mode: "floor", unitMinor: 1 },
        { stage: "regional-addition", mode: "floor", unitMinor: 1 },
        { stage: "municipal-addition", mode: "floor", unitMinor: 1 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: ITALY_SOURCES,
  models: { [CALENDAR_TAX_YEAR]: italyModel() },
});

export const priorityMarketPackages = Object.freeze([
  indiaPackage,
  canadaPackage,
  japanPackage,
  spainPackage,
  italyPackage,
]);

function indiaModel() {
  return {
    coverage: {
      supported: [
        "AY 2026-27 new-regime ordinary slab rates",
        "AY 2026-27 old-regime ordinary slab rates for an individual below age 60",
        "resident section 87A rebates for the supported regimes",
        "4% health and education cess after rebate",
      ],
      unsupported: [
        "taxable-income, deduction, exemption and standard-deduction derivation",
        "old-regime senior and super-senior schedules",
        "special-rate income, surcharge, surcharge marginal relief and section 87A marginal relief",
        "capital gains, lottery income, agricultural-income integration and alternative minimum tax",
        "final statutory rupee rounding, withholding, advance tax, prior payments and return reconciliation",
        "residence, source, treaty, regime-eligibility and filing-obligation determinations",
      ],
    },
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const isNew = facts.taxRegime === "new";
      const result = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands: isNew ? INDIA_NEW_BANDS : INDIA_OLD_UNDER_60_BANDS,
        rounding: ROUNDING_MODE.FLOOR,
      });
      const resident = facts.residentRebateSchedule === "resident";
      const rebateThresholdMinor = isNew ? 120_000_000 : 50_000_000;
      const rebateCapMinor = isNew ? 6_000_000 : 1_250_000;
      const rebateMinor = resident && facts.taxableIncomeMinor <= rebateThresholdMinor
        ? Math.min(result.taxMinor, rebateCapMinor)
        : 0;
      const taxAfterRebateMinor = result.taxMinor - rebateMinor;
      const cessMinor = applyBasisPoints(taxAfterRebateMinor, 400, ROUNDING_MODE.FLOOR);
      const incomeTaxMinor = taxAfterRebateMinor + cessMinor;
      const sourceIds = INDIA_SOURCES.map(({ sourceId }) => sourceId);
      const lines = bandLines("in", INDIA_TAX_YEAR, facts.taxRegime, result, sourceIds);
      if (lines.length === 0) lines.push(zeroLine("in", INDIA_TAX_YEAR, "ordinary-income", sourceIds));
      if (rebateMinor > 0) lines.push({
        ruleId: `in.pit.${INDIA_TAX_YEAR}.section-87a-rebate`,
        label: "Resident section 87A rebate",
        amountMinor: -rebateMinor,
        sourceIds,
      });
      lines.push({
        ruleId: `in.pit.${INDIA_TAX_YEAR}.health-education-cess`,
        label: "4% health and education cess",
        amountMinor: cessMinor,
        sourceIds,
      });
      return {
        currency: "INR",
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          slabTaxMinor: result.taxMinor,
          rebateMinor,
          taxAfterRebateMinor,
          cessMinor,
          incomeTaxMinor,
        },
        lines,
        assumptions: [
          "The caller supplied taxable income excluding income governed by special tax rates.",
          `The ${isNew ? "new" : "old under-60"} ordinary-rate schedule applies.`,
          resident ? "The caller confirmed eligibility for the resident section 87A rebate schedule." : "No section 87A rebate was applied.",
        ],
        coverage: this.coverage,
      };
    },
  };
}

function canadaModel() {
  const coverage = {
    supported: [
      "calendar-year 2026 federal marginal income-tax brackets",
      "calendar-year 2026 Ontario marginal income-tax brackets",
      "separate caller-confirmed federal and Ontario taxable-income bases",
    ],
    unsupported: [
      "federal and provincial credits, basic personal amounts and tax reductions",
      "Ontario surtax and Ontario health premium",
      "CPP, CPP2, EI, payroll withholding and employer calculations",
      "provinces and territories other than Ontario, including Quebec",
      "taxable-income derivation, capital-gains inclusion, alternative minimum tax and benefit calculations",
      "residence, province-of-residence, source, treaty and filing-obligation determinations",
    ],
  };
  return {
    coverage,
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const federal = calculateProgressiveBands({ taxableMinor: facts.federalTaxableIncomeMinor, bands: CANADA_FEDERAL_BANDS, rounding: ROUNDING_MODE.FLOOR });
      const ontario = calculateProgressiveBands({ taxableMinor: facts.provincialTaxableIncomeMinor, bands: CANADA_ONTARIO_BANDS, rounding: ROUNDING_MODE.FLOOR });
      const sourceIds = CANADA_SOURCES.map(({ sourceId }) => sourceId);
      const lines = [
        ...bandLines("ca", CALENDAR_TAX_YEAR, "federal", federal, sourceIds),
        ...bandLines("ca", CALENDAR_TAX_YEAR, "ontario", ontario, sourceIds),
      ];
      if (lines.length === 0) lines.push(zeroLine("ca", CALENDAR_TAX_YEAR, "federal-ontario", sourceIds));
      return {
        currency: "CAD",
        totals: {
          federalTaxableIncomeMinor: facts.federalTaxableIncomeMinor,
          provincialTaxableIncomeMinor: facts.provincialTaxableIncomeMinor,
          federalBracketTaxMinor: federal.taxMinor,
          ontarioBracketTaxMinor: ontario.taxMinor,
          totalIncludedTaxMinor: federal.taxMinor + ontario.taxMinor,
        },
        lines,
        assumptions: [
          "The taxpayer is within the Ontario provincial schedule.",
          "The result is bracket tax before credits, Ontario surtax, Ontario health premium and payroll contributions.",
        ],
        coverage,
      };
    },
  };
}

function japanModel() {
  const coverage = {
    supported: [
      "calendar-year 2026 ordinary national income-tax rates from 5% through 45%",
      "statutory rounding of taxable income down to JPY 1,000",
      "2.1% special income tax for reconstruction",
      "final combined-tax rounding down to JPY 100",
    ],
    unsupported: [
      "gross-income, employment-income deduction, basic deduction and taxable-income derivation",
      "tax credits, separate taxation, average taxation and the high-income minimum-tax addition",
      "local inhabitant tax, social insurance and payroll withholding",
      "capital gains, dividends, retirement income and non-resident schedules",
      "residence, source, treaty and filing-obligation determinations",
    ],
  };
  return {
    coverage,
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const roundedTaxableIncomeMinor = Math.floor(facts.taxableIncomeMinor / 1_000) * 1_000;
      const national = calculateProgressiveBands({ taxableMinor: roundedTaxableIncomeMinor, bands: JAPAN_BANDS, rounding: ROUNDING_MODE.FLOOR });
      const reconstructionTaxMinor = applyBasisPoints(national.taxMinor, 210, ROUNDING_MODE.FLOOR);
      const beforeFinalRoundingMinor = national.taxMinor + reconstructionTaxMinor;
      const incomeTaxMinor = Math.floor(beforeFinalRoundingMinor / 100) * 100;
      const finalRoundingAdjustmentMinor = incomeTaxMinor - beforeFinalRoundingMinor;
      const sourceIds = JAPAN_SOURCES.map(({ sourceId }) => sourceId);
      const lines = bandLines("jp", CALENDAR_TAX_YEAR, "national", national, sourceIds);
      if (lines.length === 0) lines.push(zeroLine("jp", CALENDAR_TAX_YEAR, "national", sourceIds));
      lines.push({
        ruleId: "jp.pit.2026.reconstruction-surtax",
        label: "2.1% special income tax for reconstruction",
        amountMinor: reconstructionTaxMinor,
        sourceIds,
      });
      lines.push({
        ruleId: "jp.pit.2026.final-hundred-yen-rounding",
        label: "Final combined tax rounded down to JPY 100",
        amountMinor: finalRoundingAdjustmentMinor,
        sourceIds,
      });
      return {
        currency: "JPY",
        totals: {
          submittedTaxableIncomeMinor: facts.taxableIncomeMinor,
          roundedTaxableIncomeMinor,
          nationalIncomeTaxMinor: national.taxMinor,
          reconstructionTaxMinor,
          beforeFinalRoundingMinor,
          finalRoundingAdjustmentMinor,
          incomeTaxMinor,
        },
        lines,
        assumptions: [
          "The caller supplied ordinary taxable income after all deductions.",
          "The ordinary national schedule and reconstruction surtax apply; local inhabitant tax is excluded.",
        ],
        coverage,
      };
    },
  };
}

function spainModel() {
  const coverage = {
    supported: [
      "calendar-year 2026 state scale for the general taxable base",
      "state-scale reduction for the caller-confirmed personal and family minimum portion",
      "separate state-scale calculations for the base and minimum",
    ],
    unsupported: [
      "autonomous-community general scale and regional personal-minimum rules",
      "savings-income tax, deductions, credits, allowances and taxable-base derivation",
      "joint filing, annuity treatment, disability rules and special territories",
      "withholding, prior payments, refunds and assessment reconciliation",
      "residence, autonomous-community residence, source, treaty and filing-obligation determinations",
    ],
  };
  return {
    coverage,
    validateFacts({ facts }) {
      if (facts.personalFamilyMinimumMinor > facts.generalTaxableBaseMinor) {
        return {
          ok: false,
          issues: [{
            code: "facts.inconsistent",
            path: "$.personalFamilyMinimumMinor",
            message: "The personal and family minimum portion cannot exceed the general taxable base.",
          }],
        };
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const baseTax = calculateProgressiveBands({ taxableMinor: facts.generalTaxableBaseMinor, bands: SPAIN_STATE_BANDS, rounding: ROUNDING_MODE.FLOOR });
      const minimumTax = calculateProgressiveBands({ taxableMinor: facts.personalFamilyMinimumMinor, bands: SPAIN_STATE_BANDS, rounding: ROUNDING_MODE.FLOOR });
      const stateIncomeTaxMinor = baseTax.taxMinor - minimumTax.taxMinor;
      const sourceIds = SPAIN_SOURCES.map(({ sourceId }) => sourceId);
      const lines = [
        ...bandLines("es", CALENDAR_TAX_YEAR, "state-base", baseTax, sourceIds),
        ...minimumTax.bands.map((band) => ({
          ruleId: `es.pit.${CALENDAR_TAX_YEAR}.state-minimum.band-${band.index + 1}`,
          label: `${formatRate(band.rateBasisPoints)} state-scale tax attributable to the personal and family minimum`,
          amountMinor: -band.taxMinor,
          sourceIds,
        })),
      ];
      if (lines.length === 0) lines.push(zeroLine("es", CALENDAR_TAX_YEAR, "state-general", sourceIds));
      return {
        currency: "EUR",
        totals: {
          generalTaxableBaseMinor: facts.generalTaxableBaseMinor,
          personalFamilyMinimumMinor: facts.personalFamilyMinimumMinor,
          stateTaxOnBaseMinor: baseTax.taxMinor,
          stateTaxOnMinimumMinor: minimumTax.taxMinor,
          stateIncomeTaxMinor,
        },
        lines,
        assumptions: [
          "The caller supplied the final general taxable base and the portion corresponding to the personal and family minimum.",
          "Only the state component is calculated; the autonomous-community component is excluded.",
        ],
        coverage,
      };
    },
  };
}

function italyModel() {
  const coverage = {
    supported: [
      "calendar-year 2026 national IRPEF rates of 23%, 33% and 43%",
      "caller-confirmed regional addition taxable base and rate",
      "caller-confirmed municipal addition taxable base and rate",
      "separate national, regional and municipal result lines",
    ],
    unsupported: [
      "gross-income, taxable-income, deduction and credit derivation",
      "employment, pension and family tax credits and no-tax-area calculations",
      "regional and municipal identification, rate lookup, exemptions and progressive local schedules",
      "capital gains, substitute taxes, social contributions and payroll withholding",
      "residence, source, treaty and filing-obligation determinations",
    ],
  };
  return {
    coverage,
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const national = calculateProgressiveBands({ taxableMinor: facts.nationalTaxableIncomeMinor, bands: ITALY_NATIONAL_BANDS, rounding: ROUNDING_MODE.FLOOR });
      const regionalAdditionMinor = applyBasisPoints(facts.regionalTaxableIncomeMinor, facts.regionalRateBasisPoints, ROUNDING_MODE.FLOOR);
      const municipalAdditionMinor = applyBasisPoints(facts.municipalTaxableIncomeMinor, facts.municipalRateBasisPoints, ROUNDING_MODE.FLOOR);
      const totalIncludedTaxMinor = national.taxMinor + regionalAdditionMinor + municipalAdditionMinor;
      const sourceIds = ITALY_SOURCES.map(({ sourceId }) => sourceId);
      const lines = bandLines("it", CALENDAR_TAX_YEAR, "national", national, sourceIds);
      if (lines.length === 0) lines.push(zeroLine("it", CALENDAR_TAX_YEAR, "national", sourceIds));
      lines.push({
        ruleId: "it.pit.2026.regional-addition",
        label: `${formatRate(facts.regionalRateBasisPoints)} caller-confirmed regional IRPEF addition`,
        amountMinor: regionalAdditionMinor,
        sourceIds,
      });
      lines.push({
        ruleId: "it.pit.2026.municipal-addition",
        label: `${formatRate(facts.municipalRateBasisPoints)} caller-confirmed municipal IRPEF addition`,
        amountMinor: municipalAdditionMinor,
        sourceIds,
      });
      return {
        currency: "EUR",
        totals: {
          nationalTaxableIncomeMinor: facts.nationalTaxableIncomeMinor,
          nationalIncomeTaxMinor: national.taxMinor,
          regionalAdditionMinor,
          municipalAdditionMinor,
          totalIncludedTaxMinor,
        },
        lines,
        assumptions: [
          "The caller supplied final national, regional and municipal taxable bases.",
          "The caller supplied legally applicable local addition rates; no location or exemption was inferred.",
        ],
        coverage,
      };
    },
  };
}

function confirmed(title) {
  return {
    type: "boolean",
    title,
    const: true,
    "x-taxcraft-kind": "confirmed-status",
  };
}

function enumFact(title, values) {
  return {
    type: "string",
    title,
    enum: values,
    "x-taxcraft-kind": "enum",
  };
}

function moneyFact(title, description, currency) {
  return {
    type: "integer",
    title,
    description,
    minimum: 0,
    "x-taxcraft-kind": "money-minor",
    "x-taxcraft-currency": currency,
  };
}

function rateFact(title, maximum) {
  return {
    type: "integer",
    title,
    description: "Caller-confirmed rate in basis points, where 100 represents 1%.",
    minimum: 0,
    maximum,
    "x-taxcraft-kind": "percentage-basis-points",
  };
}

function bandLines(jurisdiction, taxYear, schedule, result, sourceIds) {
  return result.bands.map((band) => ({
    ruleId: `${jurisdiction}.pit.${taxYear}.${schedule}.band-${band.index + 1}`,
    label: `${formatRate(band.rateBasisPoints)} ${schedule} band`,
    amountMinor: band.taxMinor,
    sourceIds,
  }));
}

function zeroLine(jurisdiction, taxYear, schedule, sourceIds) {
  return {
    ruleId: `${jurisdiction}.pit.${taxYear}.${schedule}.zero-income`,
    label: `Zero ${schedule} tax`,
    amountMinor: 0,
    sourceIds,
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
