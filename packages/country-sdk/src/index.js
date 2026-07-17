import { MODEL_STATUS } from "@taxcraft/contracts";
import { createTaxCraft, validateCountryPackage } from "@taxcraft/core";
import { validatePitFacts } from "./pit-facts.js";
import { validatePitManifest } from "./pit-package.js";

export { validatePitFacts } from "./pit-facts.js";

export {
  PIT_FACT_KINDS,
  PIT_MAINTENANCE_MODES,
  PIT_PACKAGE_CONTRACT_VERSION,
  PIT_TAX_UNITS,
  PIT_TAX_YEAR_BASES,
  validatePitManifest,
} from "./pit-package.js";

export {
  ROUNDING_MODE,
  annualizeAmount,
  applyBasisPoints,
  applyCappedRate,
  applyRate,
  applyTaxCredit,
  calculateProgressiveBands,
  calculateQuotientTax,
  calculateSteppedTaper,
  calculateTaxSchedules,
  compareTaxAmounts,
  deductFloorZero,
  prorateAmount,
  roundRatio,
  sumTaxLayers,
} from "./pit-primitives.js";

export function defineCountryPackage({ manifest, sources, models }) {
  if (!models || typeof models !== "object" || Array.isArray(models)) {
    throw new Error("Country package models must be keyed by tax year.");
  }

  for (const { taxYear } of manifest?.taxYears ?? []) {
    const model = models[taxYear];
    if (!model || typeof model.validateFacts !== "function" || typeof model.calculate !== "function") {
      throw new Error(`Missing model implementation for ${taxYear}.`);
    }
  }

  const countryPackage = {
    manifest: structuredClone(manifest),
    sources: structuredClone(sources),
    async validateFacts({ taxYear, facts }) {
      const model = models[taxYear];
      if (!model) return { ok: false, issues: [{ code: "model.missing", path: "$.taxYear", message: "Tax year model is unavailable." }] };
      return model.validateFacts({ facts: structuredClone(facts) });
    },
    async calculate({ taxYear, facts }) {
      const model = models[taxYear];
      if (!model) throw new Error(`Tax year model ${taxYear} is unavailable.`);
      return model.calculate({ facts: structuredClone(facts) });
    },
    coverage(taxYear) {
      return structuredClone(models[taxYear]?.coverage ?? {});
    },
  };

  validateCountryPackage(countryPackage);
  return Object.freeze(countryPackage);
}

export function definePitCountryPackage(definition) {
  validatePitManifest(definition?.manifest);
  const factsSchema = definition.manifest.pit.factsSchema;
  const models = Object.fromEntries(Object.entries(definition.models ?? {}).map(([taxYear, model]) => [
    taxYear,
    {
      ...model,
      async validateFacts({ facts }) {
        const schemaIssues = validatePitFacts(factsSchema, facts);
        if (schemaIssues.some(({ code }) => code === "facts.invalid")) {
          return { ok: false, issues: schemaIssues };
        }
        const countryResult = await model.validateFacts({ facts });
        if (!countryResult?.ok) return countryResult;
        return schemaIssues.length ? { ok: false, issues: schemaIssues } : countryResult;
      },
    },
  ]));
  return defineCountryPackage({ ...definition, models });
}

export function advanceSupportWindow(existingVersions, newVersion) {
  if (!Number.isSafeInteger(newVersion?.order)) throw new Error("New tax year version requires an integer order.");
  if (newVersion.status !== MODEL_STATUS.CURRENT) throw new Error("New tax year version must be current.");

  const combined = [
    ...existingVersions.map((version) => ({
      ...structuredClone(version),
      status: version.status === MODEL_STATUS.CURRENT ? MODEL_STATUS.HISTORICAL_SUPPORTED : version.status,
    })),
    structuredClone(newVersion),
  ];

  const seenYears = new Set();
  for (const version of combined) {
    if (!Number.isSafeInteger(version.order)) throw new Error(`Tax year ${version.taxYear ?? "unknown"} requires an integer order.`);
    if (seenYears.has(version.taxYear)) throw new Error(`Duplicate tax year ${version.taxYear}.`);
    seenYears.add(version.taxYear);
  }

  combined.sort((left, right) => right.order - left.order);
  const active = combined.slice(0, 3).map((version, index) => ({
    ...version,
    status: index === 0 ? MODEL_STATUS.CURRENT : MODEL_STATUS.HISTORICAL_SUPPORTED,
  }));
  const retired = combined.slice(3).map((version) => ({ ...version, status: MODEL_STATUS.RETIRED }));
  return { active, retired };
}

export async function assertCountryPackageConformance(countryPackage, fixtures) {
  validateCountryPackage(countryPackage);
  const engine = createTaxCraft({ countryPackages: [countryPackage] });

  for (const [index, fixture] of fixtures.entries()) {
    const first = await engine.calculate(structuredClone(fixture.request));
    const second = await engine.calculate(structuredClone(fixture.request));
    if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error(`Fixture ${index} is not deterministic.`);
    if (fixture.expectedStatus && first.status !== fixture.expectedStatus) throw new Error(`Fixture ${index} returned ${first.status}, expected ${fixture.expectedStatus}.`);
    if (fixture.expectedTotals && JSON.stringify(first.totals) !== JSON.stringify(fixture.expectedTotals)) {
      throw new Error(`Fixture ${index} totals do not match.`);
    }
  }

  return true;
}
