import {
  ROUNDING_MODE,
  applyBasisPoints,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const INDIA_TAX_YEAR = "2026-27";
const TAX_YEAR = "2026";

const INDIA_NEW_BANDS = bands([
  [40_000_000, 0],
  [80_000_000, 500],
  [120_000_000, 1_000],
  [160_000_000, 1_500],
  [200_000_000, 2_000],
  [240_000_000, 2_500],
  [null, 3_000],
]);
const INDIA_OLD_BANDS = bands([
  [25_000_000, 0],
  [50_000_000, 500],
  [100_000_000, 2_000],
  [null, 3_000],
]);
const CANADA_FEDERAL_BANDS = bands([
  [5_852_300, 1_400],
  [11_704_500, 2_050],
  [18_144_000, 2_600],
  [25_848_200, 2_900],
  [null, 3_300],
]);
const CANADA_ONTARIO_BANDS = bands([
  [5_389_100, 505],
  [10_778_500, 915],
  [15_000_000, 1_116],
  [22_000_000, 1_216],
  [null, 1_316],
]);
const JAPAN_BANDS = bands([
  [1_950_000, 500],
  [3_300_000, 1_000],
  [6_950_000, 2_000],
  [9_000_000, 2_300],
  [18_000_000, 3_300],
  [40_000_000, 4_000],
  [null, 4_500],
]);
const SPAIN_STATE_BANDS = bands([
  [1_245_000, 950],
  [2_020_000, 1_200],
  [3_520_000, 1_500],
  [6_000_000, 1_850],
  [30_000_000, 2_250],
  [null, 2_450],
]);
const ITALY_BANDS = bands([
  [2_800_000, 2_300],
  [5_000_000, 3_300],
  [null, 4_300],
]);

const INDIA_SOURCES = sources([
  [
    "in.income-tax.ay-2026-27-individual-rates",
    "Income Tax Department of India",
    "tax-authority",
    "Salaried individuals — tax slabs, rebates and cess for AY 2026-27",
    "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1?mobile-app=1",
    "IN",
  ],
  [
    "in.income-tax.itr2-ay-2026-27-new-regime",
    "Income Tax Department of India",
    "tax-authority",
    "ITR-2 AY 2026-27 new-regime rates and section 87A rebate",
    "https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/file-itr-2-online",
    "IN",
  ],
]);
const CANADA_SOURCES = sources([
  [
    "ca.cra.tax-rates-2026",
    "Canada Revenue Agency",
    "tax-authority",
    "Current year federal and provincial income tax rates and brackets — 2026",
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html",
    "CA",
  ],
  [
    "ca.cra.ontario-payroll-tables-2026",
    "Canada Revenue Agency",
    "tax-authority",
    "Payroll deductions tables — Ontario — 2026",
    "https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032-payroll-deductions-tables/t4032on-jan/t4032on-january-general-information.html",
    "CA",
  ],
]);
const JAPAN_SOURCES = sources([
  [
    "jp.nta.income-tax-rates-2026",
    "National Tax Agency Japan",
    "tax-authority",
    "Income tax rates — 2026",
    "https://www.nta.go.jp/taxes/kids/jissen/page07.htm",
    "JP",
  ],
  [
    "jp.nta.salary-tax-guide-2026",
    "National Tax Agency Japan",
    "tax-authority",
    "Tax for salary earners — 2026 income tax and reconstruction surtax",
    "https://www.nta.go.jp/publication/pamph/koho/kurashi/html/02_1.htm",
    "JP",
  ],
]);
const SPAIN_SOURCES = sources([
  [
    "es.aeat.state-general-scale-2025-current",
    "Spanish Tax Agency",
    "tax-authority",
    "State tax on the general taxable base",
    "https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c15-calculo-impuesto-determinacion-cuotas-integras/gravamen-base-liquidable-general/gravamen-estatal.html",
    "ES",
  ],
]);
const ITALY_SOURCES = sources([
  [
    "it.inps.irpef-reduction-2026",
    "Italian National Social Security Institute",
    "government-agency",
    "2026 IRPEF reduction for the second income bracket",
    "https://www.inps.it/it/it/inps-comunica/notizie/dettaglio-news-page.news.2026.02.riduzione-irpef-e-incremento-delle-maggiorazioni-sociali.html",
    "IT",
  ],
  [
    "it.inps.local-irpef-additions-2026",
    "Italian National Social Security Institute",
    "government-agency",
    "Regional and municipal IRPEF additions — 2026",
    "https://www.inps.it/it/it/dettaglio-approfondimento.schede-informative.53546.pensioni-addizionali-irpef-regionali-e-comunali.html",
    "IT",
  ],
]);

const INDIA_COVERAGE = coverage(
  [
    "AY 2026-27 new-regime ordinary slab rates",
    "AY 2026-27 old-regime ordinary slab rates for an individual below age 60",
    "resident section 87A rebates for the supported regimes",
    "4% health and education cess after rebate",
  ],
  [
    "taxable-income, deduction, exemption and standard-deduction derivation",
    "old-regime senior and super-senior schedules",
    "special-rate income, surcharge, surcharge marginal relief and section 87A marginal relief",
    "capital gains, lottery income, agricultural-income integration and alternative minimum tax",
    "final statutory rupee rounding, withholding, advance tax, prior payments and return reconciliation",
    "residence, source, treaty, regime-eligibility and filing-obligation determinations",
  ],
);
const CANADA_COVERAGE = coverage(
  [
    "calendar-year 2026 federal marginal income-tax brackets",
    "calendar-year 2026 Ontario marginal income-tax brackets",
    "separate caller-confirmed federal and Ontario taxable-income bases",
  ],
  [
    "federal and provincial credits, basic personal amounts and tax reductions",
    "Ontario surtax and Ontario health premium",
    "CPP, CPP2, EI, payroll withholding and employer calculations",
    "provinces and territories other than Ontario, including Quebec",
    "taxable-income derivation, capital-gains inclusion, alternative minimum tax and benefit calculations",
    "residence, province-of-residence, source, treaty and filing-obligation determinations",
  ],
);
const JAPAN_COVERAGE = coverage(
  [
    "calendar-year 2026 ordinary national income-tax rates from 5% through 45%",
    "statutory rounding of taxable income down to JPY 1,000",
    "2.1% special income tax for reconstruction",
    "final combined-tax rounding down to JPY 100",
  ],
  [
    "gross-income, employment-income deduction, basic deduction and taxable-income derivation",
    "tax credits, separate taxation, average taxation and the high-income minimum-tax addition",
    "local inhabitant tax, social insurance and payroll withholding",
    "capital gains, dividends, retirement income and non-resident schedules",
    "residence, source, treaty and filing-obligation determinations",
  ],
);
const SPAIN_COVERAGE = coverage(
  [
    "calendar-year 2026 state scale for the general taxable base",
    "state-scale reduction for the caller-confirmed personal and family minimum portion",
    "separate state-scale calculations for the base and minimum",
  ],
  [
    "autonomous-community general scale and regional personal-minimum rules",
    "savings-income tax, deductions, credits, allowances and taxable-base derivation",
    "joint filing, annuity treatment, disability rules and special territories",
    "withholding, prior payments, refunds and assessment reconciliation",
    "residence, autonomous-community residence, source, treaty and filing-obligation determinations",
  ],
);
const ITALY_COVERAGE = coverage(
  [
    "calendar-year 2026 national IRPEF rates of 23%, 33% and 43%",
    "caller-confirmed regional addition taxable base and rate",
    "caller-confirmed municipal addition taxable base and rate",
    "separate national, regional and municipal result lines",
  ],
  [
    "gross-income, taxable-income, deduction and credit derivation",
    "employment, pension and family tax credits and no-tax-area calculations",
    "regional and municipal identification, rate lookup, exemptions and progressive local schedules",
    "capital gains, substitute taxes, social contributions and payroll withholding",
    "residence, source, treaty and filing-obligation determinations",
  ],
);

export const indiaPackage = definePitCountryPackage({
  manifest: manifest({
    jurisdiction: "IN",
    name: "India AY 2026-27 old and new individual tax regimes",
    taxYear: INDIA_TAX_YEAR,
    order: 202627,
    taxYearBasis: "year-of-assessment",
    currency: "INR",
    incomeSchedules: ["new-regime", "old-regime-under-60"],
    factsSchema: schema(
      ["scopeConfirmed", "taxRegime", "residentRebateSchedule", "taxableIncomeMinor"],
      {
        scopeConfirmed: confirmed("Confirmed India ordinary-rate scope"),
        taxRegime: enumFact("Tax regime", ["new", "old-under-60"]),
        residentRebateSchedule: enumFact("Section 87A rebate schedule", ["resident", "not-applicable"]),
        taxableIncomeMinor: money("Taxable income", "Caller-confirmed taxable income excluding special-rate income.", "INR"),
      },
    ),
    rounding: [rounding("slab-tax", 1), rounding("health-education-cess", 1)],
  }),
  sources: INDIA_SOURCES,
  models: { [INDIA_TAX_YEAR]: indiaModel() },
});

export const canadaPackage = definePitCountryPackage({
  manifest: manifest({
    jurisdiction: "CA",
    name: "Canada 2026 federal and Ontario income-tax brackets",
    taxYear: TAX_YEAR,
    order: 2026,
    taxYearBasis: "calendar-year",
    currency: "CAD",
    incomeSchedules: ["federal", "ontario"],
    taxLayers: { national: true, subnational: true, local: false, subdivisionRequired: true },
    factsSchema: schema(
      ["scopeConfirmed", "province", "federalTaxableIncomeMinor", "provincialTaxableIncomeMinor"],
      {
        scopeConfirmed: confirmed("Confirmed Canada federal and Ontario scope"),
        province: enumFact("Province", ["ON"], "subdivision-code"),
        federalTaxableIncomeMinor: money("Federal taxable income", "Caller-confirmed federal taxable income.", "CAD"),
        provincialTaxableIncomeMinor: money("Ontario taxable income", "Caller-confirmed Ontario taxable income.", "CAD"),
      },
    ),
    rounding: [rounding("federal-bracket-tax", 1), rounding("ontario-bracket-tax", 1)],
  }),
  sources: CANADA_SOURCES,
  models: { [TAX_YEAR]: canadaModel() },
});

export const japanPackage = definePitCountryPackage({
  manifest: manifest({
    jurisdiction: "JP",
    name: "Japan 2026 national income tax and reconstruction surtax",
    taxYear: TAX_YEAR,
    order: 2026,
    taxYearBasis: "calendar-year",
    currency: "JPY",
    incomeSchedules: ["national-ordinary-income", "reconstruction-surtax"],
    factsSchema: schema(
      ["scopeConfirmed", "taxableIncomeMinor"],
      {
        scopeConfirmed: confirmed("Confirmed Japan ordinary national-income scope"),
        taxableIncomeMinor: money("Taxable income", "Caller-confirmed taxable income before statutory JPY 1,000 rounding.", "JPY"),
      },
    ),
    rounding: [
      rounding("taxable-income", 1_000),
      rounding("reconstruction-surtax", 1),
      rounding("combined-tax", 100),
    ],
  }),
  sources: JAPAN_SOURCES,
  models: { [TAX_YEAR]: japanModel() },
});

export const spainPackage = definePitCountryPackage({
  manifest: manifest({
    jurisdiction: "ES",
    name: "Spain 2026 state general-base income tax",
    taxYear: TAX_YEAR,
    order: 2026,
    taxYearBasis: "calendar-year",
    currency: "EUR",
    incomeSchedules: ["state-general-base"],
    factsSchema: schema(
      ["scopeConfirmed", "generalTaxableBaseMinor", "personalFamilyMinimumMinor"],
      {
        scopeConfirmed: confirmed("Confirmed Spain state general-base scope"),
        generalTaxableBaseMinor: money("General taxable base", "Caller-confirmed general taxable base.", "EUR"),
        personalFamilyMinimumMinor: money("Personal and family minimum portion", "Caller-confirmed portion corresponding to the personal and family minimum.", "EUR"),
      },
    ),
    rounding: [rounding("state-general-tax", 1)],
  }),
  sources: SPAIN_SOURCES,
  models: { [TAX_YEAR]: spainModel() },
});

export const italyPackage = definePitCountryPackage({
  manifest: manifest({
    jurisdiction: "IT",
    name: "Italy 2026 national IRPEF and caller-confirmed local additions",
    taxYear: TAX_YEAR,
    order: 2026,
    taxYearBasis: "calendar-year",
    currency: "EUR",
    incomeSchedules: ["national-irpef", "regional-addition", "municipal-addition"],
    taxLayers: { national: true, subnational: true, local: true, subdivisionRequired: false },
    factsSchema: schema(
      [
        "scopeConfirmed",
        "nationalTaxableIncomeMinor",
        "regionalTaxableIncomeMinor",
        "municipalTaxableIncomeMinor",
        "regionalRateBasisPoints",
        "municipalRateBasisPoints",
      ],
      {
        scopeConfirmed: confirmed("Confirmed Italy IRPEF scope"),
        nationalTaxableIncomeMinor: money("National IRPEF taxable income", "Caller-confirmed national taxable income.", "EUR"),
        regionalTaxableIncomeMinor: money("Regional-addition taxable income", "Caller-confirmed regional-addition taxable income.", "EUR"),
        municipalTaxableIncomeMinor: money("Municipal-addition taxable income", "Caller-confirmed municipal-addition taxable income.", "EUR"),
        regionalRateBasisPoints: rate("Regional addition rate"),
        municipalRateBasisPoints: rate("Municipal addition rate"),
      },
    ),
    rounding: [
      rounding("national-irpef", 1),
      rounding("regional-addition", 1),
      rounding("municipal-addition", 1),
    ],
  }),
  sources: ITALY_SOURCES,
  models: { [TAX_YEAR]: italyModel() },
});

export const priorityMarketPackages = Object.freeze([
  indiaPackage,
  canadaPackage,
  japanPackage,
  spainPackage,
  italyPackage,
]);

function indiaModel() {
  return model(INDIA_COVERAGE, (facts) => {
    const isNew = facts.taxRegime === "new";
    const slab = progressive(facts.taxableIncomeMinor, isNew ? INDIA_NEW_BANDS : INDIA_OLD_BANDS);
    const resident = facts.residentRebateSchedule === "resident";
    const rebateThresholdMinor = isNew ? 120_000_000 : 50_000_000;
    const rebateCapMinor = isNew ? 6_000_000 : 1_250_000;
    const rebateMinor = resident && facts.taxableIncomeMinor <= rebateThresholdMinor
      ? Math.min(slab.taxMinor, rebateCapMinor)
      : 0;
    const taxAfterRebateMinor = slab.taxMinor - rebateMinor;
    const cessMinor = applyBasisPoints(taxAfterRebateMinor, 400, ROUNDING_MODE.FLOOR);
    const sourceIds = ids(INDIA_SOURCES);
    const lines = bandLines("in", INDIA_TAX_YEAR, facts.taxRegime, slab, sourceIds);
    ensureZero(lines, "in", INDIA_TAX_YEAR, "ordinary-income", sourceIds);
    if (rebateMinor > 0) lines.push(line("in.pit.2026-27.section-87a-rebate", "Resident section 87A rebate", -rebateMinor, sourceIds));
    lines.push(line("in.pit.2026-27.health-education-cess", "4% health and education cess", cessMinor, sourceIds));
    return result("INR", {
      taxableIncomeMinor: facts.taxableIncomeMinor,
      slabTaxMinor: slab.taxMinor,
      rebateMinor,
      taxAfterRebateMinor,
      cessMinor,
      incomeTaxMinor: taxAfterRebateMinor + cessMinor,
    }, lines, INDIA_COVERAGE, [
      "The caller supplied taxable income excluding income governed by special tax rates.",
      `The ${isNew ? "new" : "old under-60"} ordinary-rate schedule applies.`,
      resident ? "The resident section 87A rebate schedule was selected." : "No section 87A rebate was applied.",
    ]);
  });
}

function canadaModel() {
  return model(CANADA_COVERAGE, (facts) => {
    const federal = progressive(facts.federalTaxableIncomeMinor, CANADA_FEDERAL_BANDS);
    const ontario = progressive(facts.provincialTaxableIncomeMinor, CANADA_ONTARIO_BANDS);
    const sourceIds = ids(CANADA_SOURCES);
    const lines = [
      ...bandLines("ca", TAX_YEAR, "federal", federal, sourceIds),
      ...bandLines("ca", TAX_YEAR, "ontario", ontario, sourceIds),
    ];
    ensureZero(lines, "ca", TAX_YEAR, "federal-ontario", sourceIds);
    return result("CAD", {
      federalTaxableIncomeMinor: facts.federalTaxableIncomeMinor,
      provincialTaxableIncomeMinor: facts.provincialTaxableIncomeMinor,
      federalBracketTaxMinor: federal.taxMinor,
      ontarioBracketTaxMinor: ontario.taxMinor,
      totalIncludedTaxMinor: federal.taxMinor + ontario.taxMinor,
    }, lines, CANADA_COVERAGE, [
      "The Ontario provincial schedule applies.",
      "The result is bracket tax before credits, Ontario surtax, Ontario health premium and payroll contributions.",
    ]);
  });
}

function japanModel() {
  return model(JAPAN_COVERAGE, (facts) => {
    const roundedTaxableIncomeMinor = Math.floor(facts.taxableIncomeMinor / 1_000) * 1_000;
    const national = progressive(roundedTaxableIncomeMinor, JAPAN_BANDS);
    const reconstructionTaxMinor = applyBasisPoints(national.taxMinor, 210, ROUNDING_MODE.FLOOR);
    const beforeFinalRoundingMinor = national.taxMinor + reconstructionTaxMinor;
    const incomeTaxMinor = Math.floor(beforeFinalRoundingMinor / 100) * 100;
    const finalRoundingAdjustmentMinor = incomeTaxMinor - beforeFinalRoundingMinor;
    const sourceIds = ids(JAPAN_SOURCES);
    const lines = bandLines("jp", TAX_YEAR, "national", national, sourceIds);
    ensureZero(lines, "jp", TAX_YEAR, "national", sourceIds);
    lines.push(line("jp.pit.2026.reconstruction-surtax", "2.1% special income tax for reconstruction", reconstructionTaxMinor, sourceIds));
    lines.push(line("jp.pit.2026.final-hundred-yen-rounding", "Final combined tax rounded down to JPY 100", finalRoundingAdjustmentMinor, sourceIds));
    return result("JPY", {
      submittedTaxableIncomeMinor: facts.taxableIncomeMinor,
      roundedTaxableIncomeMinor,
      nationalIncomeTaxMinor: national.taxMinor,
      reconstructionTaxMinor,
      beforeFinalRoundingMinor,
      finalRoundingAdjustmentMinor,
      incomeTaxMinor,
    }, lines, JAPAN_COVERAGE, [
      "The caller supplied ordinary taxable income after all deductions.",
      "Local inhabitant tax is excluded.",
    ]);
  });
}

function spainModel() {
  return {
    coverage: SPAIN_COVERAGE,
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
      const baseTax = progressive(facts.generalTaxableBaseMinor, SPAIN_STATE_BANDS);
      const minimumTax = progressive(facts.personalFamilyMinimumMinor, SPAIN_STATE_BANDS);
      const sourceIds = ids(SPAIN_SOURCES);
      const lines = [
        ...bandLines("es", TAX_YEAR, "state-base", baseTax, sourceIds),
        ...minimumTax.bands.map((band) => line(
          `es.pit.2026.state-minimum.band-${band.index + 1}`,
          `${formatRate(band.rateBasisPoints)} state-scale tax attributable to the personal and family minimum`,
          -band.taxMinor,
          sourceIds,
        )),
      ];
      ensureZero(lines, "es", TAX_YEAR, "state-general", sourceIds);
      return result("EUR", {
        generalTaxableBaseMinor: facts.generalTaxableBaseMinor,
        personalFamilyMinimumMinor: facts.personalFamilyMinimumMinor,
        stateTaxOnBaseMinor: baseTax.taxMinor,
        stateTaxOnMinimumMinor: minimumTax.taxMinor,
        stateIncomeTaxMinor: baseTax.taxMinor - minimumTax.taxMinor,
      }, lines, SPAIN_COVERAGE, [
        "The caller supplied the final general taxable base and personal/family minimum portion.",
        "Only the state component is calculated.",
      ]);
    },
  };
}

