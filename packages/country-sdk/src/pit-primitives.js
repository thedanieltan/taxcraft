export const ROUNDING_MODE = Object.freeze({
  FLOOR: "floor",
  CEILING: "ceiling",
  TRUNCATE: "truncate",
  HALF_UP: "half-up",
  HALF_EVEN: "half-even",
});

const ROUNDING_MODES = new Set(Object.values(ROUNDING_MODE));

export function roundRatio(numerator, denominator, rounding = ROUNDING_MODE.HALF_UP) {
  const numeratorBigInt = integerBigInt(numerator, "numerator");
  const denominatorBigInt = positiveIntegerBigInt(denominator, "denominator");
  assertRoundingMode(rounding);

  const negative = numeratorBigInt < 0n;
  const absoluteNumerator = negative ? -numeratorBigInt : numeratorBigInt;
  const quotient = absoluteNumerator / denominatorBigInt;
  const remainder = absoluteNumerator % denominatorBigInt;
  const increment = shouldIncrement({
    quotient,
    remainder,
    denominator: denominatorBigInt,
    negative,
    rounding,
  });
  const rounded = (quotient + (increment ? 1n : 0n)) * (negative ? -1n : 1n);
  return safeNumber(rounded, "rounded ratio");
}

export function applyRate({
  amountMinor,
  rateNumerator,
  rateDenominator,
  rounding = ROUNDING_MODE.HALF_UP,
}) {
  nonNegativeSafeInteger(amountMinor, "amountMinor");
  nonNegativeSafeInteger(rateNumerator, "rateNumerator");
  positiveSafeInteger(rateDenominator, "rateDenominator");
  return roundRatio(
    BigInt(amountMinor) * BigInt(rateNumerator),
    BigInt(rateDenominator),
    rounding,
  );
}

export function applyBasisPoints(amountMinor, rateBasisPoints, rounding = ROUNDING_MODE.HALF_UP) {
  return applyRate({
    amountMinor,
    rateNumerator: rateBasisPoints,
    rateDenominator: 10_000,
    rounding,
  });
}

export function calculateProgressiveBands({
  taxableMinor,
  bands,
  rounding = ROUNDING_MODE.HALF_UP,
}) {
  nonNegativeSafeInteger(taxableMinor, "taxableMinor");
  assertRoundingMode(rounding);
  if (!Array.isArray(bands) || bands.length === 0) {
    throw new Error("Progressive bands require at least one band.");
  }

  let lowerBoundMinor = 0;
  let remainingMinor = taxableMinor;
  let taxMinor = 0;
  let openEnded = false;
  const appliedBands = [];

  bands.forEach((band, index) => {
    if (!band || typeof band !== "object" || Array.isArray(band)) {
      throw new Error(`Progressive band ${index} must be an object.`);
    }
    nonNegativeSafeInteger(band.rateBasisPoints, `bands[${index}].rateBasisPoints`);
    if (band.upperBoundMinor === null) {
      if (index !== bands.length - 1) {
        throw new Error("Only the final progressive band may be open-ended.");
      }
      openEnded = true;
    } else {
      positiveSafeInteger(band.upperBoundMinor, `bands[${index}].upperBoundMinor`);
      if (band.upperBoundMinor <= lowerBoundMinor) {
        throw new Error("Progressive band upper bounds must increase strictly.");
      }
    }

    if (remainingMinor <= 0) {
      if (band.upperBoundMinor !== null) lowerBoundMinor = band.upperBoundMinor;
      return;
    }

    const widthMinor = band.upperBoundMinor === null
      ? remainingMinor
      : band.upperBoundMinor - lowerBoundMinor;
    const bandTaxableMinor = Math.min(remainingMinor, widthMinor);
    const bandTaxMinor = applyBasisPoints(
      bandTaxableMinor,
      band.rateBasisPoints,
      band.rounding ?? rounding,
    );

    appliedBands.push({
      index,
      lowerBoundMinor,
      upperBoundMinor: band.upperBoundMinor,
      taxableMinor: bandTaxableMinor,
      rateBasisPoints: band.rateBasisPoints,
      taxMinor: bandTaxMinor,
      metadata: structuredClone(band.metadata ?? null),
    });
    taxMinor = safeAdd(taxMinor, bandTaxMinor, "progressive tax total");
    remainingMinor -= bandTaxableMinor;
    if (band.upperBoundMinor !== null) lowerBoundMinor = band.upperBoundMinor;
  });

  if (remainingMinor > 0 && !openEnded) {
    throw new Error("Progressive bands do not cover the full taxable amount.");
  }

  return {
    taxableMinor,
    taxMinor,
    bands: appliedBands,
  };
}

export function calculateSteppedTaper({
  baseAmountMinor,
  measureMinor,
  startsAtMinor,
  measureStepMinor,
  reductionPerStepMinor,
}) {
  nonNegativeSafeInteger(baseAmountMinor, "baseAmountMinor");
  nonNegativeSafeInteger(measureMinor, "measureMinor");
  nonNegativeSafeInteger(startsAtMinor, "startsAtMinor");
  positiveSafeInteger(measureStepMinor, "measureStepMinor");
  positiveSafeInteger(reductionPerStepMinor, "reductionPerStepMinor");

  const excessMinor = Math.max(0, measureMinor - startsAtMinor);
  const completedSteps = Math.floor(excessMinor / measureStepMinor);
  const uncappedReduction = BigInt(completedSteps) * BigInt(reductionPerStepMinor);
  const reductionMinor = safeNumber(
    uncappedReduction > BigInt(baseAmountMinor) ? BigInt(baseAmountMinor) : uncappedReduction,
    "taper reduction",
  );

  return {
    baseAmountMinor,
    excessMinor,
    completedSteps,
    reductionMinor,
    amountMinor: baseAmountMinor - reductionMinor,
  };
}

