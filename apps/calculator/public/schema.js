export function createFieldModel(name, property, required = false) {
  const currency = property["x-taxcraft-currency"] ?? null;
  const kind = property["x-taxcraft-kind"];
  const scale = kind === "money-minor" ? currencyScale(currency) : 1;
  const enumValues = Array.isArray(property.enum) ? [...property.enum] : [];

  return {
    name,
    title: property.title,
    description: property.description ?? "",
    kind,
    type: property.type,
    required,
    currency,
    scale,
    control: property.type === "boolean"
      ? "checkbox"
      : enumValues.length > 0
        ? "select"
        : property.type === "integer"
          ? "number"
          : "text",
    enumValues,
    constValue: Object.hasOwn(property, "const") ? property.const : undefined,
    minimum: scaled(property.minimum, scale),
    maximum: scaled(property.maximum, scale),
    step: scaled(property.multipleOf, scale) ?? (kind === "money-minor" ? 1 / scale : property.type === "integer" ? 1 : null),
  };
}

export function parseFieldValue(model, rawValue, checked = false) {
  if (model.control === "checkbox") return checked;
  if (model.type === "integer") {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) throw new Error(`${model.title} must be a number.`);
    const scaledValue = Math.round(value * model.scale);
    if (!Number.isSafeInteger(scaledValue) || Math.abs(scaledValue / model.scale - value) > Number.EPSILON * Math.max(1, Math.abs(value))) {
      throw new Error(`${model.title} cannot be represented safely.`);
    }
    return scaledValue;
  }
  return String(rawValue);
}

export function formatFieldHint(model) {
  const parts = [];
  if (model.currency) parts.push(model.currency);
  if (model.kind === "money-minor") parts.push("amount");
  if (model.required) parts.push("required");
  return parts.join(" · ");
}

export function humanizeKey(value) {
  return String(value)
    .replace(/Minor$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

export function formatMoneyMinor(valueMinor, currency, locale = undefined) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(valueMinor / currencyScale(currency));
}

export function selectPrimaryTotal(totals = {}) {
  for (const key of ["netTaxPayableMinor", "incomeTaxMinor", "taxMinor", "totalTaxMinor"]) {
    if (Number.isSafeInteger(totals[key])) return { key, valueMinor: totals[key] };
  }
  const candidates = Object.entries(totals).filter(([key, value]) => key.endsWith("Minor") && Number.isSafeInteger(value));
  return candidates.length ? { key: candidates.at(-1)[0], valueMinor: candidates.at(-1)[1] } : null;
}

export function currencyScale(currency) {
  if (!currency) return 1;
  const digits = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  }).resolvedOptions().maximumFractionDigits;
  return 10 ** digits;
}

function scaled(value, scale) {
  return value === undefined ? null : value / scale;
}