function italyModel() {
  return model(ITALY_COVERAGE, (facts) => {
    const national = progressive(facts.nationalTaxableIncomeMinor, ITALY_BANDS);
    const regionalAdditionMinor = applyBasisPoints(facts.regionalTaxableIncomeMinor, facts.regionalRateBasisPoints, ROUNDING_MODE.FLOOR);
    const municipalAdditionMinor = applyBasisPoints(facts.municipalTaxableIncomeMinor, facts.municipalRateBasisPoints, ROUNDING_MODE.FLOOR);
    const sourceIds = ids(ITALY_SOURCES);
    const lines = bandLines("it", TAX_YEAR, "national", national, sourceIds);
    ensureZero(lines, "it", TAX_YEAR, "national", sourceIds);
    lines.push(line("it.pit.2026.regional-addition", `${formatRate(facts.regionalRateBasisPoints)} caller-confirmed regional IRPEF addition`, regionalAdditionMinor, sourceIds));
    lines.push(line("it.pit.2026.municipal-addition", `${formatRate(facts.municipalRateBasisPoints)} caller-confirmed municipal IRPEF addition`, municipalAdditionMinor, sourceIds));
    return result("EUR", {
      nationalTaxableIncomeMinor: facts.nationalTaxableIncomeMinor,
      nationalIncomeTaxMinor: national.taxMinor,
      regionalAdditionMinor,
      municipalAdditionMinor,
      totalIncludedTaxMinor: national.taxMinor + regionalAdditionMinor + municipalAdditionMinor,
    }, lines, ITALY_COVERAGE, [
      "The caller supplied final national, regional and municipal taxable bases.",
      "The caller supplied applicable local addition rates; no location was inferred.",
    ]);
  });
}

