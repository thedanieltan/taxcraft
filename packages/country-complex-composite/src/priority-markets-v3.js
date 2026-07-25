import {
  ROUNDING_MODE,
  applyBasisPoints,
  calculateProgressiveBands,
  definePitCountryPackage,
} from "@taxcraft/country-sdk";
import {
  indiaPackage as indiaDefinition,
  canadaPackage as canadaDefinition,
  japanPackage as japanDefinition,
  spainPackage as spainDefinition,
  italyPackage as italyDefinition,
} from "./priority-markets-v2.js";

const INDIA_NEW_BANDS = schedule([
  [40_000_000, 0], [80_000_000, 500], [120_000_000, 1_000],
  [160_000_000, 1_500], [200_000_000, 2_000], [240_000_000, 2_500], [null, 3_000],
]);
const INDIA_OLD_BANDS = schedule([
  [25_000_000, 0], [50_000_000, 500], [100_000_000, 2_000], [null, 3_000],
]);
const CANADA_FEDERAL_BANDS = schedule([
  [5_852_300, 1_400], [11_704_500, 2_050], [18_144_000, 2_600],
  [25_848_200, 2_900], [null, 3_300],
]);
const CANADA_ONTARIO_BANDS = schedule([
  [5_389_100, 505], [10_778_500, 915], [15_000_000, 1_116],
  [22_000_000, 1_216], [null, 1_316],
]);
const JAPAN_BANDS = schedule([
  [1_950_000, 500], [3_300_000, 1_000], [6_950_000, 2_000], [9_000_000, 2_300],
  [18_000_000, 3_300], [40_000_000, 4_000], [null, 4_500],
]);
const SPAIN_STATE_BANDS = schedule([
  [1_245_000, 950], [2_020_000, 1_200], [3_520_000, 1_500],
  [6_000_000, 1_850], [30_000_000, 2_250], [null, 2_450],
]);
const ITALY_BANDS = schedule([
  [2_800_000, 2_300], [5_000_000, 3_300], [null, 4_300],
]);

export const indiaPackage = rebuild(indiaDefinition, "2026-27", indiaModel());
export const canadaPackage = rebuild(canadaDefinition, "2026", canadaModel());
export const japanPackage = rebuild(japanDefinition, "2026", japanModel());
export const spainPackage = rebuild(spainDefinition, "2026", spainModel());
export const italyPackage = rebuild(italyDefinition, "2026", italyModel());

export const priorityMarketPackages = Object.freeze([
  indiaPackage,
  canadaPackage,
  japanPackage,
  spainPackage,
  italyPackage,
]);

function rebuild(definition, taxYear, countryModel) {
  return definePitCountryPackage({
    manifest: definition.manifest,
    sources: definition.sources,
    models: { [taxYear]: countryModel },
  });
}

function indiaModel() {
  const coverage = indiaDefinition.coverage("2026-27");
  return standardModel(coverage, ({ facts }) => {
    const isNew = facts.taxRegime === "new";
    const slab = progressive(facts.taxableIncomeMinor, isNew ? INDIA_NEW_BANDS : INDIA_OLD_BANDS);
    const resident = facts.residentRebateSchedule === "resident";
    const threshold = isNew ? 120_000_000 : 50_000_000;
    const cap = isNew ? 6_000_000 : 1_250_000;
    const rebateMinor = resident && facts.taxableIncomeMinor <= threshold ? Math.min(slab.taxMinor, cap) : 0;
    const taxAfterRebateMinor = slab.taxMinor - rebateMinor;
    const cessMinor = applyBasisPoints(taxAfterRebateMinor, 400, ROUNDING_MODE.FLOOR);
    const sourceIds = ids(indiaDefinition);
    const lines = bandLines("in", "2026-27", facts.taxRegime, slab, sourceIds);
    zeroIfEmpty(lines, "in.pit.2026-27.ordinary-income.zero", "Zero ordinary income tax", sourceIds);
    if (rebateMinor > 0) lines.push(taxLine("in.pit.2026-27.section-87a-rebate", "Resident section 87A rebate", -rebateMinor, sourceIds));
    lines.push(taxLine("in.pit.2026-27.health-education-cess", "4% health and education cess", cessMinor, sourceIds));
    return output("INR", {
      taxableIncomeMinor: facts.taxableIncomeMinor,
      slabTaxMinor: slab.taxMinor,
      rebateMinor,
      taxAfterRebateMinor,
      cessMinor,
      incomeTaxMinor: taxAfterRebateMinor + cessMinor,
    }, lines, coverage, [
      "The caller supplied taxable income excluding special-rate income.",
      `The ${isNew ? "new" : "old under-60"} ordinary-rate schedule applies.`,
    ]);
  });
}

