const BLOCK_TAGS = /<\/?(?:article|aside|div|h[1-6]|li|p|section|table|tbody|td|th|thead|tr|ul|ol|br)[^>]*>/gi;

export function extractSingaporePrimary(html, sourceUrl) {
  const normalizedHtml = decodeEntities(html);
  const text = toText(normalizedHtml);
  return {
    schemaVersion: 1,
    jurisdiction: "SG",
    sourceUrl,
    schedules: extractTableSchedules(normalizedHtml),
    rebates: extractRebatesBySentence(text),
    ambiguities: findAmbiguities(text)
  };
}

export function extractSingaporeIndependent(html, sourceUrl) {
  const text = toText(html);
  return {
    schemaVersion: 1,
    jurisdiction: "SG",
    sourceUrl,
    schedules: extractSequenceSchedules(text),
    rebates: extractRebatesByYearWindow(text),
    ambiguities: findAmbiguities(text)
  };
}

function extractTableSchedules(html) {
  const headings = [...html.matchAll(/From\s+YA\s*(\d{4})\s+onwards/gi)];
  return headings.map((heading, index) => {
    const fromOrder = Number(heading[1]);
    const end = headings[index + 1]?.index ?? html.length;
    const segment = html.slice(heading.index, end);
    const table = segment.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i)?.[1];
    if (!table) return invalidSchedule(fromOrder, "rate table not found");
    const brackets = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map((match) => [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanCell(cell[1])))
      .map(parseCells)
      .filter(Boolean);
    return schedule(fromOrder, deduplicateRows(brackets));
  });
}

function extractSequenceSchedules(text) {
  const headings = [...text.matchAll(/From\s+YA\s*(\d{4})\s+onwards/gi)];
  return headings.map((heading, index) => {
    const fromOrder = Number(heading[1]);
    const end = headings[index + 1]?.index ?? text.length;
    const segment = text.slice(heading.index, end);
    const rowPattern = /(First|Next)\s+\$([\d,]+)\s+(\d+(?:\.\d+)?)\s*(?:%|per cent)?|In\s+excess\s+of\s+\$[\d,]+\s+(\d+(?:\.\d+)?)\s*(?:%|per cent)?/gi;
    const brackets = [...segment.matchAll(rowPattern)].map((match) => {
      if (/in\s+excess/i.test(match[0])) {
        return { widthDollars: null, rateBasisPoints: percentToBasisPoints(match[4]) };
      }
      return {
        widthDollars: parseMoney(match[2]),
        rateBasisPoints: percentToBasisPoints(match[3])
      };
    });
    return schedule(fromOrder, deduplicateRows(brackets));
  });
}

function parseCells(cells) {
  if (cells.length < 2) return null;
  const label = cells[0];
  const rate = cells[1].match(/-?\d+(?:\.\d+)?/)?.[0];
  if (rate === undefined) return null;
  const firstOrNext = label.match(/^(First|Next)\s+\$([\d,]+)/i);
  if (firstOrNext) {
    return { widthDollars: parseMoney(firstOrNext[2]), rateBasisPoints: percentToBasisPoints(rate) };
  }
  if (/^In\s+excess\s+of\s+\$[\d,]+/i.test(label)) {
    return { widthDollars: null, rateBasisPoints: percentToBasisPoints(rate) };
  }
  return null;
}

function extractRebatesBySentence(text) {
  const rebates = {};
  for (const match of text.matchAll(/(?:For\s+)?YA\s*(\d{4})[\s\S]{0,260}?rebate\s+of\s+(\d+(?:\.\d+)?)%[\s\S]{0,180}?(?:cap(?:ped)?\s+at|maximum\s+of)\s+\$([\d,]+)/gi)) {
    rebates[`YA${match[1]}`] = rebate(match[2], match[3]);
  }
  return rebates;
}

function extractRebatesByYearWindow(text) {
  const rebates = {};
  const occurrences = [...text.matchAll(/YA\s*(\d{4})/gi)];
  occurrences.forEach((occurrence, index) => {
    const year = occurrence[1];
    const end = occurrences[index + 1]?.index ?? text.length;
    const window = text.slice(occurrence.index, end);
    const percentage = window.match(/(\d+(?:\.\d+)?)%\s+(?:Personal\s+Income\s+Tax\s+)?Rebate/i)?.[1]
      ?? window.match(/rebate\s+of\s+(\d+(?:\.\d+)?)%/i)?.[1];
    const cap = window.match(/(?:cap(?:ped)?\s+at|maximum\s+of)\s+\$([\d,]+)/i)?.[1];
    if (percentage && cap) rebates[`YA${year}`] = rebate(percentage, cap);
  });
  return rebates;
}

function rebate(percentage, cap) {
  return {
    percentage: Number(percentage),
    capDollars: parseMoney(cap),
    sourceId: "sg-iras-pit-rebate-ya2024-ya2025"
  };
}

function schedule(fromOrder, brackets) {
  return {
    fromOrder,
    openEnded: true,
    sourceId: `sg-iras-resident-rates-ya${fromOrder}-onwards`,
    brackets
  };
}

function invalidSchedule(fromOrder, reason) {
  return { ...schedule(fromOrder, []), extractionError: reason };
}

function findAmbiguities(text) {
  const ambiguities = [];
  for (const term of ["proposed", "subject to enactment", "draft rates", "consultation only"]) {
    if (text.toLowerCase().includes(term)) ambiguities.push(term);
  }
  return ambiguities;
}

function deduplicateRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.widthDollars}:${row.rateBasisPoints}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanCell(value) {
  return decodeEntities(value.replace(BLOCK_TAGS, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

export function toText(html) {
  return decodeEntities(html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(BLOCK_TAGS, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function parseMoney(value) {
  return Number(String(value).replace(/,/g, ""));
}

function percentToBasisPoints(value) {
  return Math.round(Number(value) * 100);
}
