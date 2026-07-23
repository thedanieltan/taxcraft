import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BANDS = Object.freeze([
  { upperBoundMinor: 2_400_000, rateBasisPoints: 0 },
  { upperBoundMinor: 4_000_000, rateBasisPoints: 500 },
  { upperBoundMinor: null, rateBasisPoints: 1_000 },
]);

const DEFINITION = Object.freeze({
  code: "AD",
  name: "Andorra general-base personal income tax",
  currency: "EUR",
  supported: [
    "calendar-year 2026 resident personal income tax on caller-confirmed net general tax base",
    "EUR 24,000 exempt minimum, effective 5% band through EUR 40,000 and 10% above EUR 40,000",
    "the statutory 50% general-income tax bonus, capped at EUR 800, represented by the effective progressive schedule",
  ],
  unsupported: [
    "gross-income, expense, deduction and net general-base derivation",
    "increased personal minimums, spouse, family, disability, housing and pension-plan reductions",
    "savings tax base, including the separate EUR 3,000 exemption",
    "capital gains, special income classifications, withholding and payment mechanics",
    "social-security contributions, foreign-tax relief, treaty relief and prior payments",
    "residence, source, filing-obligation and eligibility determinations",
  ],
  assumptions: [
    "The caller supplied the net general tax base after all legally applicable reductions.",
    "The income qualifies for the general-income bonus and is not solely savings-base income.",
    "The standard EUR 24,000 personal minimum applies; increased personal minimums are excluded.",
  ],
  sources: [
    {
      sourceId: "ad.govern.irpf-effective-rates",
      publisher: "Government of Andorra",
      publisherType: "government-agency",
      title: "What percentage will I have to pay?",
      url: "https://www.govern.ad/ca/l/4191537",
      jurisdiction: "AD",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ad.govern.irpf-statutory-rate",
      publisher: "Government of Andorra",
      publisherType: "government-agency",
      title: "What is the IRPF tax rate?",
      url: "https://www.govern.ad/ca/l/4191328",
      jurisdiction: "AD",
      retrievedAt: "2026-07-23",
    },
    {
      sourceId: "ad.govern.irpf-general-income-bonus",
      publisher: "Government of Andorra",
      publisherType: "government-agency",
      title: "General-income tax bonus",
      url: "https://www.govern.ad/ca/l/4191336",
      jurisdiction: "AD",
      retrievedAt: "2026-07-23",
    },
  ],
});

export const andorraPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `ad-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["resident-net-general-tax-base"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "netGeneralTaxBaseMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Andorra general-base scope",
            description: "The caller confirms the amount is resident net general tax base eligible for the standard general-income bonus.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          netGeneralTaxBaseMinor: {
            type: "integer",
            title: "Net general tax base",
            description: "Caller-confirmed net general tax base in euro after applicable reductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [{ stage: "annual-general-base-tax", mode: "half-up", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  },
  sources: DEFINITION.sources,
  models: {
    [TAX_YEAR]: model(),
  },
});

function model() {
  return {
    coverage: coverage(),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const result = calculateProgressiveBands({
        taxableMinor: facts.netGeneralTaxBaseMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `ad.pit.${TAX_YEAR}.general-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} effective general-base band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `ad.pit.${TAX_YEAR}.zero-base`,
          label: "Income tax on zero general tax base",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          netGeneralTaxBaseMinor: facts.netGeneralTaxBaseMinor,
          exemptMinimumMinor: 2_400_000,
          bonusCapTransitionMinor: 4_000_000,
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
  return {
    supported: [...DEFINITION.supported],
    unsupported: [...DEFINITION.unsupported],
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
