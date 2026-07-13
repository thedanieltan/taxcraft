import { createRegistry } from "./registry.js";
import { invalidResult, successResult, unsupportedResult } from "./result.js";
import { validatePackageOutput, validateRequest } from "./validation.js";

export { createRegistry, validateCountryPackage } from "./registry.js";
export { validateRequest } from "./validation.js";

export function createTaxCraft({ countryPackages = [] } = {}) {
  const registry = createRegistry(countryPackages);

  return Object.freeze({
    listJurisdictions() {
      return registry.list();
    },

    async calculate(request) {
      const requestIssues = validateRequest(request);
      if (requestIssues.length) return invalidResult(requestIssues);

      const countryPackage = registry.get(request.jurisdiction);
      if (!countryPackage) {
        return unsupportedResult({
          reasonCode: "jurisdiction-not-supported",
          jurisdiction: request.jurisdiction,
          taxYear: request.taxYear,
        });
      }

      const version = countryPackage.manifest.taxYears.find(({ taxYear }) => taxYear === request.taxYear);
      if (!version) {
        return unsupportedResult({
          reasonCode: "tax-year-not-supported",
          jurisdiction: request.jurisdiction,
          taxYear: request.taxYear,
          supportedTaxYears: countryPackage.manifest.taxYears.map(({ taxYear }) => taxYear),
        });
      }

      const facts = structuredClone(request.facts);
      const factValidation = await countryPackage.validateFacts({ taxYear: request.taxYear, facts });
      if (!factValidation?.ok) {
        return invalidResult(
          Array.isArray(factValidation?.issues) && factValidation.issues.length
            ? factValidation.issues
            : [{ code: "facts.unsupported", path: "$.facts", message: "Facts are not supported by this country package." }],
        );
      }

      const output = await countryPackage.calculate({
        taxYear: request.taxYear,
        facts: structuredClone(factValidation.facts),
      });
      const sourceIds = new Set(countryPackage.sources.map(({ sourceId }) => sourceId));
      const outputIssues = validatePackageOutput(output, sourceIds);
      if (outputIssues.length) return invalidResult(outputIssues);

      const citedSourceIds = new Set(output.lines.flatMap(({ sourceIds: ids }) => ids));
      const citedSources = countryPackage.sources.filter(({ sourceId }) => citedSourceIds.has(sourceId));
      return successResult({
        jurisdiction: request.jurisdiction,
        taxYear: request.taxYear,
        modelVersion: version.modelVersion,
        output,
        sources: citedSources,
      });
    },
  });
}
