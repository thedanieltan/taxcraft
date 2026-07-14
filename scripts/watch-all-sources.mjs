import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const forwarded = process.argv.slice(2);
for (const script of ["watch-tax-sources.mjs", "watch-uk-source.mjs"]) {
  const scriptPath = fileURLToPath(new URL(script, import.meta.url));
  const result = spawnSync(process.execPath, [scriptPath, ...forwarded], {
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
