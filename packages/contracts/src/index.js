/**
 * Public identifiers are strings so external packages can implement the
 * contract without importing TaxCraft internals.
 */
export const CONTRACT_VERSION = "taxcraft.contracts.v1";

export const CALCULATION_STATUS = Object.freeze({
  OK: "ok",
  UNSUPPORTED: "unsupported",
  INVALID: "invalid",
});

export const MODEL_STATUS = Object.freeze({
  CANDIDATE: "candidate",
  CURRENT: "current",
  HISTORICAL_SUPPORTED: "historical-supported",
  RETIRED: "retired",
  WITHDRAWN: "withdrawn",
});
