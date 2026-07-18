import {
  getPitCatalogueStatus,
  getPitJurisdiction,
  listPitCalculationFamilies,
  listPitJurisdictions,
} from "@taxcraft/catalog";
import { createTaxCraft } from "@taxcraft/core";
import { flatRatePackages } from "@taxcraft/country-flat-rate";
import { ukPackage } from "@taxcraft/country-gb";
import { noPitPackages } from "@taxcraft/country-no-pit";
import { progressiveReliefPackages } from "@taxcraft/country-progressive-reliefs";
import { calculateChargeableIncomeWorksheet, singaporePackage } from "@taxcraft/country-sg";
import { simpleProgressivePackages } from "@taxcraft/country-simple-progressive";

const countryPackages = Object.freeze([
  singaporePackage,
  ukPackage,
  ...noPitPackages,
  ...flatRatePackages,
  ...simpleProgressivePackages,
  ...progressiveReliefPackages,
]);
const packagesByJurisdiction = new Map(countryPackages.map((countryPackage) => [countryPackage.manifest.jurisdiction, countryPackage]));
const engine = createTaxCraft({ countryPackages });

export const OPENAPI_DOCUMENT = Object.freeze({
  openapi: "3.1.0",
  info: {
    title: "TaxCraft API",
    version: "0.1.0",
    description: "Stateless personal income tax catalogue and deterministic estimates for implemented country packages."
  },
  paths: {
    "/v1/jurisdictions": { get: { summary: "List implemented jurisdictions (compatibility route)" } },
    "/v1/jurisdictions/{code}": { get: { summary: "Read implemented jurisdiction metadata (compatibility route)" } },
    "/v1/jurisdictions/{code}/{taxYear}/coverage": { get: { summary: "Read implemented model coverage (compatibility route)" } },
    "/v1/pit/status": { get: { summary: "Read global PIT catalogue status" } },
    "/v1/pit/calculation-families": { get: { summary: "List PIT calculation families and implementation waves" } },
    "/v1/pit/jurisdictions": { get: { summary: "List all registered PIT jurisdictions" } },
    "/v1/pit/jurisdictions/{code}": { get: { summary: "Read global PIT jurisdiction metadata" } },
    "/v1/pit/jurisdictions/{code}/{taxYear}/coverage": { get: { summary: "Read implemented PIT model coverage and sources" } },
    "/v1/pit/jurisdictions/{code}/{taxYear}/input-schema": { get: { summary: "Read the executable PIT calculation facts schema" } },
    "/v1/worksheets/SG/chargeable-income": { post: { summary: "Derive Singapore chargeable income from user-confirmed totals" } },
    "/v1/calculate": { post: { summary: "Calculate a deterministic tax estimate (compatibility route)" } },
    "/v1/pit/calculate": { post: { summary: "Calculate a deterministic PIT estimate" } },
    "/openapi.json": { get: { summary: "Read this OpenAPI document" } }
  }
});

export function createApi({ logger = () => {} } = {}) {
  return Object.freeze({
    async handle({ method = "GET", path = "/", body = null }) {
      const pathname = new URL(path, "http://taxcraft.local").pathname;

      if (method === "OPTIONS" && isPublicApiPath(pathname)) {
        return json(200, { status: "ok" });
      }

      if (method === "GET" && pathname === "/openapi.json") {
        return json(200, OPENAPI_DOCUMENT);
      }

      if (method === "GET" && pathname === "/v1/pit/status") {
        return json(200, getPitCatalogueStatus());
      }

      if (method === "GET" && pathname === "/v1/pit/calculation-families") {
        return json(200, { calculationFamilies: listPitCalculationFamilies() });
      }

      if (method === "GET" && pathname === "/v1/pit/jurisdictions") {
        return json(200, { jurisdictions: listPitJurisdictions() });
      }

      const pitJurisdictionMatch = pathname.match(/^\/v1\/pit\/jurisdictions\/([A-Z]{2})$/);
      if (method === "GET" && pitJurisdictionMatch) {
        const catalogueEntry = getPitJurisdiction(pitJurisdictionMatch[1]);
        return catalogueEntry ? json(200, pitJurisdictionDetail(catalogueEntry)) : notFound();
      }

      const pitCoverageMatch = pathname.match(/^\/v1\/pit\/jurisdictions\/([A-Z]{2})\/([^/]+)\/coverage$/);
      if (method === "GET" && pitCoverageMatch) {
        return implementedModelResource(pitCoverageMatch[1], pitCoverageMatch[2], "coverage");
      }

      const inputSchemaMatch = pathname.match(/^\/v1\/pit\/jurisdictions\/([A-Z]{2})\/([^/]+)\/input-schema$/);
      if (method === "GET" && inputSchemaMatch) {
        return implementedModelResource(inputSchemaMatch[1], inputSchemaMatch[2], "input-schema");
      }

      if (method === "GET" && pathname === "/v1/jurisdictions") {
        return json(200, {
          jurisdictions: countryPackages.map(jurisdictionSummary)
        });
      }

      const jurisdictionMatch = pathname.match(/^\/v1\/jurisdictions\/([A-Z]{2})$/);
      if (method === "GET" && jurisdictionMatch) {
        const countryPackage = packagesByJurisdiction.get(jurisdictionMatch[1]);
        return countryPackage ? json(200, jurisdictionDetail(countryPackage)) : notFound();
      }

      const coverageMatch = pathname.match(/^\/v1\/jurisdictions\/([A-Z]{2})\/([^/]+)\/coverage$/);
      if (method === "GET" && coverageMatch) {
        const [, jurisdiction, taxYear] = coverageMatch;
        const countryPackage = packagesByJurisdiction.get(jurisdiction);
        if (!countryPackage) return notFound();
        const version = countryPackage.manifest.taxYears.find((entry) => entry.taxYear === taxYear);
        if (!version) return notFound();
        return json(200, coverageResponse(countryPackage, version));
      }

      if (method === "POST" && pathname === "/v1/worksheets/SG/chargeable-income") {
        const parsed = parseBody(body);
        if (!parsed.ok) {
          logger({ event: "invalid_request", reason: "invalid_json" });
          return invalidJson();
        }

        const result = calculateChargeableIncomeWorksheet(parsed.value?.facts);
        const resultSources = sourcesForLines(result.lines, singaporePackage.sources);
        logger({ event: "worksheet_completed", status: result.status, jurisdiction: "SG" });
        return json(result.status === "ok" ? 200 : 400, {
          ...result,
          jurisdiction: "SG",
          sources: structuredClone(resultSources)
        });
      }

      if (method === "POST" && (pathname === "/v1/calculate" || pathname === "/v1/pit/calculate")) {
        const parsed = parseBody(body);
        if (!parsed.ok) {
          logger({ event: "invalid_request", reason: "invalid_json" });
          return invalidJson();
        }

        const request = parsed.value;
        const result = await engine.calculate(request);
        const httpStatus = result.status === "ok" ? 200 : result.status === "invalid" ? 400 : 422;
        const countryPackage = packagesByJurisdiction.get(request?.jurisdiction);
        const resultSources = sourcesForLines(result.lines, countryPackage?.sources ?? []);

        logger({
          event: "calculation_completed",
          status: result.status,
          jurisdiction: typeof request?.jurisdiction === "string" ? request.jurisdiction : undefined,
          taxYear: typeof request?.taxYear === "string" ? request.taxYear : undefined
        });

        return json(httpStatus, {
          ...result,
          sources: structuredClone(resultSources)
        });
      }

      return notFound();
    }
  });
}

