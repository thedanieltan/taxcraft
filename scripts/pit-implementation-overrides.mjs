export function applyPitImplementationOverrides({
  jurisdictionRegister,
  ruleMap,
  ruleSources,
  implementationOverrides,
}) {
  const register = structuredClone(jurisdictionRegister);
  const map = structuredClone(ruleMap);
  const sources = structuredClone(ruleSources);
  const knownSourceIds = new Set(sources.sources.map((entry) => entry.id));

  if (!knownSourceIds.has(implementationOverrides.source.id)) {
    sources.sources.push(structuredClone(implementationOverrides.source));
  }

  for (const [code, implementation] of Object.entries(implementationOverrides.implementations)) {
    register.overrides[code] = {
      ...(register.overrides[code] ?? {}),
      ...structuredClone(implementation.register),
    };

    map.implemented[code] = {
      calculationFamily: implementation.calculationFamily,
      sourceIds: structuredClone(implementation.sourceIds),
      taxYearBasis: implementation.taxYearBasis,
      notes: implementation.notes,
    };

    for (const codes of Object.values(map.sourceIndexed.families)) removeCode(codes, code);
    for (const codes of Object.values(map.sourceIndexed.evidenceGroups)) removeCode(codes, code);
    removeCode(map.sourceDiscovery, code);
  }

  map.asOf = implementationOverrides.asOf;
  return { jurisdictionRegister: register, ruleMap: map, ruleSources: sources };
}

function removeCode(codes, code) {
  const index = codes.indexOf(code);
  if (index !== -1) codes.splice(index, 1);
}