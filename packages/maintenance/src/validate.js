export function validateSingaporeObservation(observation, { allowedHost = "www.iras.gov.sg" } = {}) {
  const issues = [];
  if (!observation || typeof observation !== "object") return ["observation must be an object"];
  if (observation.jurisdiction !== "SG") issues.push("jurisdiction must be SG");

  try {
    const url = new URL(observation.sourceUrl);
    if (url.protocol !== "https:") issues.push("source URL must use HTTPS");
    if (url.hostname !== allowedHost) issues.push(`source host must be ${allowedHost}`);
  } catch {
    issues.push("source URL is invalid");
  }

  if (observation.ambiguities?.length) issues.push(`ambiguous source language: ${observation.ambiguities.join(", ")}`);
  if (!Array.isArray(observation.schedules) || observation.schedules.length === 0) {
    issues.push("at least one rate schedule is required");
  } else {
    const orders = new Set();
    for (const schedule of observation.schedules) {
      if (!Number.isSafeInteger(schedule.fromOrder)) issues.push("schedule fromOrder must be an integer");
      if (orders.has(schedule.fromOrder)) issues.push(`duplicate schedule for YA${schedule.fromOrder}`);
      orders.add(schedule.fromOrder);
      if (schedule.openEnded !== true) issues.push(`YA${schedule.fromOrder} schedule must be explicitly open-ended`);
      if (!/^sg-iras-resident-rates-ya\d{4}-onwards$/.test(schedule.sourceId ?? "")) issues.push(`YA${schedule.fromOrder} source ID is invalid`);
      if (schedule.extractionError) issues.push(`YA${schedule.fromOrder}: ${schedule.extractionError}`);
      validateBrackets(schedule, issues);
    }
  }

  if (!observation.rebates || typeof observation.rebates !== "object" || Array.isArray(observation.rebates)) {
    issues.push("rebates must be an object");
  } else {
    for (const [taxYear, rebate] of Object.entries(observation.rebates)) {
      if (!/^YA\d{4}$/.test(taxYear)) issues.push(`invalid rebate tax year ${taxYear}`);
      if (!Number.isFinite(rebate.percentage) || rebate.percentage <= 0 || rebate.percentage > 100) issues.push(`${taxYear} rebate percentage is invalid`);
      if (!Number.isSafeInteger(rebate.capDollars) || rebate.capDollars <= 0) issues.push(`${taxYear} rebate cap is invalid`);
      if (typeof rebate.sourceId !== "string" || rebate.sourceId === "") issues.push(`${taxYear} rebate source is missing`);
    }
  }
  return issues;
}

export function assertSingaporeObservation(observation, options) {
  const issues = validateSingaporeObservation(observation, options);
  if (issues.length) throw new Error(`Source observation rejected: ${issues.join("; ")}`);
  return observation;
}

export function observationsAgree(primary, independent) {
  return canonicalObservation(primary) === canonicalObservation(independent);
}

export function canonicalObservation(observation) {
  return JSON.stringify({
    schemaVersion: observation.schemaVersion,
    jurisdiction: observation.jurisdiction,
    sourceUrl: observation.sourceUrl,
    schedules: [...(observation.schedules ?? [])]
      .map((schedule) => ({
        fromOrder: schedule.fromOrder,
        openEnded: schedule.openEnded,
        sourceId: schedule.sourceId,
        brackets: schedule.brackets
      }))
      .sort((left, right) => left.fromOrder - right.fromOrder),
    rebates: Object.fromEntries(Object.entries(observation.rebates ?? {}).sort(([left], [right]) => left.localeCompare(right))),
    ambiguities: [...(observation.ambiguities ?? [])].sort()
  });
}

function validateBrackets(schedule, issues) {
  if (!Array.isArray(schedule.brackets) || schedule.brackets.length < 2) {
    issues.push(`YA${schedule.fromOrder} rate table is incomplete`);
    return;
  }
  let nullWidths = 0;
  let previousRate = -1;
  schedule.brackets.forEach((bracket, index) => {
    const last = index === schedule.brackets.length - 1;
    if (bracket.widthDollars === null) {
      nullWidths += 1;
      if (!last) issues.push(`YA${schedule.fromOrder} open-ended bracket must be last`);
    } else if (!Number.isSafeInteger(bracket.widthDollars) || bracket.widthDollars <= 0) {
      issues.push(`YA${schedule.fromOrder} bracket ${index} width is invalid`);
    }
    if (!Number.isSafeInteger(bracket.rateBasisPoints) || bracket.rateBasisPoints < 0 || bracket.rateBasisPoints > 10_000) {
      issues.push(`YA${schedule.fromOrder} bracket ${index} rate is invalid`);
    }
    if (bracket.rateBasisPoints < previousRate) issues.push(`YA${schedule.fromOrder} rates are not progressive`);
    previousRate = bracket.rateBasisPoints;
  });
  if (nullWidths !== 1) issues.push(`YA${schedule.fromOrder} must have one open-ended bracket`);
  if (schedule.brackets[0]?.rateBasisPoints !== 0) issues.push(`YA${schedule.fromOrder} first bracket must be zero-rated`);
}
