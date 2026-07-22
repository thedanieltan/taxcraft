import { definePitCountryPackage } from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const FILING_SCHEDULES = Object.freeze(["individual", "joint"]);

const DEFINITION = Object.freeze({
  code: "DE",
  name: "Germany individual and spouse-splitting income tax",
  currency: "EUR",
  supported: [
    "assessment year 2026 ordinary income-tax tariff under section 32a(1)",
    "individual assessment",
    "joint spouse assessment using the section 32a(5) splitting procedure",
    "statutory taxable-income and final-tax rounding down to whole euro",
  ],
  unsupported: [
    "gross-income, expense, deduction, allowance and taxable-income derivation",
    "child allowance and child-benefit comparison",
    "solidarity surcharge and church tax",
    "progression-clause income and special rates under sections 32b, 32d, 34, 34a, 34b and 34c",
    "payroll withholding, wage-tax classes, prepayments and assessment reconciliation",
    "foreign-tax credit, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification, spouse eligibility and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after all legally applicable deductions and allowances.",
    "The caller selected individual or legally available joint assessment without supplying identity or relationship evidence.",
    "The result is tariff income tax before solidarity surcharge, church tax, credits, withholding and prior payments.",
  ],
  sources: [
    {
      sourceId: "de.law.estg-section-32a-2026",
      publisher: "Federal Ministry of Justice and Federal Office of Justice",
      publisherType: "legislation",
      title: "Income Tax Act section 32a — 2026 income-tax tariff",
      url: "https://www.gesetze-im-internet.de/estg/__32a.html",
      jurisdiction: "DE",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "de.bmf.lst-handbook-section-32a-2026",
      publisher: "German Federal Ministry of Finance",
      publisherType: "finance-ministry",
      title: "2026 Wage Tax Handbook — section 32a income-tax tariff",
      url: "https://esth.bundesfinanzministerium.de/lsth/2026/A-Einkommensteuergesetz/IV-Tarif-31-34b/Paragraf-32a/inhalt.html",
      jurisdiction: "DE",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "de.bmf.tax-changes-2026",
      publisher: "German Federal Ministry of Finance",
      publisherType: "finance-ministry",
      title: "The most important tax changes in 2026",
      url: "https://www.bundesfinanzministerium.de/Content/DE/Standardartikel/Themen/Steuern/das-aendert-sich-2026.html",
      jurisdiction: "DE",
      retrievedAt: "2026-07-22",
    },
  ],
});

export const germanyPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `de-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: FILING_SCHEDULES,
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "filingSchedule", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Germany ordinary tariff scope",
            description: "The caller confirms the supplied taxable income and selected assessment procedure are legally applicable.",
            "x-taxcraft-kind": "confirmed-status",
          },
          filingSchedule: {
            type: "string",
            enum: FILING_SCHEDULES,
            title: "Assessment procedure",
            description: "Select individual assessment or the legally available joint spouse-splitting procedure.",
            "x-taxcraft-kind": "enum",
          },
          taxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Annual taxable income",
            description: "Individual taxable income or combined spouse taxable income in euro cents after applicable deductions and allowances.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [
        { stage: "taxable-income", mode: "floor", unitMinor: 100 },
        { stage: "tariff-income-tax", mode: "floor", unitMinor: 100 },
      ],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: { [TAX_YEAR]: model() },
});

function model() {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const filingDivisor = facts.filingSchedule === "joint" ? 2 : 1;
      const tariffIncomeEuro = Math.floor(facts.taxableIncomeMinor / (100 * filingDivisor));
      const unitTaxEuro = calculateTariffEuro(tariffIncomeEuro);
      const incomeTaxMinor = unitTaxEuro * filingDivisor * 100;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);

      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          filingDivisor,
          tariffIncomeEuro,
          unitTaxEuro,
          incomeTaxMinor,
        },
        lines: [{
          ruleId: `de.pit.${TAX_YEAR}.${facts.filingSchedule}.section-32a-tariff`,
          label: facts.filingSchedule === "joint"
            ? "Section 32a spouse-splitting tariff income tax"
            : "Section 32a individual tariff income tax",
          amountMinor: incomeTaxMinor,
          sourceIds,
        }],
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function calculateTariffEuro(x) {
  let rawTaxEuro;
  if (x <= 12_348) {
    rawTaxEuro = 0;
  } else if (x <= 17_799) {
    const y = (x - 12_348) / 10_000;
    rawTaxEuro = (914.51 * y + 1_400) * y;
  } else if (x <= 69_878) {
    const z = (x - 17_799) / 10_000;
    rawTaxEuro = (173.10 * z + 2_397) * z + 1_034.87;
  } else if (x <= 277_825) {
    rawTaxEuro = 0.42 * x - 11_135.63;
  } else {
    rawTaxEuro = 0.45 * x - 19_470.38;
  }
  return Math.floor(rawTaxEuro);
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}
