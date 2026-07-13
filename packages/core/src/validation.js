import { PROHIBITED_PII_FIELDS } from "@taxcraft/contracts";

const prohibited = new Set(PROHIBITED_PII_FIELDS);

function issue(code, path, message) {
  return { code, path, message };
}

export function validateRequest(request) {
  const issues = [];
  if (!isPlainObject(request)) {
    return [issue("request.invalid", "$", "Request must be an object.")];
  }

  const allowed = new Set(["jurisdiction", "taxYear", "facts"]);
  for (const key of Object.keys(request)) {
    if (!allowed.has(key)) issues.push(issue("request.unknown-field", `$.${key}`, "Field is not supported."));
  }

  if (typeof request.jurisdiction !== "string" || !/^[A-Z]{2}$/.test(request.jurisdiction)) {
    issues.push(issue("jurisdiction.invalid", "$.jurisdiction", "Jurisdiction must be a two-letter uppercase code."));
  }
  if (typeof request.taxYear !== "string" || request.taxYear.trim() === "") {
    issues.push(issue("tax-year.invalid", "$.taxYear", "Tax year must be a non-empty string."));
  }
  if (!isPlainObject(request.facts)) {
    issues.push(issue("facts.invalid", "$.facts", "Facts must be an object."));
  } else {
    findProhibitedFields(request.facts, "$.facts", issues);
  }
  return issues;
}

export function validatePackageOutput(output, sourceIds) {
  const issues = [];
  if (!isPlainObject(output)) return [issue("output.invalid", "$", "Country package output must be an object.")];
  if (typeof output.currency !== "string" || !/^[A-Z]{3}$/.test(output.currency)) {
    issues.push(issue("output.currency", "$.currency", "Currency must be a three-letter uppercase code."));
  }
  if (!isPlainObject(output.totals)) {
    issues.push(issue("output.totals", "$.totals", "Totals must be an object."));
  } else {
    for (const [key, value] of Object.entries(output.totals)) {
      if (!Number.isSafeInteger(value)) issues.push(issue("output.money", `$.totals.${key}`, "Money values must use integer minor units."));
    }
  }
  if (!Array.isArray(output.lines) || output.lines.length === 0) {
    issues.push(issue("output.lines", "$.lines", "At least one calculation line is required."));
  } else {
    output.lines.forEach((line, index) => {
      const path = `$.lines[${index}]`;
      if (!isPlainObject(line)) {
        issues.push(issue("output.line", path, "Calculation line must be an object."));
        return;
      }
      if (typeof line.ruleId !== "string" || line.ruleId === "") issues.push(issue("output.rule-id", `${path}.ruleId`, "Rule ID is required."));
      if (!Number.isSafeInteger(line.amountMinor)) issues.push(issue("output.money", `${path}.amountMinor`, "Money values must use integer minor units."));
      if (!Array.isArray(line.sourceIds) || line.sourceIds.length === 0) {
        issues.push(issue("output.source", `${path}.sourceIds`, "Each calculation line must cite an official source."));
      } else {
        for (const id of line.sourceIds) {
          if (!sourceIds.has(id)) issues.push(issue("output.source", `${path}.sourceIds`, "Calculation line cites an unknown source."));
        }
      }
      if ("recommendation" in line || "advice" in line) issues.push(issue("output.advisory", path, "Advisory fields are not permitted."));
    });
  }
  return issues;
}

function findProhibitedFields(value, path, issues) {
  for (const [key, nested] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const nestedPath = `${path}.${key}`;
    if (prohibited.has(normalized)) {
      issues.push(issue("facts.pii-field", nestedPath, "Identity fields are not accepted."));
    }
    if (isPlainObject(nested)) findProhibitedFields(nested, nestedPath, issues);
    if (Array.isArray(nested)) {
      nested.forEach((item, index) => {
        if (isPlainObject(item)) findProhibitedFields(item, `${nestedPath}[${index}]`, issues);
      });
    }
  }
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
