import {
  ROUNDING_MODE,
  definePitCountryPackage,
  roundRatio,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const FILING_SCHEDULES = Object.freeze(["single", "joint"]);
const TERRITORY_SCHEDULES = Object.freeze([
  "metropolitan",
  "guadeloupe-martinique-reunion",
  "guyane-mayotte",
]);
const STANDARD_QUOTIENT_CAP_PER_HALF_PART_MINOR = 180_700;

const DEFINITION = Object.freeze({
  code: "FR",
  name: "France household quotient income tax",
  currency: "EUR",
  supported: [
    "2026 assessment of 2025 income under Article 197",
    "single and joint assessment using caller-confirmed half-part quotient counts",
    "0%, 11%, 30%, 41% and 45% scale per quotient part",
    "general EUR 1,807 quotient-family cap per additional half-part",
    "30% Guadeloupe, Martinique and Reunion reduction capped at EUR 2,450",
    "40% Guyane and Mayotte reduction capped at EUR 4,050",
    "single and joint decote formulas after territorial reduction",
    "statutory whole-euro rounding of taxable income, gross tax, territorial reduction and decote",
  ],
  unsupported: [
    "gross-income, category-income, expense, deduction and taxable-income derivation",
    "quarter-parts for shared custody and all special quotient-family caps or supplementary reductions",
    "single-parent, veteran, invalidity, widow, attached-adult and other special half-part eligibility",
    "tax reductions, tax credits, exceptional high-income contribution and differential high-income contribution",
    "investment, capital, property, foreign-source and other separate or proportional-rate income",
    "social contributions, withholding at source, advance payments and assessment reconciliation",
    "non-resident minimum rates and worldwide-income effective-rate elections",
    "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, filing-status, quotient-part and territorial-eligibility determinations",
  ],
  assumptions: [
    "The caller supplied taxable income after all legally applicable deductions and allowances.",
    "The caller supplied a legally applicable number of whole half-parts and confirmed that only the general quotient-family cap applies.",
    "The selected filing and territorial schedules are legally applicable and no special quotient cap or supplementary reduction applies.",
    "The result is income tax after the standard quotient cap, territorial reduction and decote but before other reductions, credits, contributions, withholding and prior payments.",
  ],
  sources: [
    {
      sourceId: "fr.legifrance.cgi-article-197-2026",
      publisher: "French Republic — Legifrance",
      publisherType: "legislation",
      title: "General Tax Code Article 197 — version effective from 21 February 2026",
      url: "https://www.legifrance.gouv.fr/codes/id/LEGIARTI000006303121/2026-03-14",
      jurisdiction: "FR",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "fr.bofip.quotient-cap-2026",
      publisher: "French Directorate General of Public Finances",
      publisherType: "tax-authority",
      title: "2026 quotient-family cap guidance",
      url: "https://bofip.impots.gouv.fr/bofip/2494-PGP.html/identifiant%3DBOI-IR-LIQ-20-20-20-20260407",
      jurisdiction: "FR",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "fr.bofip.tax-rounding-2026",
      publisher: "French Directorate General of Public Finances",
      publisherType: "tax-authority",
      title: "Income tax base and gross-tax rounding rules",
      url: "https://bofip.impots.gouv.fr/bofip/2781-PGP.html/identifiant%3DBOI-IR-LIQ-10-20260217",
      jurisdiction: "FR",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const francePackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `fr-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "household-or-filing-status",
      taxYearBasis: "year-of-assessment",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["article-197-household-quotient"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: [
          "scopeConfirmed",
          "filingSchedule",
          "territorySchedule",
          "standardQuotientCapConfirmed",
          "quotientHalfParts",
          "taxableIncomeMinor",
        ],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed France Article 197 scope",
            description: "The caller confirms that the ordinary resident Article 197 calculation applies.",
            "x-taxcraft-kind": "confirmed-status",
          },
          filingSchedule: {
            type: "string",
            enum: FILING_SCHEDULES,
            title: "Household filing schedule",
            description: "Select separate single assessment or legally available joint assessment.",
            "x-taxcraft-kind": "enum",
          },
          territorySchedule: {
            type: "string",
            enum: TERRITORY_SCHEDULES,
            title: "Tax domicile territory schedule",
            description: "Select metropolitan France, Guadeloupe/Martinique/Reunion or Guyane/Mayotte.",
            "x-taxcraft-kind": "enum",
          },
          standardQuotientCapConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed general quotient cap",
            description: "The caller confirms that every additional half-part uses only the general EUR 1,807 cap and no special quotient rule applies.",
            "x-taxcraft-kind": "confirmed-status",
          },
          quotientHalfParts: {
            type: "integer",
            minimum: 2,
            maximum: 40,
            title: "Quotient-family half-parts",
            description: "Total quotient-family parts expressed in half-parts: 2 means one part, 4 means two parts and 5 means two and a half parts.",
            "x-taxcraft-kind": "count",
          },
          taxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Household taxable income",
            description: "Caller-confirmed household taxable income in euro cents after applicable deductions and allowances.",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [
        { stage: "taxable-income", mode: "half-up", unitMinor: 100 },
        { stage: "gross-tariff-tax", mode: "half-up", unitMinor: 100 },
        { stage: "territorial-reduction", mode: "half-up", unitMinor: 100 },
        { stage: "decote", mode: "half-up", unitMinor: 100 },
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
      const baselineHalfParts = facts.filingSchedule === "joint" ? 4 : 2;
      if (facts.quotientHalfParts < baselineHalfParts) {
        return inconsistent(
          "$.quotientHalfParts",
          `The ${facts.filingSchedule} schedule requires at least ${baselineHalfParts} half-parts.`,
        );
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const roundedTaxableIncomeEuro = safeNumber(roundRatio(
        BigInt(facts.taxableIncomeMinor),
        100n,
        ROUNDING_MODE.HALF_UP,
      ));
      const roundedTaxableIncomeMinor = roundedTaxableIncomeEuro * 100;
      const baselineHalfParts = facts.filingSchedule === "joint" ? 4 : 2;
      const grossTaxWithActualPartsMinor = quotientTariffTaxMinor(
        roundedTaxableIncomeMinor,
        facts.quotientHalfParts,
      );
      const grossTaxWithBaselinePartsMinor = quotientTariffTaxMinor(
        roundedTaxableIncomeMinor,
        baselineHalfParts,
      );
      const additionalHalfParts = facts.quotientHalfParts - baselineHalfParts;
      const availableGeneralQuotientCapMinor = additionalHalfParts
        * STANDARD_QUOTIENT_CAP_PER_HALF_PART_MINOR;
      const minimumTaxAfterQuotientCapMinor = Math.max(
        0,
        grossTaxWithBaselinePartsMinor - availableGeneralQuotientCapMinor,
      );
      const taxAfterQuotientCapMinor = Math.max(
        grossTaxWithActualPartsMinor,
        minimumTaxAfterQuotientCapMinor,
      );
      const quotientCapAdjustmentMinor = taxAfterQuotientCapMinor - grossTaxWithActualPartsMinor;
      const territorialReductionMinor = calculateTerritorialReductionMinor(
        taxAfterQuotientCapMinor,
        facts.territorySchedule,
      );
      const taxAfterTerritorialReductionMinor = Math.max(
        0,
        taxAfterQuotientCapMinor - territorialReductionMinor,
      );
      const availableDecoteMinor = calculateDecoteMinor(
        taxAfterTerritorialReductionMinor,
        facts.filingSchedule,
      );
      const decoteAppliedMinor = Math.min(
        taxAfterTerritorialReductionMinor,
        availableDecoteMinor,
      );
      const incomeTaxMinor = taxAfterTerritorialReductionMinor - decoteAppliedMinor;
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = [{
        ruleId: `fr.pit.${TAX_YEAR}.${facts.filingSchedule}.article-197-tariff`,
        label: "Article 197 household quotient tariff tax",
        amountMinor: grossTaxWithActualPartsMinor,
        sourceIds,
      }];
      if (quotientCapAdjustmentMinor > 0) {
        lines.push({
          ruleId: `fr.pit.${TAX_YEAR}.general-quotient-cap`,
          label: "General quotient-family cap adjustment",
          amountMinor: quotientCapAdjustmentMinor,
          sourceIds,
        });
      }
      if (territorialReductionMinor > 0) {
        lines.push({
          ruleId: `fr.pit.${TAX_YEAR}.${facts.territorySchedule}.territorial-reduction`,
          label: "Overseas-department income-tax reduction",
          amountMinor: -territorialReductionMinor,
          sourceIds,
        });
      }
      if (decoteAppliedMinor > 0) {
        lines.push({
          ruleId: `fr.pit.${TAX_YEAR}.${facts.filingSchedule}.decote`,
          label: "Article 197 decote applied",
          amountMinor: -decoteAppliedMinor,
          sourceIds,
        });
      }

      return {
        currency: DEFINITION.currency,
        totals: {
          suppliedTaxableIncomeMinor: facts.taxableIncomeMinor,
          roundedTaxableIncomeMinor,
          quotientHalfParts: facts.quotientHalfParts,
          baselineHalfParts,
          grossTaxWithActualPartsMinor,
          grossTaxWithBaselinePartsMinor,
          availableGeneralQuotientCapMinor,
          quotientCapAdjustmentMinor,
          taxAfterQuotientCapMinor,
          territorialReductionMinor,
          taxAfterTerritorialReductionMinor,
          availableDecoteMinor,
          decoteAppliedMinor,
          incomeTaxMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function quotientTariffTaxMinor(taxableIncomeMinor, quotientHalfParts) {
  const thresholdsEuroPerPart = [11_600, 29_579, 84_577, 181_917];
  const ratesBasisPoints = [0, 1_100, 3_000, 4_100, 4_500];
  let lowerBoundMinor = 0;
  let exactTaxNumerator = 0n;

  for (let index = 0; index < ratesBasisPoints.length; index += 1) {
    const upperBoundMinor = index < thresholdsEuroPerPart.length
      ? thresholdsEuroPerPart[index] * 50 * quotientHalfParts
      : null;
    const taxableSliceMinor = upperBoundMinor === null
      ? Math.max(0, taxableIncomeMinor - lowerBoundMinor)
      : Math.max(0, Math.min(taxableIncomeMinor, upperBoundMinor) - lowerBoundMinor);
    exactTaxNumerator += BigInt(taxableSliceMinor) * BigInt(ratesBasisPoints[index]);
    if (upperBoundMinor === null || taxableIncomeMinor <= upperBoundMinor) break;
    lowerBoundMinor = upperBoundMinor;
  }

  const roundedTaxEuro = roundRatio(
    exactTaxNumerator,
    1_000_000n,
    ROUNDING_MODE.HALF_UP,
  );
  return safeNumber(roundedTaxEuro) * 100;
}

function calculateTerritorialReductionMinor(taxMinor, territorySchedule) {
  if (territorySchedule === "metropolitan") return 0;
  const rateBasisPoints = territorySchedule === "guyane-mayotte" ? 4_000 : 3_000;
  const capMinor = territorySchedule === "guyane-mayotte" ? 405_000 : 245_000;
  const reductionEuro = roundRatio(
    BigInt(taxMinor) * BigInt(rateBasisPoints),
    1_000_000n,
    ROUNDING_MODE.HALF_UP,
  );
  return Math.min(capMinor, safeNumber(reductionEuro) * 100);
}

function calculateDecoteMinor(taxMinor, filingSchedule) {
  const ceilingEuro = filingSchedule === "joint" ? 1_483 : 897;
  const taxEuro = Math.floor(taxMinor / 100);
  const numerator = BigInt(ceilingEuro * 10_000 - taxEuro * 4_525);
  if (numerator <= 0n) return 0;
  return safeNumber(roundRatio(numerator, 10_000n, ROUNDING_MODE.HALF_UP)) * 100;
}

function inconsistent(path, message) {
  return { ok: false, issues: [{ code: "facts.inconsistent", path, message }] };
}

function safeNumber(value) {
  const output = Number(value);
  if (!Number.isSafeInteger(output)) throw new Error("France income-tax output exceeds the safe integer range.");
  return output;
}

function coverage() {
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}
