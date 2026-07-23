import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const FEDERAL_TARIFFS = Object.freeze([
  "single",
  "married-or-single-parent",
]);
const ZURICH_TARIFFS = Object.freeze([
  "basic",
  "married-or-single-parent",
]);
const FEDERAL_CHILD_REDUCTION_MINOR = 26_300;
const ZURICH_STATE_MULTIPLIER_BASIS_POINTS = 9_500;
const ZURICH_CITY_MULTIPLIER_BASIS_POINTS = 11_900;

const FEDERAL_SCHEDULES = Object.freeze({
  single: Object.freeze([
    { thresholdHundreds: 152, baseTaxMinor: 0, incrementMinor: 77 },
    { thresholdHundreds: 332, baseTaxMinor: 13_860, incrementMinor: 88 },
    { thresholdHundreds: 435, baseTaxMinor: 22_920, incrementMinor: 264 },
    { thresholdHundreds: 580, baseTaxMinor: 61_200, incrementMinor: 297 },
    { thresholdHundreds: 762, baseTaxMinor: 115_250, incrementMinor: 594 },
    { thresholdHundreds: 821, baseTaxMinor: 150_295, incrementMinor: 660 },
    { thresholdHundreds: 1_089, baseTaxMinor: 327_175, incrementMinor: 880 },
    { thresholdHundreds: 1_415, baseTaxMinor: 614_055, incrementMinor: 1_100 },
    { thresholdHundreds: 1_851, baseTaxMinor: 1_093_655, incrementMinor: 1_320 },
    { thresholdHundreds: 7_939, baseTaxMinor: 9_129_815, incrementMinor: 0 },
    { thresholdHundreds: 7_940, baseTaxMinor: 9_131_000, incrementMinor: 1_150 },
  ]),
  "married-or-single-parent": Object.freeze([
    { thresholdHundreds: 297, baseTaxMinor: 0, incrementMinor: 100 },
    { thresholdHundreds: 534, baseTaxMinor: 23_700, incrementMinor: 200 },
    { thresholdHundreds: 613, baseTaxMinor: 39_500, incrementMinor: 300 },
    { thresholdHundreds: 791, baseTaxMinor: 92_900, incrementMinor: 400 },
    { thresholdHundreds: 949, baseTaxMinor: 156_100, incrementMinor: 500 },
    { thresholdHundreds: 1_087, baseTaxMinor: 225_100, incrementMinor: 600 },
    { thresholdHundreds: 1_206, baseTaxMinor: 296_500, incrementMinor: 700 },
    { thresholdHundreds: 1_305, baseTaxMinor: 365_800, incrementMinor: 800 },
    { thresholdHundreds: 1_384, baseTaxMinor: 429_000, incrementMinor: 900 },
    { thresholdHundreds: 1_443, baseTaxMinor: 482_100, incrementMinor: 1_000 },
    { thresholdHundreds: 1_483, baseTaxMinor: 522_100, incrementMinor: 1_100 },
    { thresholdHundreds: 1_504, baseTaxMinor: 545_200, incrementMinor: 1_200 },
    { thresholdHundreds: 1_524, baseTaxMinor: 569_200, incrementMinor: 1_300 },
    { thresholdHundreds: 9_413, baseTaxMinor: 10_824_900, incrementMinor: 0 },
    { thresholdHundreds: 9_414, baseTaxMinor: 10_826_100, incrementMinor: 1_150 },
  ]),
});

const ZURICH_BANDS = Object.freeze({
  basic: Object.freeze([
    { upperBoundMinor: 700_000, rateBasisPoints: 0 },
    { upperBoundMinor: 1_200_000, rateBasisPoints: 200 },
    { upperBoundMinor: 1_680_000, rateBasisPoints: 300 },
    { upperBoundMinor: 2_480_000, rateBasisPoints: 400 },
    { upperBoundMinor: 3_450_000, rateBasisPoints: 500 },
    { upperBoundMinor: 4_570_000, rateBasisPoints: 600 },
    { upperBoundMinor: 5_880_000, rateBasisPoints: 700 },
    { upperBoundMinor: 7_640_000, rateBasisPoints: 800 },
    { upperBoundMinor: 11_040_000, rateBasisPoints: 900 },
    { upperBoundMinor: 14_410_000, rateBasisPoints: 1_000 },
    { upperBoundMinor: 19_740_000, rateBasisPoints: 1_100 },
    { upperBoundMinor: 26_670_000, rateBasisPoints: 1_200 },
    { upperBoundMinor: null, rateBasisPoints: 1_300 },
  ]),
  "married-or-single-parent": Object.freeze([
    { upperBoundMinor: 1_410_000, rateBasisPoints: 0 },
    { upperBoundMinor: 2_050_000, rateBasisPoints: 200 },
    { upperBoundMinor: 2_860_000, rateBasisPoints: 300 },
    { upperBoundMinor: 3_840_000, rateBasisPoints: 400 },
    { upperBoundMinor: 4_960_000, rateBasisPoints: 500 },
    { upperBoundMinor: 6_410_000, rateBasisPoints: 600 },
    { upperBoundMinor: 9_630_000, rateBasisPoints: 700 },
    { upperBoundMinor: 12_870_000, rateBasisPoints: 800 },
    { upperBoundMinor: 17_720_000, rateBasisPoints: 900 },
    { upperBoundMinor: 23_510_000, rateBasisPoints: 1_000 },
    { upperBoundMinor: 29_800_000, rateBasisPoints: 1_100 },
    { upperBoundMinor: 37_060_000, rateBasisPoints: 1_200 },
    { upperBoundMinor: null, rateBasisPoints: 1_300 },
  ]),
});

