import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";
import { SIMPLE_PROGRESSIVE_JURISDICTIONS } from "./data.js";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);
const PARAGUAY_PAYMENT_THRESHOLD = 80_000_000;
const PARAGUAY_BANDS = Object.freeze([
  { upperBoundMinor: 50_000_000, rateBasisPoints: 800 },
  { upperBoundMinor: 150_000_000, rateBasisPoints: 900 },
  { upperBoundMinor: null, rateBasisPoints: 1000 },
]);

export const simpleProgressivePackages = Object.freeze(
  SIMPLE_PROGRESSIVE_JURISDICTIONS.map(createPackage),
);
export const simpleProgressivePackagesByJurisdiction = Object.freeze(Object.fromEntries(
  simpleProgressivePackages.map((countryPackage) => [countryPackage.manifest.jurisdiction, countryPackage]),
));

export { SIMPLE_PROGRESSIVE_JURISDICTIONS };

function createPackage(definition) {
  return definition.kind === "paraguay-personal-services"
    ? createParaguayPackage(definition)
    : createTaxableIncomePackage(definition);
}

function taxYears(code) {
  return TAX_YEARS.map((year) => ({
    taxYear: String(year),
    modelVersion: `${code.toLowerCase()}-${year}-v1`,
    status: year === 2026 ? "current" : "historical-supported",
    order: year,
  }));
}

function baseManifest(definition, factsSchema) {
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
      incomeSchedules: [definition.kind === "paraguay-personal-services" ? "personal-services" : "annual-taxable-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema,
      rounding: [
        { stage: "progressive-income-tax", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: {
        mode: "manual",
        sourceWatch: false,
      },
    },
  };
}

function createTaxableIncomePackage(definition) {
  const taxableIncomeProperty = {
    type: "integer",
    title: definition.taxableIncomeTitle,
    description: `Caller-confirmed taxable income in ${definition.currency}, represented in the currency's minor-unit convention.`,
    minimum: 0,
    "x-taxcraft-kind": "money-minor",
    "x-taxcraft-currency": definition.currency,
  };
  if (definition.taxableIncomeMultipleOf) {
    taxableIncomeProperty.multipleOf = definition.taxableIncomeMultipleOf;
  }

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
      taxableIncomeMinor: taxableIncomeProperty,
    },
  };

  return definePitCountryPackage({
    manifest: baseManifest(definition, factsSchema),
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [
      String(year),
      taxableIncomeModel(definition, year),
    ])),
  });
}

function taxableIncomeModel(definition, year) {
  const bands = definition.models[String(year)].bands.map(([upperBoundMinor, rateBasisPoints]) => ({
    upperBoundMinor,
    rateBasisPoints,
  }));
  return {
    coverage: {
      supported: [...definition.supported],
      unsupported: [...definition.unsupported],
    },
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      return progressiveOutput({
        definition,
        year,
        taxableIncomeMinor: facts.taxableIncomeMinor,
        bands,
        sourceIds: definition.sources.map(({ sourceId }) => sourceId),
      });
    },
  };
}

function createParaguayPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "grossPersonalServiceIncomeMinor", "netPersonalServiceIncomeMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: "Confirmed Paraguayan-source personal-services income",
        description: "The caller confirms the amounts fall within the IRP personal-services schedule.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      grossPersonalServiceIncomeMinor: {
        type: "integer",
        title: "Gross personal-services income",
        description: "Gross Paraguayan-source personal-services income for the calendar year in PYG.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "PYG",
      },
      netPersonalServiceIncomeMinor: {
        type: "integer",
        title: "Net personal-services income",
        description: "Net income after allowed personal-services deductions for the calendar year in PYG.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "PYG",
      },
    },
  };

  return definePitCountryPackage({
    manifest: baseManifest(definition, factsSchema),
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [String(year), paraguayModel(definition, year)])),
  });
}

function paraguayModel(definition, year) {
  return {
    coverage: {
      supported: [...definition.supported],
      unsupported: [...definition.unsupported],
    },
    validateFacts({ facts }) {
      if (facts.netPersonalServiceIncomeMinor > facts.grossPersonalServiceIncomeMinor) {
        return {
          ok: false,
          issues: [{
            code: "py.net-income.exceeds-gross",
            path: "$.facts.netPersonalServiceIncomeMinor",
            message: "Net personal-services income cannot exceed gross personal-services income.",
          }],
        };
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      if (facts.grossPersonalServiceIncomeMinor <= PARAGUAY_PAYMENT_THRESHOLD) {
        return {
          currency: definition.currency,
          totals: {
            grossPersonalServiceIncomeMinor: facts.grossPersonalServiceIncomeMinor,
            netPersonalServiceIncomeMinor: facts.netPersonalServiceIncomeMinor,
            incomeTaxMinor: 0,
          },
          lines: [{
            ruleId: `py.pit.${year}.gross-payment-threshold`,
            label: "IRP payment below the gross-income threshold",
            amountMinor: 0,
            sourceIds: definition.sources.map(({ sourceId }) => sourceId),
          }],
          assumptions: [...definition.assumptions],
          coverage: {
            supported: [...definition.supported],
            unsupported: [...definition.unsupported],
          },
        };
      }

      const progressive = progressiveOutput({
        definition,
        year,
        taxableIncomeMinor: facts.netPersonalServiceIncomeMinor,
        bands: PARAGUAY_BANDS,
        sourceIds: definition.sources.map(({ sourceId }) => sourceId),
      });
      return {
        ...progressive,
        totals: {
          grossPersonalServiceIncomeMinor: facts.grossPersonalServiceIncomeMinor,
          netPersonalServiceIncomeMinor: facts.netPersonalServiceIncomeMinor,
          taxBaseMinor: progressive.totals.taxBaseMinor,
          incomeTaxMinor: progressive.totals.incomeTaxMinor,
        },
      };
    },
  };
}

function progressiveOutput({ definition, year, taxableIncomeMinor, bands, sourceIds }) {
  const result = calculateProgressiveBands({
    taxableMinor: taxableIncomeMinor,
    bands,
    rounding: ROUNDING_MODE.HALF_UP,
  });
  const lines = result.bands.map((band) => ({
    ruleId: `${definition.code.toLowerCase()}.pit.${year}.band-${band.index + 1}`,
    label: `${formatRate(band.rateBasisPoints)} band on ${formatBandRange(band)}`,
    amountMinor: band.taxMinor,
    sourceIds,
  }));
  if (lines.length === 0) {
    lines.push({
      ruleId: `${definition.code.toLowerCase()}.pit.${year}.zero-income`,
      label: "Income tax on zero taxable income",
      amountMinor: 0,
      sourceIds,
    });
  }

  return {
    currency: definition.currency,
    totals: {
      taxBaseMinor: taxableIncomeMinor,
      incomeTaxMinor: result.taxMinor,
    },
    lines,
    assumptions: [...definition.assumptions],
    coverage: {
      supported: [...definition.supported],
      unsupported: [...definition.unsupported],
    },
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}

function formatBandRange(band) {
  const upper = band.upperBoundMinor === null ? "the remaining tax base" : `tax base up to ${band.upperBoundMinor}`;
  return `${band.taxableMinor} of ${upper}`;
}
