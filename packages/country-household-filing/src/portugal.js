import {
  ROUNDING_MODE,
  applyBasisPoints,
  definePitCountryPackage,
  roundRatio,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BASE_BANDS = Object.freeze([
  [834_200, 1_250],
  [1_258_700, 1_570],
  [1_783_800, 2_120],
  [2_308_900, 2_410],
  [2_939_700, 3_110],
  [4_309_000, 3_490],
  [4_656_600, 4_310],
  [8_663_400, 4_460],
  [null, 4_800],
]);
const FILING_SCHEDULES = Object.freeze(["separate", "joint"]);

const DEFINITION = Object.freeze({
  code: "PT",
  name: "Portugal annual separate and joint IRS",
  currency: "EUR",
  supported: [
    "calendar-year 2026 general IRS rates under article 68",
    "separate individual assessment",
    "joint assessment using the article 69 divisor of two",
    "additional solidarity rate under article 68-A",
  ],
  unsupported: [
    "gross-income, category aggregation, deduction, loss and taxable-income derivation",
    "minimum-existence calculation and employment or pension protections",
    "dependent, ascendant, household-expense and other collection deductions",
    "special, autonomous, withholding and final-rate income schedules",
    "non-resident, habitual-resident and other special regimes",
    "withholding, payments on account, prior payments and return reconciliation",
    "foreign-tax credit, treaty relief, penalties, interest and refunds",
    "legal eligibility for joint assessment, residence, source, classification and filing obligations",
  ],
  assumptions: [
    "The caller supplied annual taxable income after legally applicable category deductions and loss offsets.",
    "For joint assessment, the supplied amount is the combined household taxable income and the statutory divisor is two.",
    "The result is before collection deductions, withholding and prior payments.",
  ],
  sources: [
    {
      sourceId: "pt.at.cirs-article-68-2026",
      publisher: "Portuguese Tax and Customs Authority",
      publisherType: "tax-authority",
      title: "Personal Income Tax Code article 68 — 2026 general rates",
      url: "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx",
      jurisdiction: "PT",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "pt.at.cirs-article-69-joint-quotient",
      publisher: "Portuguese Tax and Customs Authority",
      publisherType: "legislation",
      title: "Personal Income Tax Code article 69 — joint-assessment quotient",
      url: "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs69.aspx",
      jurisdiction: "PT",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "pt.at.cirs-article-68a-solidarity",
      publisher: "Portuguese Tax and Customs Authority",
      publisherType: "legislation",
      title: "Personal Income Tax Code article 68-A — additional solidarity rate",
      url: "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68a.aspx",
      jurisdiction: "PT",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const portugalPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `pt-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
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
            title: "Confirmed Portugal ordinary IRS scope",
            "x-taxcraft-kind": "confirmed-status",
          },
          filingSchedule: {
            type: "string",
            enum: FILING_SCHEDULES,
            title: "Filing schedule",
            "x-taxcraft-kind": "enum",
          },
          taxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Annual taxable income",
            description: "Individual taxable income for separate assessment or combined household taxable income for joint assessment.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [
        { stage: "general-irs-tax", mode: "half-up", unitMinor: 1 },
        { stage: "additional-solidarity-rate", mode: "half-up", unitMinor: 1 },
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
      const multiplier = facts.filingSchedule === "joint" ? 2 : 1;
      const bands = BASE_BANDS.map(([upperBoundMinor, rateBasisPoints]) => ({
        upperBoundMinor: upperBoundMinor === null ? null : upperBoundMinor * multiplier,
        rateBasisPoints,
      }));
      const general = calculateCumulativeBands(facts.taxableIncomeMinor, bands);
      const firstSolidarityThresholdMinor = 8_000_000 * multiplier;
      const secondSolidarityThresholdMinor = 25_000_000 * multiplier;
      const firstSolidarityBaseMinor = Math.max(
        0,
        Math.min(facts.taxableIncomeMinor, secondSolidarityThresholdMinor) - firstSolidarityThresholdMinor,
      );
      const secondSolidarityBaseMinor = Math.max(
        0,
        facts.taxableIncomeMinor - secondSolidarityThresholdMinor,
      );
      const firstSolidarityTaxMinor = applyBasisPoints(
        firstSolidarityBaseMinor,
        250,
        ROUNDING_MODE.HALF_UP,
      );
      const secondSolidarityTaxMinor = applyBasisPoints(
        secondSolidarityBaseMinor,
        500,
        ROUNDING_MODE.HALF_UP,
      );
      const solidarityTaxMinor = firstSolidarityTaxMinor + secondSolidarityTaxMinor;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = general.bands.map((band) => ({
        ruleId: `pt.pit.${TAX_YEAR}.${facts.filingSchedule}.general-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} ${facts.filingSchedule} general-rate band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (firstSolidarityTaxMinor > 0) {
        lines.push({
          ruleId: `pt.pit.${TAX_YEAR}.${facts.filingSchedule}.solidarity-2-5`,
          label: "2.5% additional solidarity rate",
          amountMinor: firstSolidarityTaxMinor,
          sourceIds,
        });
      }
      if (secondSolidarityTaxMinor > 0) {
        lines.push({
          ruleId: `pt.pit.${TAX_YEAR}.${facts.filingSchedule}.solidarity-5`,
          label: "5% additional solidarity rate",
          amountMinor: secondSolidarityTaxMinor,
          sourceIds,
        });
      }
      if (lines.length === 0) {
        lines.push({
          ruleId: `pt.pit.${TAX_YEAR}.${facts.filingSchedule}.zero-income`,
          label: "IRS on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          filingDivisor: multiplier,
          generalIncomeTaxMinor: general.taxMinor,
          firstSolidarityBaseMinor,
          secondSolidarityBaseMinor,
          solidarityTaxMinor,
          incomeTaxAndSolidarityMinor: general.taxMinor + solidarityTaxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function calculateCumulativeBands(taxableMinor, bands) {
  let previousUpper = 0;
  let cumulativeNumerator = 0n;
  let previousRoundedTax = 0;
  const appliedBands = [];

  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const upper = band.upperBoundMinor === null
      ? taxableMinor
      : Math.min(taxableMinor, band.upperBoundMinor);
    const portionMinor = Math.max(0, upper - previousUpper);
    if (portionMinor > 0) {
      cumulativeNumerator += BigInt(portionMinor) * BigInt(band.rateBasisPoints);
      const roundedCumulativeTax = roundRatio(
        cumulativeNumerator,
        10_000,
        ROUNDING_MODE.HALF_UP,
      );
      appliedBands.push({
        index,
        rateBasisPoints: band.rateBasisPoints,
        taxMinor: roundedCumulativeTax - previousRoundedTax,
      });
      previousRoundedTax = roundedCumulativeTax;
    }
    if (band.upperBoundMinor === null || taxableMinor <= band.upperBoundMinor) break;
    previousUpper = band.upperBoundMinor;
  }

  return { taxMinor: previousRoundedTax, bands: appliedBands };
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