function manifest({
  jurisdiction,
  name,
  taxYear,
  order,
  taxYearBasis,
  currency,
  incomeSchedules,
  factsSchema,
  rounding: roundingStages,
  taxLayers = { national: true, subnational: false, local: false, subdivisionRequired: false },
}) {
  return {
    jurisdiction,
    name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear, modelVersion: `${jurisdiction.toLowerCase()}-${taxYear}-priority-market-v1`, status: "current", order }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis,
      currencyCodes: [currency],
      incomeSchedules,
      taxLayers,
      factsSchema,
      rounding: roundingStages,
      maintenance: { mode: "manual", sourceWatch: false },
    },
  };
}

function model(modelCoverage, calculate) {
  return {
    coverage: modelCoverage,
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate,
  };
}

function progressive(taxableMinor, schedule) {
  return calculateProgressiveBands({ taxableMinor, bands: schedule, rounding: ROUNDING_MODE.FLOOR });
}

function result(currency, totals, lines, resultCoverage, assumptions) {
  return { currency, totals, lines, assumptions, coverage: resultCoverage };
}

function bands(entries) {
  return Object.freeze(entries.map(([upperBoundMinor, rateBasisPoints]) => ({ upperBoundMinor, rateBasisPoints })));
}

function sources(entries) {
  return Object.freeze(entries.map(([sourceId, publisher, publisherType, title, url, jurisdiction]) => ({
    sourceId,
    publisher,
    publisherType,
    title,
    url,
    jurisdiction,
    retrievedAt: "2026-07-25",
  })));
}

