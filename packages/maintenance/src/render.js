export function renderSingaporeModelData(modelData) {
  return `export const SINGAPORE_MODEL_DATA = deepFreeze(${JSON.stringify(modelData, null, 2)});\n\nfunction deepFreeze(value) {\n  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;\n  Object.freeze(value);\n  for (const nested of Object.values(value)) deepFreeze(nested);\n  return value;\n}\n`;
}

export function renderSingaporeSources(observation) {
  const rateSources = observation.schedules.map((schedule) => ({
    sourceId: schedule.sourceId,
    publisher: "Inland Revenue Authority of Singapore",
    publisherType: "tax-authority",
    title: `Individual Income Tax rates from YA ${schedule.fromOrder} onwards`,
    url: observation.sourceUrl,
    retrievedAt: observation.retrievedAt
  }));
  const rebateSourceIds = new Set(Object.values(observation.rebates).map((rebate) => rebate.sourceId));
  const rebateSources = [...rebateSourceIds].map((sourceId) => ({
    sourceId,
    publisher: "Inland Revenue Authority of Singapore",
    publisherType: "tax-authority",
    title: "Personal Income Tax Rebate",
    url: observation.sourceUrl,
    retrievedAt: observation.retrievedAt
  }));
  const fixedSources = [{
    sourceId: "sg-iras-sample-calculations-ya2026",
    publisher: "Inland Revenue Authority of Singapore",
    publisherType: "tax-authority",
    title: "Sample Income Tax calculations",
    url: "https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/sample-income-tax-calculations",
    retrievedAt: "2026-07-13"
  }];
  return `export const SINGAPORE_SOURCES = Object.freeze(${JSON.stringify([...rateSources, ...rebateSources, ...fixedSources], null, 2)});\n`;
}

export function renderObservation(observation) {
  const stored = {
    schemaVersion: observation.schemaVersion,
    jurisdiction: observation.jurisdiction,
    sourceUrl: observation.sourceUrl,
    retrievedAt: observation.retrievedAt,
    schedules: observation.schedules,
    rebates: observation.rebates
  };
  return `${JSON.stringify(stored, null, 2)}\n`;
}

export function renderRetirementRecords(records) {
  return `${JSON.stringify({ schemaVersion: 1, retirements: records }, null, 2)}\n`;
}
