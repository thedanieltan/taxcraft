import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { UK_MODEL_DATA } from "@taxcraft/country-gb";
import {
  canonicalUkObservation,
  evaluateUkUpdate,
  extractUkIndependent,
  extractUkPrimary,
  renderUkModelData,
  renderUkObservation,
  renderUkRetirements,
  renderUkSources
} from "../src/index.js";

const sourceUrl = "https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past";
const fixture = await readFile(new URL("./fixtures/gb-rates.html", import.meta.url), "utf8");

function observations(html = fixture) {
  return {
    primary: extractUkPrimary(html, sourceUrl),
    independent: extractUkIndependent(html, sourceUrl)
  };
}

test("independent UK extractors agree on the official-source-shaped tables", () => {
  const { primary, independent } = observations();
  assert.equal(canonicalUkObservation(primary), canonicalUkObservation(independent));
  assert.deepEqual(primary.years.map((year) => year.taxYear), ["2026-27", "2025-26", "2024-25", "2023-24"]);
  assert.equal(primary.years[0].personalAllowancePounds, 12_570);
  assert.equal(primary.years[0].basicRateBandPounds, 37_700);
  assert.equal(primary.years[0].higherRateUpperPounds, 125_140);
  assert.equal(primary.years[0].additionalRateStartsAbovePounds, 125_141);
});

test("unchanged HMRC values produce no candidate", () => {
  const { primary, independent } = observations();
  const evaluation = evaluateUkUpdate({
    primary,
    independent,
    currentModelData: UK_MODEL_DATA,
    retrievedAt: "2026-07-14"
  });
  assert.equal(evaluation.status, "no-change");
  assert.deepEqual(evaluation.retired, []);
});

test("a fourth current year advances the support window and retires the oldest", () => {
  const { primary, independent } = observations();
  const next = {
    taxYear: "2027-28",
    order: 2027,
    personalAllowancePounds: 12_570,
    taperStartPounds: 100_000,
    basicRateBandPounds: 37_700,
    higherRateUpperPounds: 125_140,
    additionalRateStartsAbovePounds: 125_141
  };
  primary.years.unshift(structuredClone(next));
  independent.years.unshift(structuredClone(next));

  const evaluation = evaluateUkUpdate({
    primary,
    independent,
    currentModelData: UK_MODEL_DATA,
    retrievedAt: "2027-04-06"
  });

  assert.equal(evaluation.status, "candidate");
  assert.deepEqual(evaluation.modelData.taxYears.map(({ taxYear, status }) => [taxYear, status]), [
    ["2025-26", "historical-supported"],
    ["2026-27", "historical-supported"],
    ["2027-28", "current"]
  ]);
  assert.deepEqual(evaluation.retired, [{
    jurisdiction: "GB",
    taxYear: "2024-25",
    retiredAt: "2027-04-06",
    reason: "support-window-exceeded",
    lastModelVersion: "1.0.0"
  }]);
});

test("extractor disagreement blocks admission", () => {
  const { primary, independent } = observations();
  independent.years[0].basicRateBandPounds += 1;
  assert.throws(() => evaluateUkUpdate({
    primary,
    independent,
    currentModelData: UK_MODEL_DATA,
    retrievedAt: "2026-07-14"
  }), /independent extractors disagree/);
});

test("proposed or draft language fails closed", () => {
  const { primary, independent } = observations(`${fixture}<p>Draft rates proposed for consultation only.</p>`);
  assert.throws(() => evaluateUkUpdate({
    primary,
    independent,
    currentModelData: UK_MODEL_DATA,
    retrievedAt: "2026-07-14"
  }), /ambiguous source language/);
});

test("UK maintenance renderers are deterministic and lifecycle-safe", () => {
  const { primary, independent } = observations();
  const evaluation = evaluateUkUpdate({
    primary,
    independent,
    currentModelData: UK_MODEL_DATA,
    retrievedAt: "2026-07-14"
  });
  assert.equal(renderUkModelData(evaluation.modelData), renderUkModelData(evaluation.modelData));
  assert.equal(renderUkObservation(evaluation.observation), renderUkObservation(evaluation.observation));
  assert.equal(renderUkRetirements(evaluation.retired), "[]\n");
  assert.match(renderUkSources("2026-07-14"), /gb-hmrc-income-tax-rates-current-and-past/);
});
