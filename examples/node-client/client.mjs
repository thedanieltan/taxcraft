export class TaxCraftApiError extends Error {
  constructor(message, { status, payload }) {
    super(message);
    this.name = "TaxCraftApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function createTaxCraftClient({ baseUrl, fetchImpl = globalThis.fetch } = {}) {
  if (typeof baseUrl !== "string" || !baseUrl.startsWith("http")) {
    throw new TypeError("baseUrl must be an absolute HTTP URL.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  const base = baseUrl.replace(/\/+$/, "");

  return Object.freeze({
    listJurisdictions() {
      return request("/v1/jurisdictions");
    },
    worksheetSingapore(facts) {
      return request("/v1/worksheets/SG/chargeable-income", {
        method: "POST",
        body: JSON.stringify({ facts })
      });
    },
    calculate(calculationRequest) {
      return request("/v1/calculate", {
        method: "POST",
        body: JSON.stringify(calculationRequest)
      });
    },
    async estimateSingapore({ taxYear, ...worksheetFacts }) {
      const worksheet = await this.worksheetSingapore({
        ...worksheetFacts,
        eligibilityConfirmed: true
      });
      const calculation = await this.calculate({
        jurisdiction: "SG",
        taxYear,
        facts: {
          taxResident: true,
          chargeableIncomeMinor: worksheet.totals.chargeableIncomeMinor
        }
      });
      return Object.freeze({ worksheet, calculation });
    }
  });

  async function request(path, options = {}) {
    const response = await fetchImpl(`${base}${path}`, {
      ...options,
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...options.headers
      }
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new TaxCraftApiError("TaxCraft returned a non-JSON response.", {
        status: response.status,
        payload: null
      });
    }

    if (!response.ok) {
      const detail = payload.issues?.map((issue) => issue.message).join(" ") || payload.message;
      throw new TaxCraftApiError(detail || `TaxCraft request failed with HTTP ${response.status}.`, {
        status: response.status,
        payload
      });
    }

    return payload;
  }
}
