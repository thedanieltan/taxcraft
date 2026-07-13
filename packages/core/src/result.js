import { CALCULATION_STATUS, CONTRACT_VERSION, RESULT_NOTICE } from "@taxcraft/contracts";

export function invalidResult(issues) {
  return deepFreeze({
    status: CALCULATION_STATUS.INVALID,
    contractVersion: CONTRACT_VERSION,
    issues,
    notice: RESULT_NOTICE,
  });
}

export function unsupportedResult({ reasonCode, jurisdiction, taxYear, supportedTaxYears = [] }) {
  return deepFreeze({
    status: CALCULATION_STATUS.UNSUPPORTED,
    contractVersion: CONTRACT_VERSION,
    reasonCode,
    ...(jurisdiction ? { jurisdiction } : {}),
    ...(taxYear ? { taxYear } : {}),
    supportedTaxYears: [...supportedTaxYears],
    notice: RESULT_NOTICE,
  });
}

export function successResult({ jurisdiction, taxYear, modelVersion, output, sources }) {
  return deepFreeze({
    status: CALCULATION_STATUS.OK,
    contractVersion: CONTRACT_VERSION,
    jurisdiction,
    taxYear,
    modelVersion,
    currency: output.currency,
    totals: structuredClone(output.totals),
    lines: structuredClone(output.lines),
    assumptions: structuredClone(output.assumptions ?? []),
    coverage: structuredClone(output.coverage ?? {}),
    sources: structuredClone(sources),
    notice: RESULT_NOTICE,
  });
}

export function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}
