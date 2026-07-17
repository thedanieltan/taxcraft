import { cp, mkdir, rm } from "node:fs/promises";

const source = new URL("../packages/country-sdk/src/", import.meta.url);
const schemas = new URL("../packages/country-sdk/schemas/", import.meta.url);
const destination = new URL("../packages/country-sdk/dist/", import.meta.url);
const schemaDestination = new URL("../packages/country-sdk/dist/schemas/", import.meta.url);

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
await mkdir(schemaDestination, { recursive: true });
await cp(schemas, schemaDestination, { recursive: true });
