import { cp, mkdir, rm } from "node:fs/promises";

const source = new URL("../packages/country-simple-progressive/src/", import.meta.url);
const destination = new URL("../packages/country-simple-progressive/dist/", import.meta.url);

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
