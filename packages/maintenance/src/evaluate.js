import { planSingaporeModels } from "./lifecycle.js";
import { assertSingaporeObservation, observationsAgree } from "./validate.js";

export function evaluateSingaporeUpdate({
  primary,
  independent,
  currentObservation,
  currentModelData,
  targetOrder,
  retrievedAt,
  allowedHost = "www.iras.gov.sg",
  supportWindow = 3
}) {
  assertSingaporeObservation(primary, { allowedHost });
  assertSingaporeObservation(independent, { allowedHost });
  if (!observationsAgree(primary, independent)) {
    throw new Error("Source observation rejected: independent extractors disagree.");
  }

  const acceptedObservation = mergeAcceptedHistory({
    currentObservation,
    observed: primary,
    targetOrder,
    retrievedAt
  });
  assertSingaporeObservation(acceptedObservation, { allowedHost });

  const plan = planSingaporeModels({
    observation: acceptedObservation,
    currentModelData,
    targetOrder,
    supportWindow
  });

  return {
    status: plan.changed ? "candidate" : "no-change",
    observation: acceptedObservation,
    ...plan
  };
}

export function mergeAcceptedHistory({ currentObservation, observed, targetOrder, retrievedAt }) {
  const minimumRetainedOrder = targetOrder - 2;
  const schedules = new Map();
  for (const schedule of currentObservation?.schedules ?? []) {
    if (schedule.fromOrder <= targetOrder) schedules.set(schedule.fromOrder, structuredClone(schedule));
  }
  for (const schedule of observed.schedules ?? []) {
    if (schedule.fromOrder <= targetOrder) schedules.set(schedule.fromOrder, structuredClone(schedule));
  }

  const rebates = {};
  for (const [taxYear, rebate] of Object.entries(currentObservation?.rebates ?? {})) {
    const order = Number(taxYear.slice(2));
    if (order >= minimumRetainedOrder && order <= targetOrder) rebates[taxYear] = structuredClone(rebate);
  }
  for (const [taxYear, rebate] of Object.entries(observed.rebates ?? {})) {
    const order = Number(taxYear.slice(2));
    if (order >= minimumRetainedOrder && order <= targetOrder) rebates[taxYear] = structuredClone(rebate);
  }

  return {
    schemaVersion: 1,
    jurisdiction: "SG",
    sourceUrl: observed.sourceUrl,
    retrievedAt,
    schedules: [...schedules.values()].sort((left, right) => left.fromOrder - right.fromOrder),
    rebates,
    ambiguities: []
  };
}
