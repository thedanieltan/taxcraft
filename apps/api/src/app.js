import { createTaxCraft } from "@taxcraft/core";
import { ukPackage } from "@taxcraft/country-gb";
import { calculateChargeableIncomeWorksheet, singaporePackage } from "@taxcraft/country-sg";

const countryPackages = Object.freeze([singaporePackage, ukPackage]);
const packagesByJurisdiction = new Map(countryPackages.map((countryPackage) => [countryPackage.manifest.jurisdiction, countryPackage]));
const engine = createTaxCraft({ countryPackages });

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
    "/v1/worksheets/SG/chargeable-income": { post: { summary: "Derive Singapore chargeable income from user-confirmed totals" } },
    "/v1/calculate": { post: { summary: "Calculate a deterministic tax estimate" } },
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
        return json(200, {
          jurisdiction,
          taxYear,
          modelVersion: version.modelVersion,
          status: version.status,
          coverage: countryPackage.coverage(taxYear),
          sources: structuredClone(countryPackage.sources)
        });
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

      if (method === "POST" && pathname === "/v1/calculate") {
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
    sources: structuredClone(countryPackage.sources)
  };
}

function invalidJson() {
  return json(400, {
    status: "invalid",
    issues: [{ code: "request.json", path: "$", message: "Request body must be valid JSON." }]
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