const DEFINITION = Object.freeze({
  code: "CH",
  name: "Switzerland 2026 federal and Zürich city income tax",
  currency: "CHF",
  supported: [
    "2026 direct federal income tax under the single and married-or-single-parent tariffs",
    "CHF 263 federal tax reduction per caller-confirmed child or supported person",
    "2026 Zürich simple state income tax under the basic and married-or-single-parent tariffs",
    "2026 Zürich canton multiplier of 95% and City of Zürich municipal multiplier of 119%",
    "statutory federal and Zürich income-factor and tax-amount rounding",
  ],
  unsupported: [
    "federal, cantonal or municipal taxable-income derivation, deductions and allowance eligibility",
    "tariff, marriage, single-parent, child, supported-person, residence and filing eligibility",
    "cantons and municipalities other than Canton Zürich and City of Zürich",
    "church tax, Zürich personal tax, wealth tax and real-estate gains tax",
    "withholding tax, source tax, social-insurance contributions and payroll administration",
    "capital-benefit, liquidation-profit and other separate or preferential tax schedules",
    "partial-year, rate-determining income, inter-cantonal and international allocation",
    "credits, treaty positions, prior payments, refunds, penalties, interest and return reconciliation",
  ],
  assumptions: [
    "The caller supplied separate federal and Zürich taxable-income amounts after all applicable deductions and allowances.",
    "The caller selected the legally applicable federal and Zürich tariffs without supplying identity or relationship evidence.",
    "The taxpayer is within the ordinary 2026 assessment scope of Canton Zürich and City of Zürich.",
    "No church, wealth, personal, source or separately assessed tax is included.",
  ],
  sources: [
    {
      sourceId: "ch.estv.circular-215-2026",
      publisher: "Swiss Federal Tax Administration",
      publisherType: "tax-authority",
      title: "Circular No. 215 — direct federal tax tariffs for tax year 2026",
      url: "https://www.estv.admin.ch/dam/de/sd-web/vFK3ntWLQ4s4/2-215-D-2025-d.pdf",
      jurisdiction: "CH",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ch.estv.form-58c-2026",
      publisher: "Swiss Federal Tax Administration",
      publisherType: "tax-authority",
      title: "Form 58c — direct federal tax table for natural persons 2026",
      url: "https://www.estv.admin.ch/dam/fr/sd-web/gnde9CmEsalK/dbst-tairfe-58c-2026-dfi.pdf",
      jurisdiction: "CH",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ch.zh.tax-law-2026",
      publisher: "Canton of Zürich",
      publisherType: "legislation",
      title: "Zürich Tax Act effective 1 January 2026 — sections 2 and 35",
      url: "https://www.notes.zh.ch/appl/zhlex_r.nsf/WebView/27A2B2527CE30B98C1258D2A0028E439/%24File/631.1_8.6.97_131.pdf",
      jurisdiction: "CH",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ch.zh.tax-invoice-rounding",
      publisher: "Cantonal Tax Office Zürich",
      publisherType: "tax-authority",
      title: "Directive on issuing state and municipal tax invoices",
      url: "https://www.zh.ch/de/steuern-finanzen/steuern/treuhaender/steuerbuch/steuerbuch-definition/zstb-173-1.html",
      jurisdiction: "CH",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ch.zh.state-multiplier-2026",
      publisher: "Cantonal Tax Office Zürich",
      publisherType: "tax-authority",
      title: "Current municipal tax multipliers — Zürich state multiplier 2026",
      url: "https://www.zh.ch/de/steuern-finanzen/steuern/steuerstatistiken/aktuelle-gemeinde-steuerfuesse.html",
      jurisdiction: "CH",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ch.zurich-city.multiplier-2026",
      publisher: "City of Zürich Tax Office",
      publisherType: "tax-authority",
      title: "Natural-person tax calculation and tax multipliers 2026",
      url: "https://www.stadt-zuerich.ch/de/lebenslagen/steuern/natuerliche-personen/steuerberechnung.html",
      jurisdiction: "CH",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const switzerlandPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `ch-${TAX_YEAR}-zh-zurich-city-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "filing-status",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: [
        ...FEDERAL_TARIFFS.map((tariff) => `federal-${tariff}`),
        ...ZURICH_TARIFFS.map((tariff) => `zurich-${tariff}`),
      ],
      taxLayers: {
        national: true,
        subnational: true,
        local: true,
        subdivisionRequired: true,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "scopeConfirmed",
          "canton",
          "municipality",
          "federalTariff",
          "zurichTariff",
          "federalTaxableIncomeMinor",
          "zurichTaxableIncomeMinor",
          "federalChildDependentCount",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Swiss 2026 ordinary assessment scope",
            description: "The caller confirms the supplied bases and tariffs apply to the supported 2026 federal and Zürich city calculation.",
            "x-taxcraft-kind": "confirmed-status",
          },
          canton: {
            type: "string",
            const: "ZH",
            title: "Canton",
            description: "This model supports Canton Zürich only.",
            "x-taxcraft-kind": "enum",
          },
          municipality: {
            type: "string",
            const: "zurich-city",
            title: "Municipality",
            description: "This model supports City of Zürich only.",
            "x-taxcraft-kind": "enum",
          },
          federalTariff: {
            type: "string",
            enum: FEDERAL_TARIFFS,
            title: "Federal tariff",
            description: "Caller-confirmed 2026 federal tariff.",
            "x-taxcraft-kind": "enum",
          },
          zurichTariff: {
            type: "string",
            enum: ZURICH_TARIFFS,
            title: "Zürich tariff",
            description: "Caller-confirmed 2026 Zürich income-tax tariff.",
            "x-taxcraft-kind": "enum",
          },
          federalTaxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Federal taxable income",
            description: "Caller-confirmed federal taxable income in Swiss centimes; remainders below CHF 100 are disregarded.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "CHF",
          },
          zurichTaxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Zürich taxable income",
            description: "Caller-confirmed Zürich taxable income in Swiss centimes; remainders below CHF 100 are disregarded.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "CHF",
          },
          federalChildDependentCount: {
            type: "integer",
            minimum: 0,
            title: "Federal child or supported-person count",
            description: "Caller-confirmed count eligible for the CHF 263 federal tax reduction.",
            "x-taxcraft-kind": "count",
          },
        },
      },
      rounding: [
        { stage: "federal-taxable-income", mode: "floor", unitMinor: 10_000 },
        { stage: "federal-annual-tax", mode: "floor", unitMinor: 5 },
        { stage: "zurich-taxable-income", mode: "floor", unitMinor: 10_000 },
        { stage: "zurich-simple-state-tax", mode: "floor", unitMinor: 100 },
        { stage: "zurich-state-and-municipal-tax", mode: "half-up", unitMinor: 5 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: { [TAX_YEAR]: model() },
});

export const regionalMunicipalPackages = Object.freeze([switzerlandPackage]);
export const regionalMunicipalPackagesByJurisdiction = Object.freeze({ CH: switzerlandPackage });

function model() {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const federalTaxableIncomeUsedMinor = floorTo(facts.federalTaxableIncomeMinor, 10_000);
      const federalBeforeReductionMinor = calculateFederalTax(
        federalTaxableIncomeUsedMinor,
        facts.federalTariff,
      );
      const federalReductionAvailableMinor = facts.federalChildDependentCount * FEDERAL_CHILD_REDUCTION_MINOR;
      const federalReductionAppliedMinor = Math.min(
        federalBeforeReductionMinor,
        federalReductionAvailableMinor,
      );
      const federalAfterReductionMinor = floorTo(
        federalBeforeReductionMinor - federalReductionAppliedMinor,
        5,
      );
      const federalIncomeTaxMinor = federalAfterReductionMinor < 2_500
        ? 0
        : federalAfterReductionMinor;

      const zurichTaxableIncomeUsedMinor = floorTo(facts.zurichTaxableIncomeMinor, 10_000);
      const simpleResult = calculateProgressiveBands({
        taxableMinor: zurichTaxableIncomeUsedMinor,
        bands: ZURICH_BANDS[facts.zurichTariff],
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const zurichSimpleStateTaxMinor = floorTo(simpleResult.taxMinor, 100);
      const zurichCantonalIncomeTaxMinor = roundHalfUpTo(
        multiplyBasisPoints(zurichSimpleStateTaxMinor, ZURICH_STATE_MULTIPLIER_BASIS_POINTS),
        5,
      );
      const zurichCityIncomeTaxMinor = roundHalfUpTo(
        multiplyBasisPoints(zurichSimpleStateTaxMinor, ZURICH_CITY_MULTIPLIER_BASIS_POINTS),
        5,
      );
      const totalIncomeTaxMinor = federalIncomeTaxMinor
        + zurichCantonalIncomeTaxMinor
        + zurichCityIncomeTaxMinor;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = [
        {
          ruleId: `ch.pit.${TAX_YEAR}.federal.${facts.federalTariff}.ordinary-tax`,
          label: "Direct federal income tax before child or supported-person reduction",
          amountMinor: federalBeforeReductionMinor,
          sourceIds: ["ch.estv.circular-215-2026", "ch.estv.form-58c-2026"],
        },
      ];
      if (federalReductionAppliedMinor > 0) {
        lines.push({
          ruleId: `ch.pit.${TAX_YEAR}.federal.child-dependent-reduction`,
          label: "Federal child or supported-person tax reduction",
          amountMinor: -federalReductionAppliedMinor,
          sourceIds: ["ch.estv.circular-215-2026", "ch.estv.form-58c-2026"],
        });
      }
      if (federalAfterReductionMinor > 0 && federalIncomeTaxMinor === 0) {
        lines.push({
          ruleId: `ch.pit.${TAX_YEAR}.federal.minimum-collection-threshold`,
          label: "Federal tax below CHF 25 not collected",
          amountMinor: -federalAfterReductionMinor,
          sourceIds: ["ch.estv.circular-215-2026"],
        });
      }
      lines.push(
        {
          ruleId: `ch.pit.${TAX_YEAR}.zh.${facts.zurichTariff}.simple-state-tax`,
          label: "Zürich simple state income tax at 100%",
          amountMinor: zurichSimpleStateTaxMinor,
          sourceIds: ["ch.zh.tax-law-2026", "ch.zh.tax-invoice-rounding"],
        },
        {
          ruleId: `ch.pit.${TAX_YEAR}.zh.canton-95-percent`,
          label: "Canton Zürich income tax at 95%",
          amountMinor: zurichCantonalIncomeTaxMinor,
          sourceIds: ["ch.zh.tax-law-2026", "ch.zh.tax-invoice-rounding", "ch.zh.state-multiplier-2026"],
        },
        {
          ruleId: `ch.pit.${TAX_YEAR}.zh.zurich-city-119-percent`,
          label: "City of Zürich municipal income tax at 119%",
          amountMinor: zurichCityIncomeTaxMinor,
          sourceIds: ["ch.zh.tax-law-2026", "ch.zh.tax-invoice-rounding", "ch.zurich-city.multiplier-2026"],
        },
      );
      return {
        currency: DEFINITION.currency,
        totals: {
          federalTaxableIncomeMinor: facts.federalTaxableIncomeMinor,
          federalTaxableIncomeUsedMinor,
          federalTaxBeforeReductionMinor: federalBeforeReductionMinor,
          federalReductionAvailableMinor,
          federalReductionAppliedMinor,
          federalIncomeTaxMinor,
          zurichTaxableIncomeMinor: facts.zurichTaxableIncomeMinor,
          zurichTaxableIncomeUsedMinor,
          zurichSimpleStateTaxMinor,
          zurichCantonalIncomeTaxMinor,
          zurichCityIncomeTaxMinor,
          totalIncomeTaxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function calculateFederalTax(taxableIncomeMinor, tariff) {
  const incomeHundreds = taxableIncomeMinor / 10_000;
  const schedule = FEDERAL_SCHEDULES[tariff];
  let selected = schedule[0];
  for (const entry of schedule) {
    if (incomeHundreds < entry.thresholdHundreds) break;
    selected = entry;
  }
  if (incomeHundreds < selected.thresholdHundreds) return 0;
  return floorTo(
    selected.baseTaxMinor
      + ((incomeHundreds - selected.thresholdHundreds) * selected.incrementMinor),
    5,
  );
}

function multiplyBasisPoints(amountMinor, basisPoints) {
  return amountMinor * basisPoints / 10_000;
}

function floorTo(value, increment) {
  return Math.floor(value / increment) * increment;
}

function roundHalfUpTo(value, increment) {
  return Math.floor((value + (increment / 2)) / increment) * increment;
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}