export function applyCappedRate({
  amountMinor,
  rateBasisPoints,
  capMinor,
  rounding = ROUNDING_MODE.HALF_UP,
}) {
  nonNegativeSafeInteger(capMinor, "capMinor");
  const uncappedAmountMinor = applyBasisPoints(amountMinor, rateBasisPoints, rounding);
  const appliedAmountMinor = Math.min(uncappedAmountMinor, capMinor);
  return {
    uncappedAmountMinor,
    appliedAmountMinor,
    capMinor,
  };
}

export function applyTaxCredit({ taxMinor, creditMinor, refundable = false }) {
  nonNegativeSafeInteger(taxMinor, "taxMinor");
  nonNegativeSafeInteger(creditMinor, "creditMinor");
  if (typeof refundable !== "boolean") throw new Error("refundable must be a boolean.");

  const appliedCreditMinor = refundable ? creditMinor : Math.min(taxMinor, creditMinor);
  return {
    taxBeforeCreditMinor: taxMinor,
    availableCreditMinor: creditMinor,
    appliedCreditMinor,
    taxAfterCreditMinor: taxMinor - appliedCreditMinor,
  };
}

export function compareTaxAmounts({ primaryMinor, alternativeMinor, select = "higher" }) {
  nonNegativeSafeInteger(primaryMinor, "primaryMinor");
  nonNegativeSafeInteger(alternativeMinor, "alternativeMinor");
  if (select !== "higher" && select !== "lower") {
    throw new Error("Tax comparison select must be higher or lower.");
  }
  const useAlternative = select === "higher"
    ? alternativeMinor > primaryMinor
    : alternativeMinor < primaryMinor;
  return {
    selected: useAlternative ? "alternative" : "primary",
    selectedMinor: useAlternative ? alternativeMinor : primaryMinor,
    primaryMinor,
    alternativeMinor,
  };
}

export function sumTaxLayers(layers) {
  if (!Array.isArray(layers)) throw new Error("Tax layers must be an array.");
  let totalMinor = 0;
  const normalizedLayers = layers.map((layer, index) => {
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
      throw new Error(`Tax layer ${index} must be an object.`);
    }
    if (typeof layer.id !== "string" || layer.id.length === 0) {
      throw new Error(`Tax layer ${index} requires an id.`);
    }
    nonNegativeSafeInteger(layer.amountMinor, `layers[${index}].amountMinor`);
    totalMinor = safeAdd(totalMinor, layer.amountMinor, "tax layer total");
    return { id: layer.id, amountMinor: layer.amountMinor };
  });
  return { totalMinor, layers: normalizedLayers };
}

export function prorateAmount({
  annualAmountMinor,
  eligibleUnits,
  totalUnits,
  rounding = ROUNDING_MODE.HALF_UP,
}) {
  nonNegativeSafeInteger(annualAmountMinor, "annualAmountMinor");
  nonNegativeSafeInteger(eligibleUnits, "eligibleUnits");
  positiveSafeInteger(totalUnits, "totalUnits");
  if (eligibleUnits > totalUnits) throw new Error("eligibleUnits cannot exceed totalUnits.");
  return roundRatio(
    BigInt(annualAmountMinor) * BigInt(eligibleUnits),
    BigInt(totalUnits),
    rounding,
  );
}

export function annualizeAmount({
  periodAmountMinor,
  periodUnits,
  annualUnits,
  rounding = ROUNDING_MODE.HALF_UP,
}) {
  nonNegativeSafeInteger(periodAmountMinor, "periodAmountMinor");
  positiveSafeInteger(periodUnits, "periodUnits");
  positiveSafeInteger(annualUnits, "annualUnits");
  return roundRatio(
    BigInt(periodAmountMinor) * BigInt(annualUnits),
    BigInt(periodUnits),
    rounding,
  );
}

function shouldIncrement({ quotient, remainder, denominator, negative, rounding }) {
  if (remainder === 0n) return false;
  if (rounding === ROUNDING_MODE.TRUNCATE) return false;
  if (rounding === ROUNDING_MODE.FLOOR) return negative;
  if (rounding === ROUNDING_MODE.CEILING) return !negative;

  const doubled = remainder * 2n;
  if (doubled > denominator) return true;
  if (doubled < denominator) return false;
  if (rounding === ROUNDING_MODE.HALF_UP) return true;
  return quotient % 2n !== 0n;
}

function assertRoundingMode(rounding) {
  if (!ROUNDING_MODES.has(rounding)) {
    throw new Error(`Unsupported rounding mode ${String(rounding)}.`);
  }
}

function integerBigInt(value, name) {
  if (typeof value === "bigint") return value;
  if (!Number.isSafeInteger(value)) throw new Error(`${name} must be a safe integer or bigint.`);
  return BigInt(value);
}

function positiveIntegerBigInt(value, name) {
  const result = integerBigInt(value, name);
  if (result <= 0n) throw new Error(`${name} must be positive.`);
  return result;
}

function nonNegativeSafeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer.`);
  }
}

function positiveSafeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer.`);
  }
}

function safeAdd(left, right, name) {
  return safeNumber(BigInt(left) + BigInt(right), name);
}

function safeNumber(value, name) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || BigInt(result) !== value) {
    throw new Error(`${name} exceeds safe integer output.`);
  }
  return result;
}
