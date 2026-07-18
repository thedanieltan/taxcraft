import {
  ROUNDING_MODE,
  applyBasisPoints,
  deductFloorZero,
  definePitCountryPackage,
  roundRatio,
} from "@taxcraft/country-sdk";
import { FLAT_RATE_JURISDICTIONS } from "./data.js";

const TAX_YEARS = Object.freeze([2024, 2025, 2026]);

export const flatRatePackages = Object.freeze(FLAT_RATE_JURISDICTIONS.map(createPackage));
export const flatRatePackagesByJurisdiction = Object.freeze(Object.fromEntries(
  flatRatePackages.map((countryPackage) => [countryPackage.manifest.jurisdiction, countryPackage]),
));

export { FLAT_RATE_JURISDICTIONS };

function createPackage(definition) {
  return definition.kind === "estonia-annual"
    ? createEstoniaPackage(definition)
    : createConfirmedTaxBasePackage(definition);
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
      taxYearBasis: "calendar-year",
      currencyCodes: [definition.currency],
      incomeSchedules: ["annual-personal-income"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema,
      rounding: [
        { stage: "personal-income-tax", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: {
        mode: "manual",
        sourceWatch: false,
      },
    },
  };
}

function createConfirmedTaxBasePackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: ["scopeConfirmed", "taxBaseMinor"],
    properties: {
      scopeConfirmed: {
        type: "boolean",
        title: definition.scopeTitle,
        description: definition.scopeDescription,
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      taxBaseMinor: {
        type: "integer",
        title: definition.taxBaseTitle,
        description: `Caller-confirmed annual tax base in ${definition.currency}, represented in the currency's minor unit convention.`,
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": definition.currency,
      },
    },
  };

  return definePitCountryPackage({
    manifest: baseManifest(definition, factsSchema),
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [
      String(year),
      confirmedTaxBaseModel(definition, year),
    ])),
  });
}

function confirmedTaxBaseModel(definition, year) {
  const rateBasisPoints = definition.rateBasisPointsByYear[String(year)];
  return {
    coverage: {
      supported: [...definition.supported],
      unsupported: [...definition.unsupported],
    },
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const incomeTaxMinor = applyBasisPoints(
        facts.taxBaseMinor,
        rateBasisPoints,
        ROUNDING_MODE.HALF_UP,
      );
      return {
        currency: definition.currency,
        totals: {
          taxBaseMinor: facts.taxBaseMinor,
          incomeTaxMinor,
        },
        lines: [
          {
            ruleId: `${definition.code.toLowerCase()}.pit.${year}.flat-rate`,
            label: `Personal income tax at ${formatRate(rateBasisPoints)}`,
            amountMinor: incomeTaxMinor,
            sourceIds: [definition.sources[0].sourceId],
          },
        ],
        assumptions: [...definition.assumptions],
        coverage: {
          supported: [...definition.supported],
          unsupported: [...definition.unsupported],
        },
      };
    },
  };
}

function createEstoniaPackage(definition) {
  const factsSchema = {
    type: "object",
    additionalProperties: false,
    required: [
      "residentConfirmed",
      "annualIncomeForExemptionMinor",
      "taxableIncomeBeforeBasicExemptionMinor",
      "pensionableAgeDuringYear",
    ],
    properties: {
      residentConfirmed: {
        type: "boolean",
        title: "Confirmed Estonian resident individual",
        description: "The caller confirms resident-individual treatment for the selected calendar year.",
        const: true,
        "x-taxcraft-kind": "confirmed-status",
      },
      annualIncomeForExemptionMinor: {
        type: "integer",
        title: "Annual income used for the basic-exemption test",
        description: "Annual income used by the Estonian basic-exemption rules, in EUR minor units.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "EUR",
      },
      taxableIncomeBeforeBasicExemptionMinor: {
        type: "integer",
        title: "Taxable income before the overall basic exemption",
        description: "Caller-confirmed taxable income after other supported deductions but before the overall basic exemption, in EUR minor units.",
        minimum: 0,
        "x-taxcraft-kind": "money-minor",
        "x-taxcraft-currency": "EUR",
      },
      pensionableAgeDuringYear: {
        type: "boolean",
        title: "Reached pensionable age during the year",
        description: "Whether the person reached or had reached Estonian pensionable age in the selected calendar year.",
        "x-taxcraft-kind": "plain",
      },
    },
  };

  return definePitCountryPackage({
    manifest: baseManifest(definition, factsSchema),
    sources: definition.sources,
    models: Object.fromEntries(TAX_YEARS.map((year) => [
      String(year),
      estoniaModel(definition, year),
    ])),
  });
}

function estoniaModel(definition, year) {
  const parameters = definition.models[String(year)];
  return {
    coverage: {
      supported: [...definition.supported],
      unsupported: [...definition.unsupported],
    },
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const entitlementMinor = facts.pensionableAgeDuringYear
        ? parameters.pensionableExemptionMinor
        : generalEstonianExemption(parameters, facts.annualIncomeForExemptionMinor);
      const exemptionAppliedMinor = Math.min(
        entitlementMinor,
        facts.taxableIncomeBeforeBasicExemptionMinor,
      );
      const taxBaseMinor = deductFloorZero(
        facts.taxableIncomeBeforeBasicExemptionMinor,
        exemptionAppliedMinor,
      );
      const incomeTaxMinor = applyBasisPoints(
        taxBaseMinor,
        parameters.rateBasisPoints,
        ROUNDING_MODE.HALF_UP,
      );

      return {
        currency: definition.currency,
        totals: {
          annualIncomeForExemptionMinor: facts.annualIncomeForExemptionMinor,
          taxableIncomeBeforeBasicExemptionMinor: facts.taxableIncomeBeforeBasicExemptionMinor,
          basicExemptionEntitlementMinor: entitlementMinor,
          basicExemptionAppliedMinor: exemptionAppliedMinor,
          taxBaseMinor,
          incomeTaxMinor,
        },
        lines: [
          {
            ruleId: `ee.pit.${year}.basic-exemption`,
            label: "Overall basic exemption applied",
            amountMinor: -exemptionAppliedMinor,
            sourceIds: ["ee.emta.basic-exemption"],
          },
          {
            ruleId: `ee.pit.${year}.income-tax-rate`,
            label: `Income tax at ${formatRate(parameters.rateBasisPoints)}`,
            amountMinor: incomeTaxMinor,
            sourceIds: ["ee.emta.tax-rates-2024-2026"],
          },
        ],
        assumptions: [...definition.assumptions],
        coverage: {
          supported: [...definition.supported],
          unsupported: [...definition.unsupported],
        },
      };
    },
  };
}

function generalEstonianExemption(parameters, annualIncomeMinor) {
  if (parameters.generalExemptionMode === "fixed") {
    return parameters.generalMaximumMinor;
  }
  if (annualIncomeMinor <= parameters.taperStartIncomeMinor) {
    return parameters.generalMaximumMinor;
  }
  if (annualIncomeMinor >= parameters.taperEndIncomeMinor) return 0;
  return roundRatio(
    BigInt(parameters.generalMaximumMinor) * BigInt(parameters.taperEndIncomeMinor - annualIncomeMinor),
    parameters.taperEndIncomeMinor - parameters.taperStartIncomeMinor,
    ROUNDING_MODE.HALF_UP,
  );
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
