import { createApi } from "@taxcraft/api";

const MAX_BODY_BYTES = 64 * 1024;
const api = createApi({
  logger(event) {
    console.log(JSON.stringify(event));
  }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz" || url.pathname === "/readyz") {
      return response(200, { status: "ok" });
    }

    if (url.pathname === "/openapi.json" || url.pathname.startsWith("/v1/")) {
      let body = null;
      if (request.method !== "GET" && request.method !== "HEAD") {
        try {
          body = await readBodyLimited(request, MAX_BODY_BYTES);
        } catch (error) {
          const status = error?.code === "body_too_large" ? 413 : 400;
          return response(status, {
            status: "invalid",
            issues: [{
              code: error?.code ?? "request.body",
              path: "$",
              message: status === 413 ? "Request body exceeds 64 KiB." : "Request body could not be read."
            }]
          });
        }
      }

      const result = await api.handle({
        method: request.method,
        path: url.pathname + url.search,
        body
      });

      return response(result.status, result.body, result.headers);
    }

    if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function") {
      return response(503, { status: "unavailable", message: "Static assets are unavailable." });
    }

    return env.ASSETS.fetch(request);
  }
};

async function readBodyLimited(request, limit) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    throw Object.assign(new Error("body too large"), { code: "body_too_large" });
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        throw Object.assign(new Error("body too large"), { code: "body_too_large" });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

function response(status, body, headers = {}) {
  const normalized = new Headers(headers);
  normalized.set("content-type", "application/json; charset=utf-8");
  normalized.set("cache-control", "no-store");
  normalized.set("content-security-policy", "default-src 'none'; frame-ancestors 'none'");
  normalized.set("referrer-policy", "no-referrer");
  normalized.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(body), { status, headers: normalized });
}
