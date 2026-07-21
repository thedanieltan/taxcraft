import {
  ROUNDING_MODE,
  applyTaxCredit,
  calculateProgressiveBands,
  calculateSteppedTaper,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";

const DEFINITION = Object.freeze({
  code: "GR",
  name: "Greece profile-aware annual individual income tax",
  currency: "EUR",
  supported: [
    "2026 employment and pension annual tariff",
    "2026 business-profit annual tariff before presumptive-income adjustments",
    "age and dependent-child rate variants",
    "non-refundable article 16 employment and pension tax reduction",
  ],
  unsupported: [
    "taxable-income derivation and minimum presumptive business income",
    "mixed employment, pension and business-income allocation",
    "property, investment and capital-gain schedules",
    "electronic-payment adjustments and other credits",
    "withholding, advances and return reconciliation",
    "eligibility, residence, source and filing determinations",
  ],
  assumptions: [
    "The caller selected the applicable age band, income schedule and eligible dependent-child count.",
    "The caller supplied annual taxable income after applicable deductions.",
    "The employment credit tapers by EUR 20 for each completed EUR 1,000 above EUR 12,000.",
  ],
  sources: [
    {
      sourceId: "gr.minfin.income-taxation-2026",
      publisher: "Hellenic Ministry of National Economy and Finance",
      publisherType: "finance-ministry",
      title: "Income taxation from tax year 2026",
      url: "https://minfin.gov.gr/en/tax-policy/tax-guide/income-taxation/",
      jurisdiction: "GR",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "gr.minfin.income-taxation-2026-el",
      publisher: "Hellenic Ministry of National Economy and Finance",
      publisherType: "finance-ministry",
      title: "Official Greek income-tax guide",
      url: "https://minfin.gov.gr/forologiki-politiki/forologikos-odigos/forologia-eisodimatos/",
      jurisdiction: "GR",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "gr.government.2026-income-tax-reform",
      publisher: "Hellenic Government",
      publisherType: "government-agency",
      title: "Income-tax measures effective from 2026",
      url: "https://www.government.gov.gr/foroelafrinsis-ke-metra-stirixis-tis-kinonias-ferni-to-nomoschedio-tis-deth/",
      jurisdiction: "GR",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const greecePackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{ taxYear: TAX_YEAR, modelVersion: `gr-${TAX_YEAR}-v1`, status: "current", order: 2026 }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "tax-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["employment-pension", "business-profit"],
      taxLayers: { national: true, subnational: false, local: false, subdivisionRequired: false },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "incomeSchedule", "ageSchedule", "dependentChildrenCount", "taxableIncomeMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            const: true,
            title: "Confirmed Greece ordinary tariff scope",
            "x-taxcraft-kind": "confirmed-status",
          },
          incomeSchedule: {
            type: "string",
            enum: ["employment-pension", "business-profit"],
            title: "Income schedule",
            "x-taxcraft-kind": "enum",
          },
          ageSchedule: {
            type: "string",
            enum: ["up-to-25", "26-to-30", "31-plus"],
            title: "Age schedule",
            "x-taxcraft-kind": "enum",
          },
          dependentChildrenCount: {
            type: "integer",
            minimum: 0,
            maximum: 20,
            title: "Eligible dependent children",
            "x-taxcraft-kind": "count",
          },
          taxableIncomeMinor: {
            type: "integer",
            minimum: 0,
            title: "Annual taxable income",
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [
        { stage: "annual-gross-income-tax", mode: "half-up", unitMinor: 1 },
        { stage: "article-16-tax-reduction", mode: "half-up", unitMinor: 1 },
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
      const rates = ratesForProfile(facts.ageSchedule, facts.dependentChildrenCount);
      const progressive = calculateProgressiveBands({
        taxableMinor: facts.taxableIncomeMinor,
        bands: [
          { upperBoundMinor: 1_000_000, rateBasisPoints: rates[0] },
          { upperBoundMinor: 2_000_000, rateBasisPoints: rates[1] },
          { upperBoundMinor: 3_000_000, rateBasisPoints: rates[2] },
          { upperBoundMinor: 4_000_000, rateBasisPoints: 3_400 },
          { upperBoundMinor: 6_000_000, rateBasisPoints: 3_900 },
          { upperBoundMinor: null, rateBasisPoints: 4_400 },
        ],
        rounding: ROUNDING_MODE.HALF_UP,
      });

      const initialCreditMinor = facts.incomeSchedule === "employment-pension"
        ? employmentCreditMinor(facts.dependentChildrenCount)
        : 0;
      const tapered = calculateSteppedTaper({
        baseAmountMinor: initialCreditMinor,
        measureMinor: facts.taxableIncomeMinor,
        startsAtMinor: 1_200_000,
        measureStepMinor: 100_000,
        reductionPerStepMinor: 2_000,
      });
      const credit = applyTaxCredit({
        taxMinor: progressive.taxMinor,
        creditMinor: tapered.amountMinor,
        refundable: false,
      });

      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = progressive.bands.map((band) => ({
        ruleId: `gr.pit.${TAX_YEAR}.profile-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} profile-adjusted income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (credit.appliedCreditMinor > 0) {
        lines.push({
          ruleId: `gr.pit.${TAX_YEAR}.article-16-reduction`,
          label: "Non-refundable article 16 tax reduction",
          amountMinor: -credit.appliedCreditMinor,
          sourceIds,
        });
      }
      if (lines.length === 0) {
        lines.push({
          ruleId: `gr.pit.${TAX_YEAR}.zero-income`,
          label: "Income tax on zero taxable income",
          amountMinor: 0,
          sourceIds,
        });
      }

      return {
        currency: DEFINITION.currency,
        totals: {
          taxableIncomeMinor: facts.taxableIncomeMinor,
          dependentChildrenCount: facts.dependentChildrenCount,
          firstBandRateBasisPoints: rates[0],
          secondBandRateBasisPoints: rates[1],
          thirdBandRateBasisPoints: rates[2],
          grossIncomeTaxMinor: progressive.taxMinor,
          initialArticle16CreditMinor: initialCreditMinor,
          article16TaperMinor: tapered.reductionMinor,
          article16CreditAvailableMinor: tapered.amountMinor,
          article16CreditAppliedMinor: credit.appliedCreditMinor,
          incomeTaxMinor: credit.taxAfterCreditMinor,
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function ratesForProfile(ageSchedule, children) {
  const first = children >= 4 ? 0 : 900;
  const secondByChildren = children >= 4 ? 0 : [2_000, 1_800, 1_600, 900][children];
  const third = Math.max(0, 2_600 - children * 200);
  if (ageSchedule === "up-to-25") return [0, 0, third];
  if (ageSchedule === "26-to-30") return [first, children >= 4 ? 0 : 900, third];
  return [first, secondByChildren, third];
}

function employmentCreditMinor(children) {
  const fixed = [77_700, 90_000, 112_000, 134_000, 158_000, 178_000];
  if (children <= 5) return fixed[children];
  return 178_000 + (children - 5) * 22_000;
}

function coverage() {
  return { supported: [...DEFINITION.supported], unsupported: [...DEFINITION.unsupported] };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
