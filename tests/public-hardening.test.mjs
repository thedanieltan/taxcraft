import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("CI pins third-party actions and smoke tests the container", async () => {
  const workflow = await read(".github/workflows/ci.yml");
  assert.match(workflow, /actions\/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5/);
  assert.match(workflow, /actions\/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020/);
  assert.doesNotMatch(workflow, /uses:\s+actions\/(?:checkout|setup-node)@v\d/);
  assert.match(workflow, /docker build --tag taxcraft:test/);
  assert.match(workflow, /netTaxPayableMinor/);
  assert.match(workflow, /set-cookie/);
});

test("the service container runs as non-root and Compose removes write privileges", async () => {
  const dockerfile = await read("Dockerfile");
  const compose = await read("compose.yaml");
  assert.ok(dockerfile.indexOf("COPY . .") < dockerfile.indexOf("RUN npm ci"));
  assert.match(dockerfile, /USER node/);
  assert.match(dockerfile, /CMD \["npm", "start"\]/);
  assert.match(compose, /read_only: true/);
  assert.match(compose, /cap_drop:[\s\S]*- ALL/);
  assert.match(compose, /no-new-privileges:true/);
});

test("source watch is pinned, fail closed and observable", async () => {
  const workflow = await read(".github/workflows/tax-source-watch.yml");
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /Tax source watch blocked/);
  assert.match(workflow, /if: failure\(\)/);
  assert.match(workflow, /if: success\(\)/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /actions\/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5/);
  assert.doesNotMatch(workflow, /--admin/);
});

test("Dependabot merge never executes the dependency branch with a write token", async () => {
  const workflow = await read(".github/workflows/dependabot-merge.yml");
  assert.match(workflow, /pull_request_target/);
  assert.match(workflow, /github\.actor == 'dependabot\[bot\]'/);
  assert.doesNotMatch(workflow, /actions\/checkout|git checkout|npm ci|npm run|docker build/);
  assert.match(workflow, /code_state.*pass/);
  assert.match(workflow, /container_state.*pass/);
  assert.match(workflow, /gh pr merge/);
});

test("public intake keeps taxpayer data and external package review out of scope", async () => {
  const contributing = await read("CONTRIBUTING.md");
  const correction = await read(".github/ISSUE_TEMPLATE/tax-rule-correction.yml");
  const bug = await read(".github/ISSUE_TEMPLATE/bug-report.yml");
  assert.match(contributing, /does not operate a submission or review programme for external country packages/i);
  assert.match(correction, /Official source URL/);
  assert.match(correction, /not included personal or taxpayer-identifying information/i);
  assert.match(bug, /removed personal data, taxpayer records and secrets/i);
});
