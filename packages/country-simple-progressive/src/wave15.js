import {
  ROUNDING_MODE,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";

const TAX_YEAR = "2026";

const DEFINITIONS = Object.freeze([
  {
    code: "CN",
    name: "China resident comprehensive-income tax",
    currency: "CNY",
    incomeField: "annualTaxableComprehensiveIncomeMinor",
    incomeTitle: "Annual taxable comprehensive income",
    incomeDescription: "Caller-confirmed annual taxable comprehensive income in fen after the RMB 60,000 basic deduction and all other applicable deductions.",
    schedule: [
      { upperBoundMinor: 3_600_000, rateBasisPoints: 300 },
      { upperBoundMinor: 14_400_000, rateBasisPoints: 1_000 },
      { upperBoundMinor: 30_000_000, rateBasisPoints: 2_000 },
      { upperBoundMinor: 42_000_000, rateBasisPoints: 2_500 },
      { upperBoundMinor: 66_000_000, rateBasisPoints: 3_000 },
      { upperBoundMinor: 96_000_000, rateBasisPoints: 3_500 },
      { upperBoundMinor: null, rateBasisPoints: 4_500 },
    ],
    supported: [
      "calendar-year 2026 resident comprehensive-income tax on caller-confirmed annual taxable income",
      "seven marginal rates from 3% through 45%",
      "fen-level deterministic calculation and line-total reconciliation",
    ],
    unsupported: [
      "gross comprehensive-income aggregation and the RMB 60,000 basic-deduction calculation",
      "specific deductions, special additional deductions, charitable deductions and other deductible-item determination",
      "business-operation income, separate-category income and non-resident monthly taxation",
      "tax credits, exemptions, treaty relief, withholding, prepayments and annual reconciliation",
      "residence, domicile, source and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied annual taxable comprehensive income after the RMB 60,000 basic deduction and all legally applicable deductions.",
      "The taxpayer is a resident individual using the annual comprehensive-income schedule.",
    ],
    sources: [
      {
        sourceId: "cn.sta.individual-income-tax-law-comprehensive",
        publisher: "State Taxation Administration of China",
        publisherType: "tax-authority",
        title: "Individual Income Tax Law — comprehensive-income rates and taxable-income definition",
        url: "https://www.chinatax.gov.cn/eng/c102962/c102967/c102997/c103004/c5245849/content.html",
        jurisdiction: "CN",
        retrievedAt: "2026-07-25",
      },
      {
        sourceId: "cn.sta.annual-reconciliation-comprehensive-income",
        publisher: "State Taxation Administration of China",
        publisherType: "tax-authority",
        title: "Annual reconciliation measures for comprehensive income",
        url: "https://www.chinatax.gov.cn/eng/c102962/c102967/c102997/c103004/c5248296/content.html",
        jurisdiction: "CN",
        retrievedAt: "2026-07-25",
      },
    ],
  },
  {
    code: "TW",
    name: "Taiwan resident consolidated-income tax",
    currency: "TWD",
    incomeField: "netTaxableIncomeMinor",
    incomeTitle: "Net taxable income",
    incomeDescription: "Caller-confirmed resident net taxable income in New Taiwan dollar cents after exemptions and deductions.",
    schedule: [
      { upperBoundMinor: 61_000_000, rateBasisPoints: 500 },
      { upperBoundMinor: 138_000_000, rateBasisPoints: 1_200 },
      { upperBoundMinor: 277_000_000, rateBasisPoints: 2_000 },
      { upperBoundMinor: 519_000_000, rateBasisPoints: 3_000 },
      { upperBoundMinor: null, rateBasisPoints: 4_000 },
    ],
    supported: [
      "calendar-year 2026 resident progressive tax on caller-confirmed net taxable income",
      "five marginal rates from 5% through 40%",
      "New Taiwan dollar cent-level deterministic calculation and line-total reconciliation",
    ],
    unsupported: [
      "gross consolidated-income aggregation, exemptions, standard deduction, itemised deductions and special deductions",
      "basic living expense difference and alternative minimum tax",
      "non-resident withholding schedules, separate taxation and overseas-income determinations",
      "credits, prior payments, refunds, penalties, interest and filing administration",
      "residence, source, treaty and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied resident net taxable income after all legally applicable exemptions and deductions.",
      "The ordinary resident progressive schedule applies.",
    ],
    sources: [
      {
        sourceId: "tw.mof.progressive-tax-rate-2026",
        publisher: "Taiwan Ministry of Finance",
        publisherType: "finance-ministry",
        title: "Progressive Tax Rate System 2026",
        url: "https://www.etax.nat.gov.tw/etwmain/en/announcement/alien-individual-income-tax/progressive-tax-rate",
        jurisdiction: "TW",
        retrievedAt: "2026-07-25",
      },
    ],
  },
  {
    code: "MX",
    name: "Mexico annual individual income-tax tariff",
    currency: "MXN",
    incomeField: "annualTaxableIncomeMinor",
    incomeTitle: "Annual taxable income",
    incomeDescription: "Caller-confirmed annual taxable income in Mexican centavos governed by the 2026 Article 152 tariff.",
    supported: [
      "calendar-year 2026 annual individual income-tax tariff under Article 152",
      "eleven tariff rows from 1.92% through 35% with official fixed quotas",
      "centavo-level deterministic calculation",
    ],
    unsupported: [
      "gross-income aggregation, authorised deductions and personal-deduction determination",
      "employment subsidy, simplified-trust regime and category-specific provisional-payment schedules",
      "capital gains, dividends, interest, awards, foreign income and separate tax treatments",
      "credits, withholding, provisional payments, refunds and annual-return reconciliation",
      "residence, source, treaty and filing-obligation determinations",
    ],
    assumptions: [
      "The caller supplied annual taxable income after legally applicable deductions.",
      "The ordinary 2026 annual tariff under Article 152 applies.",
    ],
    sources: [
      {
        sourceId: "mx.sat.rmf-2026-annex-8-annual-tariff",
        publisher: "Mexican Tax Administration Service",
        publisherType: "tax-authority",
        title: "RMF 2026 Annex 8 — annual tariff for fiscal year 2026",
        url: "https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/normatividad_rmf_rgce2026.html",
        jurisdiction: "MX",
        retrievedAt: "2026-07-25",
      },
      {
        sourceId: "mx.dof.rmf-2026-annex-8",
        publisher: "Diario Oficial de la Federación",
        publisherType: "official-gazette",
        title: "Annex 8 of the 2026 Miscellaneous Tax Resolution",
        url: "https://www.dof.gob.mx/nota_detalle.php?codigo=5777219&fecha=28/12/2025",
        jurisdiction: "MX",
        retrievedAt: "2026-07-25",
      },
      {
        sourceId: "mx.sat.income-tax-law-article-97",
        publisher: "Mexican Tax Administration Service",
        publisherType: "tax-authority",
        title: "Income Tax Law Article 97 — annual employment-tax calculation",
        url: "https://wwwmat.sat.gob.mx/articulo/03635/articulo-97",
        jurisdiction: "MX",
        retrievedAt: "2026-07-25",
      },
    ],
  },
]);

const MEXICO_TARIFF = Object.freeze([
  { lowerBoundMinor: 1, upperBoundMinor: 1_013_511, fixedTaxMinor: 0, rateBasisPoints: 192 },
  { lowerBoundMinor: 1_013_512, upperBoundMinor: 8_602_211, fixedTaxMinor: 19_459, rateBasisPoints: 640 },
  { lowerBoundMinor: 8_602_212, upperBoundMinor: 15_117_619, fixedTaxMinor: 505_137, rateBasisPoints: 1_088 },
  { lowerBoundMinor: 15_117_620, upperBoundMinor: 17_573_566, fixedTaxMinor: 1_214_013, rateBasisPoints: 1_600 },
  { lowerBoundMinor: 17_573_567, upperBoundMinor: 21_040_369, fixedTaxMinor: 1_606_964, rateBasisPoints: 1_792 },
  { lowerBoundMinor: 21_040_370, upperBoundMinor: 42_435_397, fixedTaxMinor: 2_228_214, rateBasisPoints: 2_136 },
  { lowerBoundMinor: 42_435_398, upperBoundMinor: 66_884_014, fixedTaxMinor: 6_798_192, rateBasisPoints: 2_352 },
  { lowerBoundMinor: 66_884_015, upperBoundMinor: 127_692_598, fixedTaxMinor: 12_548_507, rateBasisPoints: 3_000 },
  { lowerBoundMinor: 127_692_599, upperBoundMinor: 170_256_797, fixedTaxMinor: 30_791_081, rateBasisPoints: 3_200 },
  { lowerBoundMinor: 170_256_798, upperBoundMinor: 510_770_392, fixedTaxMinor: 44_411_623, rateBasisPoints: 3_400 },
  { lowerBoundMinor: 510_770_393, upperBoundMinor: null, fixedTaxMinor: 160_186_246, rateBasisPoints: 3_500 },
]);

export const SIMPLE_PROGRESSIVE_WAVE_15_JURISDICTIONS = DEFINITIONS;

export const simpleProgressiveWave15Packages = Object.freeze([
  createProgressivePackage(DEFINITIONS[0]),
  createProgressivePackage(DEFINITIONS[1]),
  createMexicoPackage(DEFINITIONS[2]),
]);

function createProgressivePackage(definition) {
  return definePitCountryPackage({
    manifest: manifest(definition),
    sources: definition.sources,
    models: { [TAX_YEAR]: progressiveModel(definition) },
  });
}

function createMexicoPackage(definition) {
  return definePitCountryPackage({
    manifest: manifest(definition),
    sources: definition.sources,
    models: { [TAX_YEAR]: mexicoModel(definition) },
  });
}

function manifest(definition) {
  return {
    jurisdiction: definition.code,
    name: definition.name,
    storesUserPII: false,
    advisory: false,
    taxYears: [{
      taxYear: TAX_YEAR,
      modelVersion: `${definition.code.toLowerCase()}-${TAX_YEAR}-v1`,
      status: "current",
      order: 2026,
    }],
    pit: {
      contractVersion: "taxcraft.pit-country-package.v1",
      taxUnit: "individual",
      taxYearBasis: "calendar-year",
      currencyCodes: [definition.currency],
      incomeSchedules: [definition.code === "CN" ? "resident-comprehensive-income" : definition.code === "TW" ? "resident-consolidated-income" : "annual-article-152-tariff"],
      taxLayers: {
        national: true,
        subnational: false,
        local: false,
        subdivisionRequired: false,
      },
      factsSchema: {
        type: "object",
        additionalProperties: false,
        required: ["scopeConfirmed", definition.incomeField],
        properties: {
          scopeConfirmed: {
            type: "boolean",
            title: `Confirmed ${definition.code} PIT scope`,
            description: "The caller confirms that the supplied amount is the final taxable base governed by the supported annual schedule.",
            const: true,
            "x-taxcraft-kind": "confirmed-status",
          },
          [definition.incomeField]: {
            type: "integer",
            title: definition.incomeTitle,
            description: definition.incomeDescription,
            minimum: 0,
            "x-taxcraft-kind": "money-minor",
            "x-taxcraft-currency": definition.currency,
          },
        },
      },
      rounding: [{ stage: "annual-income-tax", mode: "floor", unitMinor: 1 }],
      maintenance: { mode: "manual", sourceWatch: false },
    },
  };
}

function progressiveModel(definition) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const taxableMinor = facts[definition.incomeField];
      const result = calculateProgressiveBands({
        taxableMinor,
        bands: definition.schedule,
        rounding: ROUNDING_MODE.FLOOR,
      });
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      const lines = result.bands.map((band) => ({
        ruleId: `${definition.code.toLowerCase()}.pit.${TAX_YEAR}.band-${band.index + 1}`,
        label: `${formatRate(band.rateBasisPoints)} annual taxable-income band`,
        amountMinor: band.taxMinor,
        sourceIds,
      }));
      if (lines.length === 0) lines.push(zeroLine(definition, sourceIds));
      return {
        currency: definition.currency,
        totals: {
          [definition.incomeField]: taxableMinor,
          incomeTaxMinor: result.taxMinor,
        },
        lines,
        assumptions: [...definition.assumptions],
        coverage: coverage(definition),
      };
    },
  };
}