function coverage(supported, unsupported) {
  return Object.freeze({ supported: Object.freeze(supported), unsupported: Object.freeze(unsupported) });
}

function schema(required, properties) {
  return { type: "object", additionalProperties: false, required, properties };
}

function confirmed(title) {
  return { type: "boolean", title, const: true, "x-taxcraft-kind": "confirmed-status" };
}

function enumFact(title, values, kind = "enum") {
  return { type: "string", title, enum: values, "x-taxcraft-kind": kind };
}

function money(title, description, currency) {
  return {
    type: "integer",
    title,
    description,
    minimum: 0,
    "x-taxcraft-kind": "money-minor",
    "x-taxcraft-currency": currency,
  };
}

function rate(title) {
  return {
    type: "integer",
    title,
    description: "Caller-confirmed rate in basis points, where 100 represents 1%.",
    minimum: 0,
    maximum: 1_000,
    "x-taxcraft-kind": "percentage-basis-points",
  };
}

function rounding(stage, unitMinor) {
  return { stage, mode: "floor", unitMinor };
}

function ids(sourceList) {
  return sourceList.map(({ sourceId }) => sourceId);
}

function bandLines(jurisdiction, taxYear, schedule, progressiveResult, sourceIds) {
  return progressiveResult.bands.map((band) => line(
    `${jurisdiction}.pit.${taxYear}.${schedule}.band-${band.index + 1}`,
    `${formatRate(band.rateBasisPoints)} ${schedule} band`,
    band.taxMinor,
    sourceIds,
  ));
}

function line(ruleId, label, amountMinor, sourceIds) {
  return { ruleId, label, amountMinor, sourceIds };
}

function ensureZero(lines, jurisdiction, taxYear, schedule, sourceIds) {
  if (lines.length === 0) lines.push(line(
    `${jurisdiction}.pit.${taxYear}.${schedule}.zero-income`,
    `Zero ${schedule} tax`,
    0,
    sourceIds,
  ));
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
