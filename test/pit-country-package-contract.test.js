import assert from "node:assert/strict";
import test from "node:test";
import { ukPackage } from "@taxcraft/country-gb";
import { singaporePackage } from "@taxcraft/country-sg";
import {
  PIT_PACKAGE_CONTRACT_VERSION,
  validatePitManifest,
} from "@taxcraft/country-sdk";

test("maintained packages expose the standard PIT manifest contract", () => {
  assert.equal(singaporePackage.manifest.pit.contractVersion, PIT_PACKAGE_CONTRACT_VERSION);
  assert.equal(ukPackage.manifest.pit.contractVersion, PIT_PACKAGE_CONTRACT_VERSION);
  assert.equal(singaporePackage.manifest.pit.factsSchema.additionalProperties, false);
  assert.equal(ukPackage.manifest.pit.taxLayers.subdivisionRequired, true);
  assert.deepEqual(singaporePackage.manifest.pit.currencyCodes, ["SGD"]);
  assert.deepEqual(ukPackage.manifest.pit.currencyCodes, ["GBP"]);
});

test("declared fact schemas execute before country-specific validation", async () => {
  const unknown = await singaporePackage.validateFacts({
    taxYear: "YA2026",
    facts: { taxResident: true, chargeableIncomeMinor: 0, unexpected: 1 },
  });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.issues[0].code, "facts.unknown-field");

  const missing = await singaporePackage.validateFacts({
    taxYear: "YA2026",
    facts: { taxResident: true },
  });
  assert.equal(missing.ok, false);
  assert.ok(missing.issues.some(({ code }) => code === "facts.required"));

  const residency = await singaporePackage.validateFacts({
    taxYear: "YA2026",
    facts: { taxResident: false, chargeableIncomeMinor: 0 },
  });
  assert.equal(residency.ok, false);
  assert.ok(residency.issues.some(({ code }) => code === "facts.const"));
});

test("money schemas enforce integer minor units and declared increments", async () => {
  const fractionalWholeUnit = await ukPackage.validateFacts({
    taxYear: "2026-27",
    facts: {
      territory: "England",
      nonSavingsIncomeMinor: 10_001,
      adjustedNetIncomeMinor: 10_000,
    },
  });
  assert.equal(fractionalWholeUnit.ok, false);
  assert.ok(fractionalWholeUnit.issues.some(({ code }) => code === "facts.multiple-of"));
});

test("UK validation no longer imposes the obsolete arithmetic multiplication cap", async () => {
  const largestWholePoundMinor = Math.floor(Number.MAX_SAFE_INTEGER / 100) * 100;
  const result = await ukPackage.validateFacts({
    taxYear: "2026-27",
    facts: {
      territory: "England",
      nonSavingsIncomeMinor: largestWholePoundMinor,
      adjustedNetIncomeMinor: largestWholePoundMinor,
    },
  });
  assert.equal(result.ok, true);
});

test("manifest validation rejects identity data and undeclared money currencies", () => {
  const manifest = validManifest();
  manifest.pit.factsSchema.properties.emailAddress = {
    type: "string",
    title: "Email address",
    "x-taxcraft-kind": "plain",
  };
  assert.throws(() => validatePitManifest(manifest), /prohibited identity data/);

  const currencyManifest = validManifest();
  currencyManifest.pit.factsSchema.properties.taxableIncomeMinor["x-taxcraft-currency"] = "EUR";
  assert.throws(() => validatePitManifest(currencyManifest), /undeclared currency/);
});

test("manifest validation rejects contradictory tax-layer and maintenance claims", () => {
  const layers = validManifest();
  layers.pit.taxLayers = {
    national: true,
    subnational: false,
    local: false,
    subdivisionRequired: true,
  };
  assert.throws(() => validatePitManifest(layers), /cannot require a subdivision/);

  const maintenance = validManifest();
  maintenance.pit.maintenance = { mode: "automated", sourceWatch: false };
  assert.throws(() => validatePitManifest(maintenance), /requires a source watch/);
});

function validManifest() {
  return {
    pit: {
      contractVersion: PIT_PACKAGE_CONTRACT_VERSION,
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: ["USD"],
      incomeSchedules: ["aggregate"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["taxableIncomeMinor"],
        properties: {
          taxableIncomeMinor: {
            type: "integer",
            title: "Taxable income",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "USD",
          },
        },
      },
      rounding: [
        { stage: "tax", mode: "half-up", unitMinor: 1 },
      ],
      maintenance: {
        mode: "manual",
        sourceWatch: false,
      },
    },
  };
}