function canadaModel() {
  const coverage = canadaDefinition.coverage("2026");
  return standardModel(coverage, ({ facts }) => {
    const federal = progressive(facts.federalTaxableIncomeMinor, CANADA_FEDERAL_BANDS);
    const ontario = progressive(facts.provincialTaxableIncomeMinor, CANADA_ONTARIO_BANDS);
    const sourceIds = ids(canadaDefinition);
    const lines = [
      ...bandLines("ca", "2026", "federal", federal, sourceIds),
      ...bandLines("ca", "2026", "ontario", ontario, sourceIds),
    ];
    zeroIfEmpty(lines, "ca.pit.2026.federal-ontario.zero", "Zero federal and Ontario bracket tax", sourceIds);
    return output("CAD", {
      federalTaxableIncomeMinor: facts.federalTaxableIncomeMinor,
      provincialTaxableIncomeMinor: facts.provincialTaxableIncomeMinor,
      federalBracketTaxMinor: federal.taxMinor,
      ontarioBracketTaxMinor: ontario.taxMinor,
      totalIncludedTaxMinor: federal.taxMinor + ontario.taxMinor,
    }, lines, coverage, [
      "The Ontario provincial schedule applies.",
      "Credits, Ontario surtax, Ontario health premium and payroll contributions are excluded.",
    ]);
  });
}

function japanModel() {
  const coverage = japanDefinition.coverage("2026");
  return standardModel(coverage, ({ facts }) => {
    const roundedTaxableIncomeMinor = Math.floor(facts.taxableIncomeMinor / 1_000) * 1_000;
    const national = progressive(roundedTaxableIncomeMinor, JAPAN_BANDS);
    const reconstructionTaxMinor = applyBasisPoints(national.taxMinor, 210, ROUNDING_MODE.FLOOR);
    const beforeFinalRoundingMinor = national.taxMinor + reconstructionTaxMinor;
    const incomeTaxMinor = Math.floor(beforeFinalRoundingMinor / 100) * 100;
    const finalRoundingAdjustmentMinor = incomeTaxMinor - beforeFinalRoundingMinor;
    const sourceIds = ids(japanDefinition);
    const lines = bandLines("jp", "2026", "national", national, sourceIds);
    zeroIfEmpty(lines, "jp.pit.2026.national.zero", "Zero national income tax", sourceIds);
    lines.push(taxLine("jp.pit.2026.reconstruction-surtax", "2.1% special income tax for reconstruction", reconstructionTaxMinor, sourceIds));
    lines.push(taxLine("jp.pit.2026.final-hundred-yen-rounding", "Final combined tax rounded down to JPY 100", finalRoundingAdjustmentMinor, sourceIds));
    return output("JPY", {
      submittedTaxableIncomeMinor: facts.taxableIncomeMinor,
      roundedTaxableIncomeMinor,
      nationalIncomeTaxMinor: national.taxMinor,
      reconstructionTaxMinor,
      beforeFinalRoundingMinor,
      finalRoundingAdjustmentMinor,
      incomeTaxMinor,
    }, lines, coverage, [
      "The caller supplied ordinary taxable income after deductions.",
      "Local inhabitant tax is excluded.",
    ]);
  });
}

