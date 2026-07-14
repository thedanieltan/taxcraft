import { toText } from "./extract.js";

const SOURCE_ID = "gb-hmrc-income-tax-rates-current-and-past";

export function extractUkPrimary(html, sourceUrl) {
  const text = toText(html);
  const allowanceSection = section(text, /Allowances\s+20\d{2}\s+to\s+20\d{2}/i, /Tax rates and bands/i);
  const rateSection = section(text, /England,\s*Northern Ireland and Wales/i, /Scotland/i);
  const allowanceHeader = allowanceSection.slice(0, allowanceSection.search(/Personal Allowance\s+£/i));
  const years = extractTaxYears(allowanceHeader);
  const allowances = moneyValues(section(allowanceSection, /Personal Allowance\s+£/i, /Income limit for Personal Allowance/i));
  const taperStarts = moneyValues(section(allowanceSection, /Income limit for Personal Allowance/i, /The Personal Allowance goes down/i));
  const rateHeader = rateSection.slice(0, rateSection.search(/Starting rate for savings/i));
  const rateYears = extractTaxYears(rateHeader);
  const basicBands = moneyValues(section(rateSection, /Basic rate\s+20%/i, /Higher rate\s+40%/i));
  const higherRanges = rangeValues(section(rateSection, /Higher rate\s+40%/i, /Additional rate\s+45%/i));
  const additionalStarts = moneyValues(section(rateSection, /Additional rate\s+45%/i, /Scotland|Dividends|Historical and future rates/i));

  if (years.join("|") !== rateYears.join("|")) {
    return observation(sourceUrl, [], ["allowance and rate year columns disagree"]);
  }

  return observation(sourceUrl, years.map((taxYear, index) => yearRecord({
    taxYear,
    personalAllowancePounds: allowances[index],
    taperStartPounds: taperStarts[index],
    basicRateBandPounds: basicBands[index],
    higherRateUpperPounds: higherRanges[index]?.upper,
    additionalRateStartsAbovePounds: additionalStarts[index]
  })), findAmbiguities(text));
}

export function extractUkIndependent(html, sourceUrl) {
  const decoded = decode(html);
  const tables = [...decoded.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map((match) => parseTable(match[1]));
  const allowanceTable = tables.find((table) => table.some((row) => /Personal Allowance/i.test(row[0] ?? "")));
  const englandSection = section(decoded, /England,\s*Northern Ireland and Wales/i, /Scotland/i);
  const rateTableMatch = englandSection.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i);
  const rateTable = rateTableMatch ? parseTable(rateTableMatch[1]) : [];

  const allowanceHeader = allowanceTable?.[0] ?? [];
  const rateHeader = rateTable[0] ?? [];
  const years = allowanceHeader.slice(1).map(normalizeTaxYear).filter(Boolean);
  const rateYears = rateHeader.slice(2).map(normalizeTaxYear).filter(Boolean);
  if (!allowanceTable || !rateTable.length || years.join("|") !== rateYears.join("|")) {
    return observation(sourceUrl, [], ["official tables could not be aligned"]);
  }

  const allowanceRow = allowanceTable.find((row) => /^Personal Allowance$/i.test(row[0] ?? ""));
  const taperRow = allowanceTable.find((row) => /^Income limit for Personal Allowance$/i.test(row[0] ?? ""));
  const basicRow = rateTable.find((row) => /^Basic rate$/i.test(row[0] ?? ""));
  const higherRow = rateTable.find((row) => /^Higher rate$/i.test(row[0] ?? ""));
  const additionalRow = rateTable.find((row) => /^Additional rate$/i.test(row[0] ?? ""));

  return observation(sourceUrl, years.map((taxYear, index) => yearRecord({
    taxYear,
    personalAllowancePounds: parseMoney(allowanceRow?.[index + 1]),
    taperStartPounds: parseMoney(taperRow?.[index + 1]),
    basicRateBandPounds: parseMoney(basicRow?.[index + 2]),
    higherRateUpperPounds: parseRange(higherRow?.[index + 2])?.upper,
    additionalRateStartsAbovePounds: parseMoney(additionalRow?.[index + 2])
  })), findAmbiguities(toText(html)));
}

