import {
  PIT_CALCULATION_FAMILIES,
  PIT_JURISDICTION_REGISTER,
  PIT_RULE_MAP,
  PIT_RULE_SOURCES,
} from "./data.js";

const familyById = new Map(PIT_CALCULATION_FAMILIES.families.map((family) => [family.id, family]));
const sourceById = new Map(PIT_RULE_SOURCES.sources.map((source) => [source.id, source]));
const evidenceByCode = buildEvidenceIndex();
const assignmentByCode = buildAssignmentIndex();
const jurisdictions = PIT_JURISDICTION_REGISTER.entities.map(([code, alpha3, numericCode, name]) => {
  const registered = {
    ...PIT_JURISDICTION_REGISTER.defaults,
    code,
    alpha3,
    numericCode,
    name,
    ...(PIT_JURISDICTION_REGISTER.overrides[code] ?? {}),
  };
  const assignment = assignmentByCode.get(code);
  const family = familyById.get(assignment.calculationFamily);
  return Object.freeze({
    code,
    alpha3,
    numericCode,
    name,
    classificationStatus: assignment.classificationStatus,
    verificationStatus: assignment.classificationStatus === "implemented"
      ? "verified"
      : assignment.classificationStatus === "source-indexed"
        ? "provisional"
        : "unmapped",
    implementationStatus: registered.implementationStatus,
    calculationFamily: assignment.calculationFamily,
    implementationWave: family?.implementationWave ?? null,
    taxYearBasis: registered.taxYearBasis,
    currencyCodes: structuredClone(registered.currencyCodes),
    nationalTaxLayer: registered.nationalTaxLayer,
    subnationalTaxLayer: registered.subnationalTaxLayer,
    localTaxLayer: registered.localTaxLayer,
    requiredSubdivisionSelection: registered.requiredSubdivisionSelection,
    supportedTaxYears: structuredClone(registered.supportedTaxYears),
    package: registered.package,
    coverageSummary: registered.coverageSummary,
    evidenceSourceIds: structuredClone(evidenceByCode.get(code) ?? []),
  });
});
const jurisdictionByCode = new Map(jurisdictions.map((jurisdiction) => [jurisdiction.code, jurisdiction]));

export function listPitJurisdictions() {
  return structuredClone(jurisdictions.map(summary));
}

export function getPitJurisdiction(code) {
  const jurisdiction = jurisdictionByCode.get(code);
  if (!jurisdiction) return null;
  return structuredClone({
    ...jurisdiction,
    evidenceSources: jurisdiction.evidenceSourceIds.map((sourceId) => sourceById.get(sourceId)).filter(Boolean),
  });
}

export function listPitCalculationFamilies() {
  return structuredClone(PIT_CALCULATION_FAMILIES.families);
}

export function getPitCatalogueStatus() {
  const counts = jurisdictions.reduce((result, jurisdiction) => {
    result[jurisdiction.classificationStatus] = (result[jurisdiction.classificationStatus] ?? 0) + 1;
    return result;
  }, {});
  return {
    schemaVersion: PIT_RULE_MAP.schemaVersion,
    asOf: PIT_RULE_MAP.asOf,
    jurisdictionCount: jurisdictions.length,
    counts,
  };
}

function summary(jurisdiction) {
  return {
    code: jurisdiction.code,
    alpha3: jurisdiction.alpha3,
    numericCode: jurisdiction.numericCode,
    name: jurisdiction.name,
    classificationStatus: jurisdiction.classificationStatus,
    verificationStatus: jurisdiction.verificationStatus,
    implementationStatus: jurisdiction.implementationStatus,
    calculationFamily: jurisdiction.calculationFamily,
    implementationWave: jurisdiction.implementationWave,
    supportedTaxYears: structuredClone(jurisdiction.supportedTaxYears),
  };
}

function buildAssignmentIndex() {
  const assignments = new Map();
  for (const [code, entry] of Object.entries(PIT_RULE_MAP.implemented)) {
    assignments.set(code, {
      classificationStatus: "implemented",
      calculationFamily: entry.calculationFamily,
    });
  }
  for (const [calculationFamily, codes] of Object.entries(PIT_RULE_MAP.sourceIndexed.families)) {
    for (const code of codes) {
      assignments.set(code, { classificationStatus: "source-indexed", calculationFamily });
    }
  }
  for (const code of PIT_RULE_MAP.sourceDiscovery) {
    assignments.set(code, { classificationStatus: "source-discovery", calculationFamily: "UNMAPPED" });
  }
  return assignments;
}

function buildEvidenceIndex() {
  const evidence = new Map();
  for (const [code, entry] of Object.entries(PIT_RULE_MAP.implemented)) {
    evidence.set(code, [...entry.sourceIds]);
  }
  for (const [sourceId, codes] of Object.entries(PIT_RULE_MAP.sourceIndexed.evidenceGroups)) {
    for (const code of codes) {
      const current = evidence.get(code) ?? [];
      current.push(sourceId);
      evidence.set(code, current);
    }
  }
  return evidence;
}