function implementedModelResource(jurisdiction, taxYear, resource) {
  const catalogueEntry = getPitJurisdiction(jurisdiction);
  if (!catalogueEntry) return notFound();
  const countryPackage = packagesByJurisdiction.get(jurisdiction);
  if (!countryPackage) return notImplemented(catalogueEntry);
  const version = countryPackage.manifest.taxYears.find((entry) => entry.taxYear === taxYear);
  if (!version) return notFound();
  if (resource === "input-schema") {
    return json(200, {
      jurisdiction,
      taxYear,
      modelVersion: version.modelVersion,
      status: version.status,
      pit: structuredClone(countryPackage.manifest.pit),
      factsSchema: structuredClone(countryPackage.manifest.pit.factsSchema),
    });
  }
  return json(200, coverageResponse(countryPackage, version));
}

function pitJurisdictionDetail(catalogueEntry) {
  const countryPackage = packagesByJurisdiction.get(catalogueEntry.code);
  return {
    ...catalogueEntry,
    calculator: countryPackage
      ? {
        available: true,
        name: countryPackage.manifest.name,
        taxYears: structuredClone(countryPackage.manifest.taxYears),
        pit: structuredClone(countryPackage.manifest.pit),
      }
      : { available: false },
  };
}

function coverageResponse(countryPackage, version) {
  return {
    jurisdiction: countryPackage.manifest.jurisdiction,
    taxYear: version.taxYear,
    modelVersion: version.modelVersion,
    status: version.status,
    coverage: countryPackage.coverage(version.taxYear),
    pit: structuredClone(countryPackage.manifest.pit),
    sources: structuredClone(countryPackage.sources)
  };
}

function isPublicApiPath(pathname) {
  return pathname === "/openapi.json" || pathname.startsWith("/v1/");
}

function parseBody(body) {
  try {
    return {
      ok: true,
      value: typeof body === "string" ? JSON.parse(body) : structuredClone(body)
    };
  } catch {
    return { ok: false };
  }
}

function sourcesForLines(lines = [], sources = []) {
  const referencedSourceIds = new Set(lines.flatMap((line) => line.sourceIds ?? []));
  return sources.filter((source) => referencedSourceIds.has(source.sourceId));
}

function jurisdictionSummary(countryPackage) {
  return {
    jurisdiction: countryPackage.manifest.jurisdiction,
    name: countryPackage.manifest.name,
    taxYears: structuredClone(countryPackage.manifest.taxYears)
  };
}

function jurisdictionDetail(countryPackage) {
  return {
    ...jurisdictionSummary(countryPackage),
    storesUserPII: countryPackage.manifest.storesUserPII,
    advisory: countryPackage.manifest.advisory,
    pit: structuredClone(countryPackage.manifest.pit),
    sources: structuredClone(countryPackage.sources)
  };
}

function invalidJson() {
  return json(400, {
    status: "invalid",
    issues: [{ code: "request.json", path: "$", message: "Request body must be valid JSON." }]
  });
}

function notImplemented(catalogueEntry) {
  return json(409, {
    status: "not_implemented",
    message: "The jurisdiction is registered but no TaxCraft calculator is implemented.",
    jurisdiction: catalogueEntry.code,
    classificationStatus: catalogueEntry.classificationStatus,
    calculationFamily: catalogueEntry.calculationFamily,
  });
}

function notFound() {
  return json(404, {
    status: "not_found",
    message: "The requested TaxCraft resource is not available."
  });
}

function json(status, body) {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400"
    },
    body
  };
}