function spainModel() {
  const coverage = spainDefinition.coverage("2026");
  return {
    coverage,
    validateFacts({ facts }) {
      if (facts.personalFamilyMinimumMinor > facts.generalTaxableBaseMinor) {
        return {
          ok: false,
          issues: [{
            code: "facts.inconsistent",
            path: "$.personalFamilyMinimumMinor",
            message: "The personal and family minimum portion cannot exceed the general taxable base.",
          }],
        };
      }
      return { ok: true, facts };
    },
    calculate({ facts }) {
      const baseTax = progressive(facts.generalTaxableBaseMinor, SPAIN_STATE_BANDS);
      const minimumTax = progressive(facts.personalFamilyMinimumMinor, SPAIN_STATE_BANDS);
      const sourceIds = ids(spainDefinition);
      const lines = [
        ...bandLines("es", "2026", "state-base", baseTax, sourceIds),
        ...minimumTax.bands.map((band) => taxLine(
          `es.pit.2026.state-minimum.band-${band.index + 1}`,
          `${formatRate(band.rateBasisPoints)} state-scale tax attributable to the personal and family minimum`,
          -band.taxMinor,
          sourceIds,
        )),
      ];
      zeroIfEmpty(lines, "es.pit.2026.state-general.zero", "Zero state general-base tax", sourceIds);
      return output("EUR", {
        generalTaxableBaseMinor: facts.generalTaxableBaseMinor,
        personalFamilyMinimumMinor: facts.personalFamilyMinimumMinor,
        stateTaxOnBaseMinor: baseTax.taxMinor,
        stateTaxOnMinimumMinor: minimumTax.taxMinor,
        stateIncomeTaxMinor: baseTax.taxMinor - minimumTax.taxMinor,
      }, lines, coverage, [
        "Only the state component is calculated.",
        "The autonomous-community component is excluded.",
      ]);
    },
  };
}

function italyModel() {
  const coverage = italyDefinition.coverage("2026");
  return standardModel(coverage, ({ facts }) => {
    const national = progressive(facts.nationalTaxableIncomeMinor, ITALY_BANDS);
    const regionalAdditionMinor = applyBasisPoints(facts.regionalTaxableIncomeMinor, facts.regionalRateBasisPoints, ROUNDING_MODE.FLOOR);
    const municipalAdditionMinor = applyBasisPoints(facts.municipalTaxableIncomeMinor, facts.municipalRateBasisPoints, ROUNDING_MODE.FLOOR);
    const sourceIds = ids(italyDefinition);
    const lines = bandLines("it", "2026", "national", national, sourceIds);
    zeroIfEmpty(lines, "it.pit.2026.national.zero", "Zero national IRPEF", sourceIds);
    lines.push(taxLine("it.pit.2026.regional-addition", `${formatRate(facts.regionalRateBasisPoints)} caller-confirmed regional IRPEF addition`, regionalAdditionMinor, sourceIds));
    lines.push(taxLine("it.pit.2026.municipal-addition", `${formatRate(facts.municipalRateBasisPoints)} caller-confirmed municipal IRPEF addition`, municipalAdditionMinor, sourceIds));
    return output("EUR", {
      nationalTaxableIncomeMinor: facts.nationalTaxableIncomeMinor,
      nationalIncomeTaxMinor: national.taxMinor,
      regionalAdditionMinor,
      municipalAdditionMinor,
      totalIncludedTaxMinor: national.taxMinor + regionalAdditionMinor + municipalAdditionMinor,
    }, lines, coverage, [
      "The caller supplied applicable national and local taxable bases and local rates.",
      "No location or local exemption was inferred.",
    ]);
  });
}

function standardModel(coverage, calculate) {
  return {
    coverage,
    validateFacts({ facts }) {
      return { ok: true, facts };
    },
    calculate,
  };
}

function progressive(taxableMinor, bands) {
  return calculateProgressiveBands({ taxableMinor, bands, rounding: ROUNDING_MODE.FLOOR });
}

function schedule(entries) {
  return Object.freeze(entries.map(([upperBoundMinor, rateBasisPoints]) => ({ upperBoundMinor, rateBasisPoints })));
}

function ids(countryPackage) {
  return countryPackage.sources.map(({ sourceId }) => sourceId);
}

function bandLines(jurisdiction, taxYear, scheduleName, result, sourceIds) {
  return result.bands.map((band) => taxLine(
    `${jurisdiction}.pit.${taxYear}.${scheduleName}.band-${band.index + 1}`,
    `${formatRate(band.rateBasisPoints)} ${scheduleName} band`,
    band.taxMinor,
    sourceIds,
  ));
}

function taxLine(ruleId, label, amountMinor, sourceIds) {
  return { ruleId, label, amountMinor, sourceIds };
}

function zeroIfEmpty(lines, ruleId, label, sourceIds) {
  if (lines.length === 0) lines.push(taxLine(ruleId, label, 0, sourceIds));
}

function output(currency, totals, lines, coverage, assumptions) {
  return { currency, totals, lines, assumptions, coverage };
}

function formatRate(rateBasisPoints) {
  const whole = Math.floor(rateBasisPoints / 100);
  const fraction = rateBasisPoints % 100;
  return fraction === 0 ? `${whole}%` : `${whole}.${String(fraction).padStart(2, "0")}%`;
}
