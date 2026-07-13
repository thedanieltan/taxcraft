const BLOCK_TAGS = /<\/?(?:article|aside|div|h[1-6]|li|p|section|table|tbody|td|th|thead|tr|ul|ol|br)[^>]*>/gi;

export function extractSingaporePrimary(html, sourceUrl) {
  const normalizedHtml = stripNonContent(decodeEntities(html));
  const residentHtml = residentRateSection(normalizedHtml);
  const text = toText(residentHtml);
  return {
    schemaVersion: 1,
    jurisdiction: "SG",
    sourceUrl,
    schedules: extractTableSchedules(residentHtml),
    rebates: extractRebatesBySentence(text),
    ambiguities: findAmbiguities(text)
  };
}

export function extractSingaporeIndependent(html, sourceUrl) {
  const text = residentRateSection(toText(html));
  return {
    schemaVersion: 1,
    jurisdiction: "SG",
    sourceUrl,
    schedules: extractThresholdSchedules(text),
    rebates: extractRebatesByYearWindow(text),
    ambiguities: findAmbiguities(text)
  };
}

function residentRateSection(value) {
  const currentHeading = /From\s+YA\s*2024\s+onwards/i.exec(value);
  if (!currentHeading) return value;

  const beforeCurrent = value.slice(0, currentHeading.index);
  const residentHeadings = [...beforeCurrent.matchAll(/Resident\s+tax\s+rates/gi)];
  const start = residentHeadings.at(-1)?.index ?? currentHeading.index;

  const afterCurrentOffset = currentHeading.index + currentHeading[0].length;
  const afterCurrent = value.slice(afterCurrentOffset);
  const nonResidentHeading = /Non-resident\s+tax\s+rates/i.exec(afterCurrent);
  const end = nonResidentHeading
    ? afterCurrentOffset + nonResidentHeading.index
    : value.length;

  return value.slice(start, end);
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
      .flatMap((match) => {
        const cells = [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => cleanCell(cell[1]));
        return parseCombinedCells(cells);
      });
    return schedule(fromOrder, deduplicateRows(brackets));
  });
}

function extractThresholdSchedules(text) {
  const headings = [...text.matchAll(/From\s+YA\s*(\d{4})\s+onwards/gi)];
  return headings.map((heading, index) => {
    const fromOrder = Number(heading[1]);
    const nextHeading = headings[index + 1]?.index ?? text.length;
    const rawSegment = text.slice(heading.index, nextHeading);
    const boundary = rawSegment.search(/Personal\s+Income\s+Tax\s+Rebate|From\s+YA\s+\d{4}\s+to|Non-resident\s+tax\s+rates/i);
    const segment = boundary >= 0 ? rawSegment.slice(0, boundary) : rawSegment;
    const firstRows = [...segment.matchAll(/First\s+\$([\d,]+)/gi)];
    const brackets = [];

    firstRows.forEach((firstRow, rowIndex) => {
      const end = firstRows[rowIndex + 1]?.index ?? segment.length;
      const row = segment.slice(firstRow.index, end);
      const nextBand = row.match(/Next\s+\$([\d,]+)/i);
      const excessBand = row.match(/In\s+excess\s+of\s+\$[\d,]+/i);
      const secondBand = nextBand ?? excessBand;
      if (!secondBand) return;
      const afterLabel = row.slice(secondBand.index + secondBand[0].length);
      const rateMarkers = afterLabel.match(/-|\d+(?:\.\d+)?/g) ?? [];

      if (rowIndex === 0 && isNumericMarker(rateMarkers[0])) {
        brackets.push({
          widthDollars: parseMoney(firstRow[1]),
          rateBasisPoints: percentToBasisPoints(rateMarkers[0])
        });
      }

      const secondRate = rateMarkers.length >= 2 ? rateMarkers[1] : rateMarkers[0];
      if (!isNumericMarker(secondRate)) return;
      brackets.push({
        widthDollars: nextBand ? parseMoney(nextBand[1]) : null,
        rateBasisPoints: percentToBasisPoints(secondRate)
      });
    });

    return schedule(fromOrder, deduplicateRows(brackets));
  });
}

function parseCombinedCells(cells) {
  if (cells.length < 2) return [];
  const labels = parseLabels(cells[0]);
  const rateMarkers = cells[1].match(/-|\d+(?:\.\d+)?/g) ?? [];
  if (!labels.length || !rateMarkers.length) return [];

  const brackets = [];
  const alignedMarkers = rateMarkers.slice(0, labels.length);
  labels.forEach((label, index) => {
    const marker = alignedMarkers[index] ?? (labels.length === 1 ? rateMarkers.at(-1) : undefined);
    if (!isNumericMarker(marker)) return;
    brackets.push({
      widthDollars: label.kind === "excess" ? null : label.amount,
      rateBasisPoints: percentToBasisPoints(marker)
    });
  });
  return brackets;
}

function parseLabels(cell) {
  const labels = [];
  for (const match of cell.matchAll(/(First|Next)\s+\$([\d,]+)|In\s+excess\s+of\s+\$[\d,]+/gi)) {
    if (/in\s+excess/i.test(match[0])) {
      labels.push({ kind: "excess", amount: null });
    } else {
      labels.push({ kind: match[1].toLowerCase(), amount: parseMoney(match[2]) });
    }
  }
  return labels;
}

function extractRebatesBySentence(text) {
  const rebates = {};
  for (const match of text.matchAll(/(?:For\s+)?YA\s*(\d{4})[\s\S]{0,260}?rebate\s+of\s+(\d+(?:\.\d+)?)%[\s\S]{0,180}?(?:cap(?:ped)?\s+at|up\s+to\s+maximum\s+of|maximum\s+of)\s+\$([\d,]+)/gi)) {
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
    const percentage = window.match(/(\d+(?:\.\d+)?)%\s+(?:of\s+tax\s+payable|Personal\s+Income\s+Tax\s+Rebate)/i)?.[1]
      ?? window.match(/rebate\s+of\s+(\d+(?:\.\d+)?)%/i)?.[1];
    const cap = window.match(/(?:cap(?:ped)?\s+at|up\s+to\s+maximum\s+of|maximum\s+of)\s+\$([\d,]+)/i)?.[1];
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

function stripNonContent(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ");
}

export function toText(html) {
  return decodeEntities(stripNonContent(html).replace(BLOCK_TAGS, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
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

function isNumericMarker(value) {
  return typeof value === "string" && value !== "-" && /^\d+(?:\.\d+)?$/.test(value);
}

function parseMoney(value) {
  return Number(String(value).replace(/,/g, ""));
}

function percentToBasisPoints(value) {
  return Math.round(Number(value) * 100);
}
