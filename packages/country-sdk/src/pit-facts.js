export function validatePitFacts(schema, facts) {
  const issues = [];
  if (!facts || typeof facts !== "object" || Array.isArray(facts)) {
    return [{ code: "facts.invalid", path: "$.facts", message: "Facts must be an object." }];
  }

  for (const field of Object.keys(facts)) {
    if (!Object.hasOwn(schema.properties, field)) {
      issues.push({
        code: "facts.unknown-field",
        path: `$.facts.${field}`,
        message: `Fact ${field} is not declared by this PIT package.`,
      });
    }
  }

  for (const required of schema.required ?? []) {
    if (!Object.hasOwn(facts, required)) {
      issues.push({
        code: "facts.required",
        path: `$.facts.${required}`,
        message: `Required fact ${required} is missing.`,
      });
    }
  }

  for (const [field, property] of Object.entries(schema.properties)) {
    if (!Object.hasOwn(facts, field)) continue;
    const value = facts[field];
    const path = `$.facts.${field}`;
    if (!matchesType(value, property.type)) {
      issues.push({ code: "facts.type", path, message: `${field} must be ${property.type}.` });
      continue;
    }
    if (Object.hasOwn(property, "const") && !Object.is(value, property.const)) {
      issues.push({ code: "facts.const", path, message: `${field} does not match its required confirmed value.` });
    }
    if (Array.isArray(property.enum) && !property.enum.includes(value)) {
      issues.push({ code: "facts.enum", path, message: `${field} is not a supported option.` });
    }
    if (property.type === "integer") {
      if (property.minimum !== undefined && value < property.minimum) {
        issues.push({ code: "facts.minimum", path, message: `${field} is below the supported minimum.` });
      }
      if (property.maximum !== undefined && value > property.maximum) {
        issues.push({ code: "facts.maximum", path, message: `${field} exceeds the supported maximum.` });
      }
      if (property.multipleOf !== undefined && value % property.multipleOf !== 0) {
        issues.push({ code: "facts.multiple-of", path, message: `${field} must be a multiple of ${property.multipleOf}.` });
      }
    }
  }

  return issues;
}

function matchesType(value, type) {
  if (type === "integer") return Number.isSafeInteger(value);
  return typeof value === type;
}
