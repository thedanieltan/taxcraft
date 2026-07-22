import {
  ROUNDING_MODE,
  applyBasisPoints,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2025";
const BRACKETS = Object.freeze([
  { upperExclusiveMinor: 2_846_721, rateBasisPoints: 0, deductionMinor: 0 },
  { upperExclusiveMinor: 3_391_981, rateBasisPoints: 750, deductionMinor: 213_504 },
  { upperExclusiveMinor: 4_501_261, rateBasisPoints: 1_500, deductionMinor: 467_903 },
  { upperExclusiveMinor: 5_597_617, rateBasisPoints: 2_250, deductionMinor: 805_497 },
  { upperExclusiveMinor: null, rateBasisPoints: 2_750, deductionMinor: 1_085_378 },
]);

const DEFINITION = Object.freeze({
  code: "BR",
  name: "Brazil annual individual income tax",
  currency: "BRL",
  supported: [
    "exercise 2026 annual-adjustment tariff for calendar-year 2025",
    "official 0%, 7.5%, 15%, 22.5% and 27.5% annual incidence table",
    "official deduction amount for each annual tax-base band",
  ],
  unsupported: [
    "gross-income, exempt-income, social-security, dependant, education, medical, alimony and other deduction derivation",
    "annual simplified-discount election and its BRL 16,754.34 limit",
    "dependant and education deduction eligibility",
    "monthly withholding, payroll reconciliation and tax paid during the year",
    "capital income, fixed-income investments, funds, equities, profit sharing, prizes and foreign remittances",
    "tax credits, foreign-tax relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied the calendar-year 2025 annual tax base after all legally applicable deductions.",
    "The ordinary annual-adjustment table applies and the result is tax before credits and prior payments.",
    "The official rate-and-deduction formula is applied directly for the selected band.",
  ],
  sources: [
    {
      sourceId: "br.rfb.irpf-annual-table-2025",
      publisher: "Federal Revenue Service of Brazil",
      publisherType: "tax-authority",
      title: "Taxation of 2025 — annual incidence from exercise 2026",
      url: "https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas/2025",
      jurisdiction: "BR",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "br.rfb.irpf-tables-index",
      publisher: "Federal Revenue Service of Brazil",
      publisherType: "tax-authority",
      title: "Individual income-tax tables",
      url: "https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/tabelas",
      jurisdiction: "BR",
      retrievedAt: "2026-07-22",
    },
    {
      sourceId: "br.rfb.calendar-year-and-exercise",
      publisher: "Federal Revenue Service of Brazil",
      publisherType: "tax-authority",
      title: "Calendar year and filing exercise",
      url: "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/perguntas-frequentes/imposto-de-renda/dirpf/declaracao/exercicio",
      jurisdiction: "BR",
      retrievedAt: "2026-07-22",
    },
  ],
});

export const brazilPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `br-${TAX_YEAR}-v1`,
      status: "current",
      order: 2025,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["annual-adjustment-tax-base-before-credits"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "annualTaxBaseMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Brazil annual-adjustment scope",
            description: "The caller confirms the amount is the calendar-year 2025 annual tax base after applicable deductions.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          annualTaxBaseMinor: {
            type: "integer",
            title: "Annual tax base",
            description: "Caller-confirmed calendar-year 2025 annual tax base in Brazilian reais after legally applicable deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "BRL",
          },
        },
      },
      rounding: [{ stage: "annual-adjustment-tariff-tax", mode: "half-up", unitMinor: 1 }],
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
      const bracketIndex = BRACKETS.findIndex(({ upperExclusiveMinor }) => upperExclusiveMinor === null || facts.annualTaxBaseMinor < upperExclusiveMinor);
      const bracket = BRACKETS[bracketIndex];
      const rateTaxMinor = applyBasisPoints(facts.annualTaxBaseMinor, bracket.rateBasisPoints, ROUNDING_MODE.HALF_UP);
      const incomeTaxMinor = Math.max(0, rateTaxMinor - bracket.deductionMinor);
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);

      return {
        currency: DEFINITION.currency,
        totals: {
          annualTaxBaseMinor: facts.annualTaxBaseMinor,
          bracketIndex,
          ...(bracket.upperExclusiveMinor === null ? {} : { bracketUpperInclusiveMinor: bracket.upperExclusiveMinor - 1 }),
          rateTaxMinor,
          deductionMinor: bracket.deductionMinor,
          incomeTaxMinor,
        },
        lines: [{
          ruleId: `br.pit.${TAX_YEAR}.annual-adjustment-bracket-${bracketIndex + 1}`,
          label: `${formatRate(bracket.rateBasisPoints)} annual rate less official deduction`,
          amountMinor: incomeTaxMinor,
          sourceIds,
        }],
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
