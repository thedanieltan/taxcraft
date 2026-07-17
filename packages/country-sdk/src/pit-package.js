import { PROHIBITED_PII_FIELDS } from "@taxcraft/contracts";
import { ROUNDING_MODE } from "./pit-primitives.js";

export const PIT_PACKAGE_CONTRACT_VERSION = "taxcraft.pit-country-package.v1";

export const PIT_TAX_UNITS = Object.freeze([
  "individual",
  "filing-status",
  "household",
  "household-or-filing-status",
]);

export const PIT_TAX_YEAR_BASES = Object.freeze([
  "calendar-year",
  "tax-year",
  "year-of-assessment",
  "income-year",
  "mixed",
]);

export const PIT_MAINTENANCE_MODES = Object.freeze([
  "automated",
  "manual",
  "hybrid",
]);

export const PIT_FACT_KINDS = Object.freeze([
  "money-minor",
  "confirmed-status",
  "enum",
  "subdivision-code",
  "count",
  "percentage-basis-points",
  "plain",
]);

const taxUnits = new Set(PIT_TAX_UNITS);
const taxYearBases = new Set(PIT_TAX_YEAR_BASES);
const maintenanceModes = new Set(PIT_MAINTENANCE_MODES);
const factKinds = new Set(PIT_FACT_KINDS);
const roundingModes = new Set(Object.values(ROUNDING_MODE));
const prohibitedPiiFields = new Set(PROHIBITED_PII_FIELDS);
const allowedPropertyKeys = new Set([
  "type",
  "title",
  "description",
  "const",
  "enum",
  "minimum",
  "maximum",
  "multipleOf",
  "x-taxcraft-kind",
  "x-taxcraft-currency",
]);

export function validatePitManifest(manifest) {
  const pit = manifest?.pit;
  if (!pit || typeof pit !== "object" || Array.isArray(pit)) {
    throw new Error("PIT country package manifest requires a pit contract.");
  }
  if (pit.contractVersion !== PIT_PACKAGE_CONTRACT_VERSION) {
    throw new Error(`Unsupported PIT package contract ${String(pit.contractVersion)}.`);
  }
  if (!taxUnits.has(pit.taxUnit)) throw new Error("PIT package taxUnit is invalid.");
  if (!taxYearBases.has(pit.taxYearBasis)) throw new Error("PIT package taxYearBasis is invalid.");

  validateCurrencies(pit.currencyCodes);
  validateStringList(pit.incomeSchedules, "incomeSchedules");
  validateTaxLayers(pit.taxLayers);
  validateFactsSchema(pit.factsSchema, new Set(pit.currencyCodes));
  validateRounding(pit.rounding);
  validateMaintenance(pit.maintenance);
  return true;
}

function validateCurrencies(currencyCodes) {
  if (!Array.isArray(currencyCodes) || currencyCodes.length === 0) {
    throw new Error("PIT package must declare at least one currency code.");
  }
  const seen = new Set();
  for (const currency of currencyCodes) {
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
      throw new Error("PIT package currency codes must use uppercase ISO-style three-letter codes.");
    }
    if (seen.has(currency)) throw new Error(`Duplicate PIT package currency ${currency}.`);
    seen.add(currency);
  }
}

function validateStringList(values, name) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`PIT package ${name} must be a non-empty array.`);
  }
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`PIT package ${name} values must be non-empty strings.`);
    }
    if (seen.has(value)) throw new Error(`Duplicate PIT package ${name} value ${value}.`);
    seen.add(value);
  }
}

function validateTaxLayers(layers) {
  if (!layers || typeof layers !== "object" || Array.isArray(layers)) {
    throw new Error("PIT package taxLayers must be an object.");
  }
  for (const field of ["national", "subnational", "local", "subdivisionRequired"]) {
    if (typeof layers[field] !== "boolean") {
      throw new Error(`PIT package taxLayers.${field} must be boolean.`);
    }
  }
  if (!layers.national && !layers.subnational && !layers.local) {
    throw new Error("PIT package must declare at least one tax layer.");
  }
  if (layers.subdivisionRequired && !layers.subnational && !layers.local) {
    throw new Error("PIT package cannot require a subdivision without a subnational or local tax layer.");
  }
}

function validateFactsSchema(schema, currencies) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error("PIT package factsSchema must be an object.");
  }
  if (schema.type !== "object" || schema.additionalProperties !== false) {
    throw new Error("PIT package factsSchema must be a closed object schema.");
  }
  if (!schema.properties || typeof schema.properties !== "object" || Array.isArray(schema.properties)) {
    throw new Error("PIT package factsSchema requires properties.");
  }
  const propertyNames = Object.keys(schema.properties);
  if (propertyNames.length === 0) throw new Error("PIT package factsSchema cannot be empty.");

  const required = schema.required ?? [];
  if (!Array.isArray(required) || new Set(required).size !== required.length) {
    throw new Error("PIT package factsSchema.required must contain unique property names.");
  }
  for (const requiredName of required) {
    if (!Object.hasOwn(schema.properties, requiredName)) {
      throw new Error(`PIT package required fact ${requiredName} is not declared.`);
    }
  }

  for (const [name, property] of Object.entries(schema.properties)) {
    if (prohibitedPiiFields.has(normalizeFieldName(name))) {
      throw new Error(`PIT package fact ${name} is prohibited identity data.`);
    }
    validateFactProperty(name, property, currencies);
  }
}