function mexicoModel(definition) {
  return {
    coverage: coverage(definition),
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const taxableMinor = facts.annualTaxableIncomeMinor;
      const sourceIds = definition.sources.map(({ sourceId }) => sourceId);
      if (taxableMinor === 0) {
        return {
          currency: definition.currency,
          totals: { annualTaxableIncomeMinor: 0, incomeTaxMinor: 0 },
          lines: [zeroLine(definition, sourceIds)],
          assumptions: [...definition.assumptions],
          coverage: coverage(definition),
        };
      }
      const rowIndex = MEXICO_TARIFF.findIndex(({ upperBoundMinor }) => upperBoundMinor === null || taxableMinor <= upperBoundMinor);
      const row = MEXICO_TARIFF[rowIndex];
      const excessMinor = Math.max(0, taxableMinor - row.lowerBoundMinor);
      const marginalTaxMinor = Math.floor(excessMinor * row.rateBasisPoints / 10_000);
      const incomeTaxMinor = row.fixedTaxMinor + marginalTaxMinor;
      return {
        currency: definition.currency,
        totals: {
          annualTaxableIncomeMinor: taxableMinor,
          tariffRow: rowIndex + 1,
          fixedTaxMinor: row.fixedTaxMinor,
          marginalTaxMinor,
          incomeTaxMinor,
        },
        lines: [
          {
            ruleId: `mx.pit.${TAX_YEAR}.tariff-row-${rowIndex + 1}.fixed-quota`,
            label: `Official tariff row ${rowIndex + 1} fixed quota`,
            amountMinor: row.fixedTaxMinor,
            sourceIds,
          },
          {
            ruleId: `mx.pit.${TAX_YEAR}.tariff-row-${rowIndex + 1}.excess-rate`,
            label: `${formatRate(row.rateBasisPoints)} on excess above the row lower limit`,
            amountMinor: marginalTaxMinor,
            sourceIds,
          },
        ],
        assumptions: [...definition.assumptions],
        coverage: coverage(definition),
      };
    },
  };
}

function zeroLine(definition, sourceIds) {
  return {
    ruleId: `${definition.code.toLowerCase()}.pit.${TAX_YEAR}.zero-income`,
    label: "Income tax on zero taxable income",
    amountMinor: 0,
    sourceIds,
  };
}

function coverage(definition) {
  return {
    supported: [...definition.supported],
    unsupported: [...definition.unsupported],
  };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
