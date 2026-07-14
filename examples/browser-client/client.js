export function createTaxCraftBrowserClient({ baseUrl, fetchImpl = globalThis.fetch } = {}) {
  if (typeof baseUrl !== "string" || !baseUrl.startsWith("http")) {
    throw new TypeError("baseUrl must be an absolute HTTP URL.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }

  const base = baseUrl.replace(/\/+$/, "");

  return Object.freeze({
    async estimateSingapore({ taxYear, ...worksheetFacts }) {
      const worksheet = await post("/v1/worksheets/SG/chargeable-income", {
        facts: { ...worksheetFacts, eligibilityConfirmed: true }
      });
      const calculation = await post("/v1/calculate", {
        jurisdiction: "SG",
        taxYear,
        facts: {
          taxResident: true,
          chargeableIncomeMinor: worksheet.totals.chargeableIncomeMinor
        }
      });
      return { worksheet, calculation };
    }
  });

  async function post(path, body) {
    const response = await fetchImpl(`${base}${path}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.issues?.map((issue) => issue.message).join(" ") || payload.message || "TaxCraft request failed.");
    }
    return payload;
  }
}
