import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createApi } from "./app.js";

const api = createApi({ logger: (record) => console.info(JSON.stringify(record)) });
const publicRoot = new URL("../../calculator/public/", import.meta.url);
const staticFiles = new Map([
  ["/", "index.html"],
  ["/app.js", "app.js"],
  ["/styles.css", "styles.css"]
]);

export function startServer({ port = Number(process.env.PORT ?? 3000) } = {}) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://taxcraft.local");

      if (staticFiles.has(url.pathname) && request.method === "GET") {
        await serveStatic(response, staticFiles.get(url.pathname));
        return;
      }

      const body = await readRequestBody(request);
      const result = await api.handle({ method: request.method, path: url.pathname, body });
      response.writeHead(result.status, result.headers);
      response.end(JSON.stringify(result.body));
    } catch (error) {
      const status = error?.code === "REQUEST_TOO_LARGE" ? 413 : 500;
      response.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff"
      });
      response.end(JSON.stringify({
        status: status === 413 ? "invalid" : "error",
        message: status === 413 ? "Request body is too large." : "The request could not be completed."
      }));
    }
  });

  server.listen(port, () => {
    console.info(JSON.stringify({ event: "server_started", port }));
  });
  return server;
}

async function serveStatic(response, filename) {
  const url = new URL(filename, publicRoot);
  const data = await readFile(fileURLToPath(url));
  const type = extname(filename) === ".js"
    ? "text/javascript; charset=utf-8"
    : extname(filename) === ".css"
      ? "text/css; charset=utf-8"
      : "text/html; charset=utf-8";
  response.writeHead(200, {
    "content-type": type,
    "cache-control": "no-store",
    "content-security-policy": "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff"
  });
  response.end(data);
}

async function readRequestBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return null;
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) {
      const error = new Error("Request body is too large.");
      error.code = "REQUEST_TOO_LARGE";
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (entry === import.meta.url) startServer();
