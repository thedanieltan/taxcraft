from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace(path: str, old: str, new: str) -> None:
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    if old not in text:
        raise RuntimeError(f"Expected text not found in {path}: {old[:120]!r}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


def append_before(path: str, marker: str, addition: str) -> None:
    replace(path, marker, addition + marker)


# Catalogue overlay index.
overlay_path = ROOT / "catalog/pit-implementation-overlays.json"
overlay = json.loads(overlay_path.read_text(encoding="utf-8"))
overlay_file = "pit-implementation-overrides-simple-progressive-14.json"
if overlay_file not in overlay["files"]:
    overlay["files"].append(overlay_file)
overlay_path.write_text(json.dumps(overlay, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# Simple-progressive bundle and Montenegro boundaries.
simple_test = "test/simple-progressive-packages.test.js"
replace(simple_test, '"AD", "ZM"];', '"AD", "ZM", "ME"];')
replace(simple_test, "twenty-one independent maintained packages", "twenty-two independent maintained packages")
replace(simple_test, '["AD", "ZM"].includes', '["AD", "ZM", "ME"].includes')
replace(simple_test, '!["AU", "BW", "AD", "ZM"].includes', '!["AU", "BW", "AD", "ZM", "ME"].includes')
append_before(
    simple_test,
    'test("global catalogue and API expose every accepted simple-progressive package", async () => {',
    '''test("Montenegro applies the national monthly personal-earnings schedule", async () => {\n  const cases = [\n    [0, 0],\n    [70_000, 0],\n    [100_000, 2_700],\n    [150_000, 10_200],\n  ];\n  for (const [monthlyTaxablePersonalIncomeMinor, expectedTaxMinor] of cases) {\n    const result = await calculate("ME", "2026", {\n      scopeConfirmed: true,\n      monthlyTaxablePersonalIncomeMinor,\n    });\n    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);\n    assert.equal(result.totals.exemptThresholdMinor, 70_000);\n    assert.equal(result.totals.secondThresholdMinor, 100_000);\n    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("me.tax-administration.personal-earnings-rates-current")));\n    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("me.gov.payroll-calculation-guide-2026")));\n  }\n});\n\n''',
)
append_before(
    simple_test,
    '  const schemaCases = [',
    '''  const montenegro = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/ME" });\n  assert.equal(montenegro.status, 200);\n  assert.deepEqual(montenegro.body.supportedTaxYears, ["2026"]);\n\n''',
)
replace(
    simple_test,
    '    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],\n',
    '    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],\n    ["ME", "2026", ["scopeConfirmed", "monthlyTaxablePersonalIncomeMinor"]],\n',
)

# Global catalogue guards.
catalog_test = "test/pit-catalog-api.test.js"
replace(catalog_test, '"AD", "ZM", "KE"', '"AD", "ZM", "ME", "KE"')
replace(catalog_test, "status.counts.implemented, 86", "status.counts.implemented, 87")
replace(catalog_test, 'status.counts["source-indexed"], 79', 'status.counts["source-indexed"], 78')
replace(
    catalog_test,
    '    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],\n',
    '    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],\n    ["ME", "2026", ["scopeConfirmed", "monthlyTaxablePersonalIncomeMinor"]],\n',
)

# Compatibility API guards.
api_test = "apps/api/test/api.test.js"
replace(api_test, '"AD", "ZM", "KE"', '"AD", "ZM", "ME", "KE"')
replace(
    api_test,
    '    ["ZM", ["2026"]],\n',
    '    ["ZM", ["2026"]],\n    ["ME", ["2026"]],\n',
)
replace(
    api_test,
    '    ["ZM", "2026", "zm.parliament.income-tax-amendment-2023"],\n',
    '    ["ZM", "2026", "zm.parliament.income-tax-amendment-2023"],\n    ["ME", "2026", "me.tax-administration.personal-earnings-rates-current"],\n',
)

# Roadmap and maintenance documentation.
roadmap = "docs/global-pit-roadmap.md"
replace(roadmap, "86 implemented; 79 source-indexed", "87 implemented; 78 source-indexed")
replace(roadmap, "Waves 1–13 integrated", "Waves 1–14 integrated")
replace(roadmap, "- 86 implemented calculators;", "- 87 implemented calculators;")
replace(roadmap, "- 79 source-indexed jurisdictions awaiting implementation;", "- 78 source-indexed jurisdictions awaiting implementation;")
replace(roadmap, "Cambodia, Andorra and Zambia;", "Cambodia, Andorra, Zambia and Montenegro;")
replace(
    roadmap,
    "Zambia calculates the 2026 ordinary annual individual schedule from caller-confirmed taxable income using the ZMW 61,200 tax-free threshold and 20%, 30% and 37% marginal bands, while excluding taxable-income derivation, statutory contributions, PAYE administration and special tax regimes. ",
    "Zambia calculates the 2026 ordinary annual individual schedule from caller-confirmed taxable income using the ZMW 61,200 tax-free threshold and 20%, 30% and 37% marginal bands, while excluding taxable-income derivation, statutory contributions, PAYE administration and special tax regimes. Montenegro calculates the 2026 national tax on caller-confirmed monthly taxable personal earnings using a EUR 700 zero-rate threshold, 9% through EUR 1,000 and 15% above, while excluding municipal surtax, contributions, annual aggregation and non-salary income. ",
)
replace(
    roadmap,
    "- `docs/simple-progressive-packages-wave-13.md`\n",
    "- `docs/simple-progressive-packages-wave-13.md`\n- `docs/simple-progressive-packages-wave-14.md`\n",
)

(ROOT / "docs/simple-progressive-packages-wave-14.md").write_text(
    '''# Simple-progressive packages — wave 14\n\n## Montenegro\n\nTaxCraft implements Montenegro's national tax on monthly personal earnings for calendar year 2026.\n\n### Supported calculation\n\nThe calculator applies:\n\n- 0% through EUR 700 of monthly taxable personal earnings;\n- 9% from EUR 700 through EUR 1,000;\n- 15% above EUR 1,000.\n\nAmounts are represented in euro cents and each progressive band is rounded half-up to the nearest cent. The 2026 government payroll instruction confirms the current salary-calculation framework, while the Tax Administration publishes the operative personal-earnings rate bands.\n\n### Required facts\n\n- `scopeConfirmed`: confirms that the ordinary national personal-earnings schedule applies;\n- `monthlyTaxablePersonalIncomeMinor`: caller-confirmed monthly taxable personal earnings after applicable exemptions and deductions.\n\n### Explicit exclusions\n\nThe package does not calculate:\n\n- gross salary, expenses, exemptions, deductions or monthly taxable-earnings derivation;\n- employee or employer social-insurance contributions and other payroll charges;\n- municipal surtax on personal income tax;\n- annual aggregation, annual return reconciliation, employer withholding or remittance administration;\n- self-employment, property, capital gains, investment, occasional or other non-salary schedules;\n- foreign-tax or treaty relief, prior payments, penalties, interest or refunds;\n- residence, source, income classification or filing-obligation determinations.\n\n### Primary sources\n\n- Tax Administration of Montenegro, published personal-earnings rate bands;\n- Government of Montenegro, payroll calculation instruction applicable from 1 January 2026;\n- Government of Montenegro, current consolidated Personal Income Tax Law publication.\n\n### Acceptance fixtures\n\nThe deterministic suite covers zero income, the EUR 700 zero-rate threshold, the EUR 1,000 transition, the open-ended 15% band, source attribution, API discovery, schema exposure, exclusions, unsupported tax years and identity-bearing fact rejection.\n\nImplementation acceptance, deployment and live acceptance remain separate states.\n''',
    encoding="utf-8",
)

# Remove one-time finalisation assets from the accepted branch.
for relative in [
    "scripts/finalize-montenegro-wave14.py",
    ".github/workflows/finalize-montenegro-wave14.yml",
    "tmp/finalize-montenegro-wave14.trigger",
]:
    path = ROOT / relative
    if path.exists():
        path.unlink()
