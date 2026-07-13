import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SINGAPORE_MODEL_DATA } from "../../country-sg/src/model-data.js";
import {
  evaluateSingaporeUpdate,
  extractSingaporeIndependent,
  extractSingaporePrimary,
  observationsAgree,
  renderSingaporeModelData,
  validateSingaporeObservation
} from "../src/index.js";

const sourceUrl = "https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/individual-income-tax-rates";
const fixture = await readFile(new URL("./fixtures/sg-rates.html", import.meta.url), "utf8");
const currentObservation = JSON.parse(await readFile(new URL("../../../automation/observations/sg-current.json", import.meta.url), "utf8"));

function extracts(html = fixture) {
  return {
    primary: extractSingaporePrimary(html, sourceUrl),
    independent: extractSingaporeIndependent(html, sourceUrl)
  };
}

test("independent extractors agree on the accepted Singapore resident rate table", () => {
  const { primary, independent } = extracts();
  assert.equal(observationsAgree(primary, independent), true);
  assert.deepEqual(validateSingaporeObservation(primary), []);
  assert.equal(primary.schedules.length, 1);
  assert.equal(independent.schedules.length, 1);
  assert.equal(primary.schedules[0].brackets.length, 13);
  assert.deepEqual(primary.rebates.YA2025, {
    percentage: 60,
    capDollars: 200,
    sourceId: "sg-iras-pit-rebate-ya2024-ya2025"
  });
});

test("unrelated non-resident YA headings are excluded from both extractors", () => {
  const { primary, independent } = extracts();
  assert.deepEqual(primary.schedules.map(({ fromOrder }) => fromOrder), [2024]);
  assert.deepEqual(independent.schedules.map(({ fromOrder }) => fromOrder), [2024]);
  assert.equal(primary.schedules[0].brackets.at(-1).rateBasisPoints, 2400);
});

test("unchanged current source produces no candidate patch", () => {
  const { primary, independent } = extracts();
  const result = evaluateSingaporeUpdate({
    primary,
    independent,
    currentObservation,
    currentModelData: SINGAPORE_MODEL_DATA,
    targetOrder: 2026,
    retrievedAt: "2026-07-14"
  });
  assert.equal(result.status, "no-change");
  assert.equal(result.changed, false);
  assert.deepEqual(result.retired, []);
});

test("an open-ended official schedule advances the three-year window", () => {
  const { primary, independent } = extracts();
  const result = evaluateSingaporeUpdate({
    primary,
    independent,
    currentObservation,
    currentModelData: SINGAPORE_MODEL_DATA,
    targetOrder: 2027,
    retrievedAt: "2027-01-01"
  });
  assert.equal(result.status, "candidate");
  assert.deepEqual(result.modelData.taxYears.map(({ taxYear, status }) => [taxYear, status]), [
    ["YA2025", "historical-supported"],
    ["YA2026", "historical-supported"],
    ["YA2027", "current"]
  ]);
  assert.equal(result.modelData.taxYears[2].rebate, null);
  assert.equal(result.retired[0].taxYear, "YA2024");
});

test("extractor disagreement blocks the update", () => {
  const { primary, independent } = extracts();
  independent.schedules[0].brackets[11].rateBasisPoints = 2299;
  assert.throws(() => evaluateSingaporeUpdate({
    primary,
    independent,
    currentObservation,
    currentModelData: SINGAPORE_MODEL_DATA,
    targetOrder: 2026,
    retrievedAt: "2026-07-14"
  }), /independent extractors disagree/);
});

test("proposal or draft language inside the resident section fails closed", () => {
  const ambiguousFixture = fixture.replace(
    '<h2 id="non-resident">',
    '<p>These are proposed rates subject to enactment.</p><h2 id="non-resident">'
  );
  const { primary, independent } = extracts(ambiguousFixture);
  assert.throws(() => evaluateSingaporeUpdate({
    primary,
    independent,
    currentObservation,
    currentModelData: SINGAPORE_MODEL_DATA,
    targetOrder: 2026,
    retrievedAt: "2026-07-14"
  }), /ambiguous source language/);
});

test("missing historical rebate text does not erase accepted history", () => {
  const withoutYa2024Rebate = fixture.replace(/<p>For YA 2024[\s\S]*?<\/p>/, "");
  const { primary, independent } = extracts(withoutYa2024Rebate);
  const result = evaluateSingaporeUpdate({
    primary,
    independent,
    currentObservation,
    currentModelData: SINGAPORE_MODEL_DATA,
    targetOrder: 2026,
    retrievedAt: "2026-07-14"
  });
  assert.equal(result.observation.rebates.YA2024.percentage, 50);
  assert.equal(result.status, "no-change");
});

test("model rendering is deterministic", () => {
  const first = renderSingaporeModelData(SINGAPORE_MODEL_DATA);
  const second = renderSingaporeModelData(structuredClone(SINGAPORE_MODEL_DATA));
  assert.equal(first, second);
  assert.match(first, /SINGAPORE_MODEL_DATA/);
  assert.match(first, /YA2026/);
});
