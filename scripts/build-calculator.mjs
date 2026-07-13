import { cp, mkdir, rm } from "node:fs/promises";

const source = new URL("../apps/calculator/public/", import.meta.url);
const destination = new URL("../apps/calculator/dist/", import.meta.url);

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
console.info("Calculator built successfully.");
