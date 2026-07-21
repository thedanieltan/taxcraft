import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";
const NATIONAL_BANDS = Object.freeze([
  [14_000_000, 600],
  [50_000_000, 1_500],
  [88_000_000, 2_400],
  [150_000_000, 3_500],
  [300_000_000, 3_800],
  [500_000_000, 4_000],
  [1_000_000_000, 4_200],
  [null, 4_500],
]);
const STANDARD_LOCAL_BANDS = Object.freeze([
  [14_000_000, 60],
  [50_000_000, 150],
  [88_000_000, 240],
  [150_000_000, 350],
  [300_000_000, 380],
  [500_000_000, 400],
  [1_000_000_000, 420],
  [null, 450],
]);

const DEFINITION = Object.freeze({
  code: "KR",
  name: "South Korea resident global income tax",
  currency: "KRW",
  supported: [
    "calendar-year 2026 national income tax on caller-confirmed resident global-income tax base",
    "6%, 15%, 24%, 35%, 38%, 40%, 42% and 45% national statutory bands",
    "standard personal local income tax under the corresponding 0.6% through 4.5% bands",
    "separate national, standard-local and combined tax totals",
  ],
  unsupported: [
    "gross-income, necessary-expense, deduction and global-income tax-base derivation",
    "tax credits, exemptions, reductions, minimum tax and special tax treatment",
    "local-government ordinance variations from the standard local rates",
    "employment withholding, year-end settlement, interim payments and return reconciliation",
    "retirement, capital gains, interest, dividends, pensions and category-specific schedules",
    "non-resident, foreign-worker flat-rate, treaty and foreign-tax-credit treatment",
    "prior payments, penalties, interest and refunds",
  ],
  assumptions: [
    "The caller supplied the resident global-income tax base after all legally applicable expenses and deductions.",
    "The standard personal local income-tax rates apply; no local ordinance adjustment is included.",
    "Only calculated national and standard local tax before credits, reductions and prior payments is returned.",
  ],
  sources: [
    {
      sourceId: "kr.law.income-tax-act-article-55-2026",
      publisher: "Korea National Law Information Center",
      publisherType: "legislation",
      title: "Income Tax Act, Article 55 — Tax Rates",
      url: "https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1019372661",
      jurisdiction: "KR",
      retrievedAt: "2026-07-21",
    },
    {
      sourceId: "kr.law.local-tax-act-article-92-2026",
      publisher: "Korea National Law Information Center",
      publisherType: "legislation",
      title: "Local Tax Act, Article 92 — Tax Rates",
      url: "https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=1000226016",
      jurisdiction: "KR",
      retrievedAt: "2026-07-21",
    },
  ],
});

export const southKoreaPackage = definePitCountryPackage({
  manifest: {
    jurisdiction: DEFINITION.code,
    name: DEFINITION.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `kr-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [DEFINITION.currency],
      incomeSchedules: ["resident-global-income-tax-base"],
      taxLayers: {
        national: true,
        subnational: false,
        local: true,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", "standardLocalRateConfirmed", "globalIncomeTaxBaseMinor"],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: "Confirmed South Korea resident global-income scope",
            description: "The caller confirms the supplied amount is the resident global-income tax base governed by Article 55.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          standardLocalRateConfirmed: {
            type: "boolean",
            title: "Confirmed standard local rate",
            description: "The caller confirms that the standard Article 92 personal local income-tax rates apply without an ordinance adjustment.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          globalIncomeTaxBaseMinor: {
            type: "integer",
            title: "Annual global-income tax base",
            description: "Caller-confirmed resident global-income tax base in Korean won after applicable expenses and deductions.",
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": "KRW",
          },
        },
      },
      rounding: [
        { stage: "national-income-tax", mode: "half-up", unitMinor: 1 },
        { stage: "standard-local-income-tax", mode: "half-up", unitMinor: 1 },
      ],
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
      const national = calculateProgressiveBands({
        taxableMinor: facts.globalIncomeTaxBaseMinor,
        bands: toBands(NATIONAL_BANDS),
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const local = calculateProgressiveBands({
        taxableMinor: facts.globalIncomeTaxBaseMinor,
        bands: toBands(STANDARD_LOCAL_BANDS),
        rounding: ROUNDING_MODE.HALF_UP,
      });
      const nationalSourceIds = ["kr.law.income-tax-act-article-55-2026"];
      const localSourceIds = ["kr.law.local-tax-act-article-92-2026"];
      const lines = [
        ...national.bands.map((band) => ({
          ruleId: `kr.pit.${TAX_YEAR}.national-band-${band.index + 1}`,
          label: `${formatRate(band.rateBasisPoints)} national global-income band`,
          amountMinor: band.taxMinor,
          sourceIds: nationalSourceIds,
        })),
        ...local.bands.map((band) => ({
          ruleId: `kr.pit.${TAX_YEAR}.standard-local-band-${band.index + 1}`,
          label: `${formatRate(band.rateBasisPoints)} standard local global-income band`,
          amountMinor: band.taxMinor,
          sourceIds: localSourceIds,
        })),
      ];
      if (lines.length === 0) {
        lines.push({
          ruleId: `kr.pit.${TAX_YEAR}.zero-income`,
          label: "National and standard local tax on zero tax base",
          amountMinor: 0,
          sourceIds: [...nationalSourceIds, ...localSourceIds],
        });
      }
      return {
        currency: DEFINITION.currency,
        totals: {
          globalIncomeTaxBaseMinor: facts.globalIncomeTaxBaseMinor,
          nationalIncomeTaxMinor: national.taxMinor,
          standardLocalIncomeTaxMinor: local.taxMinor,
          combinedIncomeTaxMinor: safeAdd(national.taxMinor, local.taxMinor),
        },
        lines,
        assumptions: [...DEFINITION.assumptions],
        coverage: coverage(),
      };
    },
  };
}

function toBands(entries) {
  return entries.map(([upperBoundMinor, rateBasisPoints]) => ({ upperBoundMinor, rateBasisPoints }));
}

function safeAdd(left, right) {
  const result = left + right;
  if (!Number.isSafeInteger(result)) throw new Error("South Korea combined income tax exceeds safe integer output.");
  return result;
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
