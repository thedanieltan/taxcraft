import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const UIT_MINOR = 550_000;
const BANDS = Object.freeze([
  { upperBoundMinor: 5 * UIT_MINOR, rateBasisPoints: 800 },
  { upperBoundMinor: 20 * UIT_MINOR, rateBasisPoints: 1_400 },
  { upperBoundMinor: 35 * UIT_MINOR, rateBasisPoints: 1_700 },
  { upperBoundMinor: 45 * UIT_MINOR, rateBasisPoints: 2_000 },
  { upperBoundMinor: null, rateBasisPoints: 3_000 },
]);

const DEFINITION = Object.freeze({
  code: "PE",
  name: "Peru annual work-income tax",
  currency: "PEN",
  supported: [
    "calendar-year 2026 annual tax on caller-confirmed net work and qualifying foreign-source taxable income",
    "8%, 14%, 17%, 20% and 30% cumulative progressive rates",
    "2026 UIT value of PEN 5,500",
  ],
  unsupported: [
    "gross fourth-category or fifth-category income derivation",
    "20% professional-income deduction, seven-UIT deduction and additional three-UIT expense deduction",
    "capital-income, securities, real-estate and business-income schedules",
    "foreign-source income classification and loss-netting determinations",
    "withholding, payments on account and annual return reconciliation",
    "foreign-tax credit, treaty relief, prior payments, penalties, interest and refunds",
    "domicile, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied net taxable work and qualifying foreign-source income after all applicable deductions.",
    "The amount is governed by the cumulative work-income scale and not a capital or business schedule.",
    "The 2026 UIT is PEN 5,500.",
  ],
  sources: [
    {
      sourceId: "pe.sunat.work-income-rates",
      publisher: "National Superintendency of Customs and Tax Administration",
      publisherType: "tax-authority",
      title: "Annual work-income tax rates",
      url: "https://personas.sunat.gob.pe/trabajador-dependiente/declaracion-pago",
      jurisdiction: "PE",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "pe.sunat.uit-2026",
      publisher: "National Superintendency of Customs and Tax Administration",
      publisherType: "tax-authority",
      title: "Tax Unit value for 2026",
      url: "https://www.sunat.gob.pe/indicestasas/uit.html",
      jurisdiction: "PE",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "pe.gob.work-income-calculation",
      publisher: "Government of Peru — SUNAT",
      publisherType: "government-agency",
      title: "Calculate fifth-category income tax",
      url: "https://www.gob.pe/institucion/sunat/pages/7319-calcular-el-impuesto-a-la-renta-de-quinta-categoria",
      jurisdiction: "PE",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const peruPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `pe-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["net-work-and-qualifying-foreign-income"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "netTaxableWorkIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Peru work-income scope",
            description: "The caller confirms the supplied amount is net taxable work and qualifying foreign-source income under the cumulative annual scale.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          netTaxableWorkIncomeMinor: {
            type: "integer",
            title: "Net taxable work income",
            description: "Caller-confirmed net taxable work and qualifying foreign-source income in soles after applicable deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "PEN",
          },
        },
      },
      rounding: [{ stage: "annual-work-income-tax", mode: "half-up", unitMinor: 1 }],
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
      const result = calculateProgressiveBands({
        taxableMinor: facts.netTaxableWorkIncomeMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `pe.pit.${TAX_YEAR}.work-income-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} net work-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `pe.pit.${TAX_YEAR}.zero-income`,
          label: "Income tax on zero net taxable work income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          netTaxableWorkIncomeMinor: facts.netTaxableWorkIncomeMinor,
          uitMinor: UIT_MINOR,
          firstThresholdMinor: 5 * UIT_MINOR,
          secondThresholdMinor: 20 * UIT_MINOR,
          thirdThresholdMinor: 35 * UIT_MINOR,
          fourthThresholdMinor: 45 * UIT_MINOR,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
