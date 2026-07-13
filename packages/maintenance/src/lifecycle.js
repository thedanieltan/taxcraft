import { assertSingaporeObservation } from "./validate.js";

export function planSingaporeModels({ observation, currentModelData, targetOrder, supportWindow = 3, retiredAt = `${targetOrder}-01-01` }) {
  assertSingaporeObservation(observation);
  if (!Number.isSafeInteger(targetOrder) || targetOrder < 2000) throw new Error("Target assessment year is invalid.");
  if (!Number.isSafeInteger(supportWindow) || supportWindow < 1) throw new Error("Support window is invalid.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(retiredAt)) throw new Error("Retirement date is invalid.");

  const currentByYear = new Map((currentModelData?.taxYears ?? []).map((model) => [model.taxYear, model]));
  const desiredOrders = Array.from({ length: supportWindow }, (_, index) => targetOrder - supportWindow + index + 1);
  const taxYears = desiredOrders.map((order) => {
    const taxYear = `YA${order}`;
    const schedule = applicableSchedule(observation.schedules, order);
    if (!schedule) throw new Error(`No accepted official rate schedule applies to ${taxYear}.`);
    const rebate = observation.rebates[taxYear] ?? null;
    const substantive = {
      taxYear,
      order,
      rateSourceId: schedule.sourceId,
      brackets: schedule.brackets.map((bracket) => ({
        widthMinor: bracket.widthDollars === null ? null : bracket.widthDollars * 100,
        rateBasisPoints: bracket.rateBasisPoints
      })),
      rebate: rebate
        ? {
            percentage: rebate.percentage,
            capMinor: rebate.capDollars * 100,
            sourceId: rebate.sourceId
          }
        : null
    };
    const previous = currentByYear.get(taxYear);
    const modelVersion = previous
      ? sameSubstantiveModel(previous, substantive) ? previous.modelVersion : bumpPatch(previous.modelVersion)
      : "1.0.0";
    return {
      ...substantive,
      modelVersion,
      status: order === targetOrder ? "current" : "historical-supported"
    };
  });

  const retained = new Set(taxYears.map((model) => model.taxYear));
  const retired = (currentModelData?.taxYears ?? [])
    .filter((model) => !retained.has(model.taxYear))
    .map((model) => ({
      jurisdiction: "SG",
      taxYear: model.taxYear,
      retiredAt,
      reason: "support-window-exceeded",
      lastModelVersion: model.modelVersion
    }));

  const modelData = { schemaVersion: 1, jurisdiction: "SG", taxYears };
  return {
    modelData,
    retired,
    changed: JSON.stringify(modelData) !== JSON.stringify(currentModelData)
  };
}

export function applicableSchedule(schedules, order) {
  return [...schedules]
    .filter((schedule) => schedule.fromOrder <= order && schedule.openEnded === true)
    .sort((left, right) => right.fromOrder - left.fromOrder)[0] ?? null;
}

function sameSubstantiveModel(previous, next) {
  return JSON.stringify({
    taxYear: previous.taxYear,
    order: previous.order,
    rateSourceId: previous.rateSourceId,
    brackets: previous.brackets,
    rebate: previous.rebate ?? null
  }) === JSON.stringify(next);
}

function bumpPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? "");
  if (!match) throw new Error(`Cannot increment invalid model version ${version}.`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}
