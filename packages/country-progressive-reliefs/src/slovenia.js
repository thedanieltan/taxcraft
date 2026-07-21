import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const BANDS = Object.freeze([
  { upperBoundMinor: 972_143, rateBasisPoints: 1_600 },
  { upperBoundMinor: 2_859_244, rateBasisPoints: 2_600 },
  { upperBoundMinor: 5_718_488, rateBasisPoints: 3_300 },
  { upperBoundMinor: 8_234_623, rateBasisPoints: 3_900 },
  { upperBoundMinor: null, rateBasisPoints: 5_000 },
]);

const DEFINITION = Object.freeze({
  code: "SI",
  name: "Slovenia annual individual income tax",
  currency: "EUR",
  supported: [
    "calendar-year 2026 annual income tax on caller-confirmed net annual tax base",
    "16%, 26%, 33%, 39% and 50% official annual bands",
    "official 2026 euro thresholds and fixed-transition amounts reproduced through progressive-band arithmetic",
  ],
  unsupported: [
    "gross-income, category-income and net-annual-tax-base derivation",
    "general allowance, additional general allowance and allowance phase-out calculations",
    "dependent-family-member, disability, pension, student and other personal allowances",
    "social-security contributions, payroll advances and annual assessment reconciliation",
    "capital, rental, interest, dividend, business and other final or category-specific tax schedules",
    "foreign-tax relief, treaty relief, prior payments, penalties, interest and refunds",
    "residence, source, income classification and filing-obligation determinations",
  ],
  assumptions: [
    "The caller supplied net annual tax base after all legally applicable allowances, deductions and losses.",
    "The amount is governed by the ordinary annual income-tax scale for calendar year 2026.",
    "The package calculates annual tax before credits, advance payments and annual-assessment reconciliation.",
  ],
  sources: [
    {
      sourceId: "si.official-gazette-income-tax-parameters-2026",
      publisher: "Official Gazette of the Republic of Slovenia",
      publisherType: "official-gazette",
      title: "Rules on determination of allowances and tax scale for assessment of income tax for 2026",
      url: "https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2025-01-3585/pravilnik-o-dolocitvi-usklajenih-zneskov-olajsav-enacbe-za-dolocitev-dodatne-splosne-olajsave-in-zneskov-neto-letnih-davcnih-osnov-za-odmero-dohodnine-za-leto-2026",
      jurisdiction: "SI",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "si.furs.annual-income-tax-assessment",
      publisher: "Financial Administration of the Republic of Slovenia",
      publisherType: "tax-authority",
      title: "Annual income tax assessment",
      url: "https://www.fu.gov.si/davki_in_druge_dajatve/podrocja/dohodnina/letna_odmera_dohodnine",
      jurisdiction: "SI",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "si.gov.income-tax-overview",
      publisher: "Government of the Republic of Slovenia",
      publisherType: "government-agency",
      title: "Taxes on income of natural and legal persons",
      url: "https://www.gov.si/teme/davki-od-dohodkov-fizicnih-in-pravnih-oseb/",
      jurisdiction: "SI",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const sloveniaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `si-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["net-annual-tax-base"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "netAnnualTaxBaseMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed Slovenia annual income-tax scope",
            description: "The caller confirms the supplied amount is net annual tax base governed by the ordinary 2026 scale.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          netAnnualTaxBaseMinor: {
            type: "integer",
            title: "Net annual tax base",
            description: "Caller-confirmed net annual tax base in euro after applicable allowances, deductions and losses.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "EUR",
          },
        },
      },
      rounding: [{ stage: "annual-income-tax", mode: "half-up", unitMinor: 1 }],
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
        taxableMinor: facts.netAnnualTaxBaseMinor,
        bands: BANDS,
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const sourceIds = DEFINITION.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `si.pit.${TAX_YEAR}.annual-band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual net-tax-base band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) {
        lines.push({
          ruleId: `si.pit.${TAX_YEAR}.zero-base`,
          label: "Annual income tax on zero net tax base",
          amountMinor: 0,
          sourceIds,
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          netAnnualTaxBaseMinor: facts.netAnnualTaxBaseMinor,
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