export function evaluateUkUpdate({
  primary,
  independent,
  currentModelData,
  retrievedAt,
  allowedHost = "www.gov.uk",
  supportWindow = 3
}) {
  assertUkObservation(primary, { allowedHost });
  assertUkObservation(independent, { allowedHost });
  if (canonicalUkObservation(primary) !== canonicalUkObservation(independent)) {
    throw new Error("UK source observation rejected: independent extractors disagree.");
  }

  const selected = [...primary.years]
    .sort((left, right) => right.order - left.order)
    .slice(0, supportWindow)
    .sort((left, right) => left.order - right.order);
  if (selected.length !== supportWindow) throw new Error("UK source does not contain the complete support window.");

  const previousByYear = new Map((currentModelData?.taxYears ?? []).map((model) => [model.taxYear, model]));
  const latestOrder = Math.max(...selected.map((year) => year.order));
  const taxYears = selected.map((year) => {
    const substantive = {
      taxYear: year.taxYear,
      order: year.order,
      personalAllowanceMinor: year.personalAllowancePounds * 100,
      allowanceTaperStartMinor: year.taperStartPounds * 100,
      allowanceZeroMinor: (year.taperStartPounds + year.personalAllowancePounds * 2) * 100,
      basicRateBandMinor: year.basicRateBandPounds * 100,
      higherRateUpperMinor: year.higherRateUpperPounds * 100,
      basicRateBasisPoints: 2_000,
      higherRateBasisPoints: 4_000,
      additionalRateBasisPoints: 4_500,
      sourceIds: [SOURCE_ID]
    };
    const previous = previousByYear.get(year.taxYear);
    return {
      ...substantive,
      modelVersion: previous
        ? sameUkModel(previous, substantive) ? previous.modelVersion : bumpPatch(previous.modelVersion)
        : "1.0.0",
      status: year.order === latestOrder ? "current" : "historical-supported"
    };
  });

  const retained = new Set(taxYears.map((model) => model.taxYear));
  const retired = (currentModelData?.taxYears ?? [])
    .filter((model) => !retained.has(model.taxYear))
    .map((model) => ({
      jurisdiction: "GB",
      taxYear: model.taxYear,
      retiredAt: retrievedAt,
      reason: "support-window-exceeded",
      lastModelVersion: model.modelVersion
    }));
  const modelData = { schemaVersion: 1, jurisdiction: "GB", taxYears };

  return {
    status: JSON.stringify(modelData) === JSON.stringify(currentModelData) ? "no-change" : "candidate",
    modelData,
    retired,
    observation: {
      ...structuredClone(primary),
      retrievedAt
    }
  };
}

export function assertUkObservation(value, { allowedHost = "www.gov.uk" } = {}) {
  const errors = validateUkObservation(value, { allowedHost });
  if (errors.length) throw new Error(`UK source observation rejected: ${errors.join("; ")}`);
}

export function validateUkObservation(value, { allowedHost = "www.gov.uk" } = {}) {
  const errors = [];
  if (value?.schemaVersion !== 1 || value?.jurisdiction !== "GB") errors.push("identity is invalid");
  try {
    const url = new URL(value?.sourceUrl);
    if (url.protocol !== "https:" || url.hostname !== allowedHost) errors.push("source URL is not allowlisted");
  } catch {
    errors.push("source URL is invalid");
  }
  if (!Array.isArray(value?.years) || value.years.length < 3) errors.push("at least three tax years are required");
  if (Array.isArray(value?.ambiguities) && value.ambiguities.length) errors.push(`ambiguous source language: ${value.ambiguities.join(", ")}`);

  const seen = new Set();
  for (const year of value?.years ?? []) {
    if (!/^20\d{2}-\d{2}$/.test(year.taxYear ?? "") || !Number.isSafeInteger(year.order)) errors.push("tax year is invalid");
    if (seen.has(year.taxYear)) errors.push(`duplicate year ${year.taxYear}`);
    seen.add(year.taxYear);
    for (const field of ["personalAllowancePounds", "taperStartPounds", "basicRateBandPounds", "higherRateUpperPounds", "additionalRateStartsAbovePounds"]) {
      if (!Number.isSafeInteger(year[field]) || year[field] <= 0) errors.push(`${year.taxYear ?? "unknown"} ${field} is invalid`);
    }
    if (year.higherRateUpperPounds !== year.additionalRateStartsAbovePounds - 1) errors.push(`${year.taxYear} rate thresholds are discontinuous`);
    if (year.basicRateBandPounds >= year.higherRateUpperPounds) errors.push(`${year.taxYear} bands are not increasing`);
  }
  return [...new Set(errors)];
}

