import { spawnSync } from "node:child_process";

const forwarded = process.argv.slice(2);
for (const script of ["watch-tax-sources.mjs", "watch-uk-source.mjs"]) {
  const result = spawnSync(process.execPath, [new URL(script, import.meta.url), ...forwarded], {
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
