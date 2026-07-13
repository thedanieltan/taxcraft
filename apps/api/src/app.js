import { createTaxCraft } from "@taxcraft/core";
import { singaporePackage } from "@taxcraft/country-sg";

const engine = createTaxCraft({ countryPackages: [singaporePackage] });
const manifest = singaporePackage.manifest;
const sources = singaporePackage.sources;

export const OPENAPI_DOCUMENT = Object.freeze({
  openapi: "3.1.0",
  info: {
    title: "TaxCraft API",
    version: "0.1.0",
    description: "Stateless personal income tax estimates for explicitly supported country packages."
  },
  paths: {
    "/v1/jurisdictions": { get: { summary: "List supported jurisdictions" } },
    "/v1/jurisdictions/{code}": { get: { summary: "Read jurisdiction metadata" } },
    "/v1/jurisdictions/{code}/{taxYear}/coverage": { get: { summary: "Read model coverage and official sources" } },
    "/v1/calculate": { post: { summary: "Calculate a deterministic tax estimate" } },
    "/openapi.json": { get: { summary: "Read this OpenAPI document" } }
  }
});

export function createApi({ logger = () => {} } = {}) {
  return Object.freeze({
    async handle({ method = "GET", path = "/", body = null }) {
      const pathname = new URL(path, "http://taxcraft.local").pathname;

      if (method === "GET" && pathname === "/openapi.json") {
        return json(200, OPENAPI_DOCUMENT);
      }

      if (method === "GET" && pathname === "/v1/jurisdictions") {
        return json(200, {
          jurisdictions: [jurisdictionSummary()]
        });
      }

      if (method === "GET" && pathname === "/v1/jurisdictions/SG") {
        return json(200, jurisdictionDetail());
      }

      const coverageMatch = pathname.match(/^\/v1\/jurisdictions\/([A-Z]{2})\/([^/]+)\/coverage$/);
      if (method === "GET" && coverageMatch) {
        const [, jurisdiction, taxYear] = coverageMatch;
        if (jurisdiction !== manifest.jurisdiction) return notFound();
        const version = manifest.taxYears.find((entry) => entry.taxYear === taxYear);
        if (!version) return notFound();
        return json(200, {
          jurisdiction,
          taxYear,
          modelVersion: version.modelVersion,
          status: version.status,
          coverage: singaporePackage.coverage(taxYear),
          sources: structuredClone(sources)
        });
      }

      if (method === "POST" && pathname === "/v1/calculate") {
        let request;
        try {
          request = typeof body === "string" ? JSON.parse(body) : structuredClone(body);
        } catch {
          logger({ event: "invalid_request", reason: "invalid_json" });
          return json(400, {
            status: "invalid",
            issues: [{ code: "request.json", path: "$", message: "Request body must be valid JSON." }]
          });
        }

        const result = await engine.calculate(request);
        const httpStatus = result.status === "ok" ? 200 : result.status === "invalid" ? 400 : 422;
        const referencedSourceIds = new Set((result.lines ?? []).flatMap((line) => line.sourceIds ?? []));
        const resultSources = sources.filter((source) => referencedSourceIds.has(source.sourceId));

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

function jurisdictionSummary() {
  return {
    jurisdiction: manifest.jurisdiction,
    name: manifest.name,
    taxYears: structuredClone(manifest.taxYears)
  };
}

function jurisdictionDetail() {
  return {
    ...jurisdictionSummary(),
    storesUserPII: manifest.storesUserPII,
    advisory: manifest.advisory,
    sources: structuredClone(sources)
  };
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
      "x-content-type-options": "nosniff"
    },
    body
  };
}