export function canonicalUkObservation(value) {
  return JSON.stringify({
    years: [...(value?.years ?? [])].sort((left, right) => left.order - right.order)
  });
}

export function renderUkModelData(modelData) {
  return `export const UK_MODEL_DATA = Object.freeze(${JSON.stringify(modelData, null, 2)});\n\nexport const UK_RATE_SOURCE_ID = "${SOURCE_ID}";\n`;
}

export function renderUkObservation(observationValue) {
  return `${JSON.stringify(observationValue, null, 2)}\n`;
}

export function renderUkRetirements(records) {
  return `${JSON.stringify(records, null, 2)}\n`;
}

export function renderUkSources(retrievedAt) {
  return `export const UK_SOURCES = Object.freeze([\n  {\n    sourceId: "${SOURCE_ID}",\n    publisher: "HM Revenue & Customs",\n    publisherType: "tax-authority",\n    title: "Income Tax rates and allowances for current and previous tax years",\n    url: "https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past",\n    retrievedAt: "${retrievedAt}"\n  }\n]);\n`;
}

function observation(sourceUrl, years, ambiguities) {
  return {
    schemaVersion: 1,
    jurisdiction: "GB",
    sourceUrl,
    years: years.filter((year) => Object.values(year).every((value) => value !== undefined && !Number.isNaN(value))),
    ambiguities
  };
}

function yearRecord({ taxYear, personalAllowancePounds, taperStartPounds, basicRateBandPounds, higherRateUpperPounds, additionalRateStartsAbovePounds }) {
  return {
    taxYear,
    order: Number(taxYear.slice(0, 4)),
    personalAllowancePounds,
    taperStartPounds,
    basicRateBandPounds,
    higherRateUpperPounds,
    additionalRateStartsAbovePounds
  };
}

function section(value, startPattern, endPattern) {
  const start = startPattern.exec(value);
  if (!start) return "";
  const from = start.index;
  const rest = value.slice(from + start[0].length);
  const end = endPattern.exec(rest);
  return value.slice(from, end ? from + start[0].length + end.index : value.length);
}

function extractTaxYears(value) {
  return [...value.matchAll(/(20\d{2})\s+to\s+(20\d{2})/g)].map((match) => `${match[1]}-${match[2].slice(2)}`);
}

function normalizeTaxYear(value) {
  const match = /(20\d{2})\s+to\s+(20\d{2})/.exec(value ?? "");
  return match ? `${match[1]}-${match[2].slice(2)}` : null;
}

function moneyValues(value) {
  return [...value.matchAll(/(?:£|&pound;|&#163;)\s*([\d,]+)/gi)].map((match) => parseMoney(match[1]));
}

function rangeValues(value) {
  return [...value.matchAll(/(?:£|&pound;|&#163;)\s*([\d,]+)\s+to\s+(?:£|&pound;|&#163;)\s*([\d,]+)/gi)]
    .map((match) => ({ lower: parseMoney(match[1]), upper: parseMoney(match[2]) }));
}

function parseTable(value) {
  return [...value.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => clean(cell[1]))
  );
}

function parseRange(value) {
  const match = /(?:£\s*)?([\d,]+)\s+to\s+(?:£\s*)?([\d,]+)/i.exec(value ?? "");
  return match ? { lower: parseMoney(match[1]), upper: parseMoney(match[2]) } : null;
}

function parseMoney(value) {
  const match = /([\d,]+)/.exec(value ?? "");
  return match ? Number(match[1].replace(/,/g, "")) : undefined;
}

function clean(value) {
  return decode(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decode(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&pound;|&#163;/gi, "£")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function findAmbiguities(text) {
  return ["proposed", "subject to enactment", "draft rates", "consultation only"]
    .filter((term) => text.toLowerCase().includes(term));
}

function sameUkModel(previous, next) {
  const fields = [
    "taxYear", "order", "personalAllowanceMinor", "allowanceTaperStartMinor", "allowanceZeroMinor",
    "basicRateBandMinor", "higherRateUpperMinor", "basicRateBasisPoints", "higherRateBasisPoints",
    "additionalRateBasisPoints", "sourceIds"
  ];
  return JSON.stringify(Object.fromEntries(fields.map((field) => [field, previous[field]])))
    === JSON.stringify(Object.fromEntries(fields.map((field) => [field, next[field]])));
}

function bumpPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version ?? "");
  if (!match) throw new Error(`Cannot increment invalid model version ${version}.`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}