function validateFactProperty(name, property, currencies) {
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    throw new Error(`PIT package fact ${name} must be an object schema.`);
  }
  for (const key of Object.keys(property)) {
    if (!allowedPropertyKeys.has(key)) {
      throw new Error(`PIT package fact ${name} uses unsupported schema key ${key}.`);
    }
  }
  if (!["boolean", "integer", "string"].includes(property.type)) {
    throw new Error(`PIT package fact ${name} has unsupported type.`);
  }
  if (typeof property.title !== "string" || property.title.length === 0) {
    throw new Error(`PIT package fact ${name} requires a title.`);
  }
  const kind = property["x-taxcraft-kind"];
  if (!factKinds.has(kind)) throw new Error(`PIT package fact ${name} has an invalid TaxCraft kind.`);

  if (kind === "money-minor") {
    if (property.type !== "integer") throw new Error(`Money fact ${name} must use integer minor units.`);
    if (!Number.isSafeInteger(property.minimum) || property.minimum < 0) {
      throw new Error(`Money fact ${name} requires a non-negative integer minimum.`);
    }
    const currency = property["x-taxcraft-currency"];
    if (!currencies.has(currency)) throw new Error(`Money fact ${name} references undeclared currency ${String(currency)}.`);
  }
  if (kind === "count" || kind === "percentage-basis-points") {
    if (property.type !== "integer") throw new Error(`Numeric fact ${name} must use an integer type.`);
  }
  if (kind === "confirmed-status" && property.type !== "boolean") {
    throw new Error(`Confirmed-status fact ${name} must be boolean.`);
  }
  if (kind === "enum" || kind === "subdivision-code") {
    if (property.type !== "string" || !Array.isArray(property.enum) || property.enum.length === 0) {
      throw new Error(`Enumerated fact ${name} requires a non-empty string enum.`);
    }
    if (property.enum.some((value) => typeof value !== "string" || value.length === 0)) {
      throw new Error(`Enumerated fact ${name} contains an invalid option.`);
    }
  }
  if (property.minimum !== undefined && !Number.isSafeInteger(property.minimum)) {
    throw new Error(`PIT package fact ${name} minimum must be a safe integer.`);
  }
  if (property.maximum !== undefined && !Number.isSafeInteger(property.maximum)) {
    throw new Error(`PIT package fact ${name} maximum must be a safe integer.`);
  }
  if (property.multipleOf !== undefined && (!Number.isSafeInteger(property.multipleOf) || property.multipleOf <= 0)) {
    throw new Error(`PIT package fact ${name} multipleOf must be a positive safe integer.`);
  }
}

function validateRounding(rounding) {
  if (!Array.isArray(rounding) || rounding.length === 0) {
    throw new Error("PIT package must declare rounding stages.");
  }
  const stages = new Set();
  for (const entry of rounding) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("PIT package rounding entry must be an object.");
    }
    if (typeof entry.stage !== "string" || entry.stage.length === 0 || stages.has(entry.stage)) {
      throw new Error("PIT package rounding stages must be present and unique.");
    }
    stages.add(entry.stage);
    if (!roundingModes.has(entry.mode)) throw new Error(`PIT package rounding stage ${entry.stage} has an invalid mode.`);
    if (!Number.isSafeInteger(entry.unitMinor) || entry.unitMinor <= 0) {
      throw new Error(`PIT package rounding stage ${entry.stage} requires a positive minor-unit quantum.`);
    }
  }
}

function validateMaintenance(maintenance) {
  if (!maintenance || typeof maintenance !== "object" || Array.isArray(maintenance)) {
    throw new Error("PIT package maintenance must be an object.");
  }
  if (!maintenanceModes.has(maintenance.mode)) throw new Error("PIT package maintenance mode is invalid.");
  if (typeof maintenance.sourceWatch !== "boolean") {
    throw new Error("PIT package maintenance.sourceWatch must be boolean.");
  }
  if (maintenance.mode === "automated" && !maintenance.sourceWatch) {
    throw new Error("Automated PIT package maintenance requires a source watch.");
  }
  if (maintenance.mode === "manual" && maintenance.sourceWatch) {
    throw new Error("Manual PIT package maintenance cannot claim an automated source watch.");
  }
}

function normalizeFieldName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
