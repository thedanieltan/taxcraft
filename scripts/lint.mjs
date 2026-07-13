import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const ignored = new Set([".git", "node_modules", "dist", "coverage"]);
const checkedExtensions = new Set([".js", ".mjs", ".json", ".md", ".yml", ".yaml"]);
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!checkedExtensions.has(extname(entry.name))) continue;

    const content = await readFile(path, "utf8");
    if (!content.endsWith("\n")) failures.push(`${path}: missing final newline`);
    content.split("\n").forEach((line, index) => {
      if (/\s+$/.test(line)) failures.push(`${path}:${index + 1}: trailing whitespace`);
      if (line.includes("\t")) failures.push(`${path}:${index + 1}: tab character`);
    });
    if (extname(entry.name) === ".json") {
      try {
        JSON.parse(content);
      } catch (error) {
        failures.push(`${path}: invalid JSON: ${error.message}`);
      }
    }
  }
}

await walk(".");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Repository text checks passed.");
