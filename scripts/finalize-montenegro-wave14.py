from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def transform(path: str, replacements: list[tuple[str, str]]) -> None:
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    for old, new in replacements:
        if new in text:
            continue
        if old in text:
            text = text.replace(old, new, 1)
    file_path.write_text(text, encoding="utf-8")


def insert_once(path: str, marker: str, addition: str, sentinel: str) -> None:
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    if sentinel not in text and marker in text:
        text = text.replace(marker, addition + marker, 1)
        file_path.write_text(text, encoding="utf-8")


# Catalogue overlay index.
overlay_path = ROOT / "catalog/pit-implementation-overlays.json"
overlay = json.loads(overlay_path.read_text(encoding="utf-8"))
overlay_file = "pit-implementation-overrides-simple-progressive-14.json"
if overlay_file not in overlay["files"]:
    overlay["files"].append(overlay_file)
overlay_path.write_text(json.dumps(overlay, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

# Simple-progressive bundle and Montenegro boundaries.
simple_test = "test/simple-progressive-packages.test.js"
transform(simple_test, [
    ('"AD", "ZM"];', '"AD", "ZM", "ME"];'),
    ("twenty-one independent maintained packages", "twenty-two independent maintained packages"),
    ('["AD", "ZM"].includes', '["AD", "ZM", "ME"].includes'),
    ('!["AU", "BW", "AD", "ZM"].includes', '!["AU", "BW", "AD", "ZM", "ME"].includes'),
    ('    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],\n', '    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],\n    ["ME", "2026", ["scopeConfirmed", "monthlyTaxablePersonalIncomeMinor"]],\n'),
])
insert_once(
    simple_test,
    'test("global catalogue and API expose every accepted simple-progressive package", async () => {',
    '''test("Montenegro applies the national monthly personal-earnings schedule", async () => {\n  const cases = [\n    [0, 0],\n    [70_000, 0],\n    [100_000, 2_700],\n    [150_000, 10_200],\n  ];\n  for (const [monthlyTaxablePersonalIncomeMinor, expectedTaxMinor] of cases) {\n    const result = await calculate("ME", "2026", {\n      scopeConfirmed: true,\n      monthlyTaxablePersonalIncomeMinor,\n    });\n    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);\n    assert.equal(result.totals.exemptThresholdMinor, 70_000);\n    assert.equal(result.totals.secondThresholdMinor, 100_000);\n    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("me.tax-administration.personal-earnings-rates-current")));\n    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("me.gov.payroll-calculation-guide-2026")));\n  }\n});\n\n''',
    'Montenegro applies the national monthly personal-earnings schedule',
)
insert_once(
    simple_test,
    '  const schemaCases = [',
    '''  const montenegro = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/ME" });\n  assert.equal(montenegro.status, 200);\n  assert.deepEqual(montenegro.body.supportedTaxYears, ["2026"]);\n\n''',
    'path: "/v1/pit/jurisdictions/ME"',
)

# Global catalogue guards.
catalog_test = "test/pit-catalog-api.test.js"
transform(catalog_test, [
    ('"AD", "ZM", "KE"', '"AD", "ZM", "ME", "KE"'),
    ("status.counts.implemented, 86", "status.counts.implemented, 87"),
    ('status.counts["source-indexed"], 79', 'status.counts["source-indexed"], 78'),
    ('    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],\n', '    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],\n    ["ME", "2026", ["scopeConfirmed", "monthlyTaxablePersonalIncomeMinor"]],\n'),
])

# Compatibility API guards.
api_test = "apps/api/test/api.test.js"
transform(api_test, [
    ('"AD", "ZM", "KE"', '"AD", "ZM", "ME", "KE"'),
    ('    ["ZM", ["2026"]],\n', '    ["ZM", ["2026"]],\n    ["ME", ["2026"]],\n'),
    ('    ["ZM", "2026", "zm.parliament.income-tax-amendment-2023"],\n', '    ["ZM", "2026", "zm.parliament.income-tax-amendment-2023"],\n    ["ME", "2026", "me.tax-administration.personal-earnings-rates-current"],\n'),
])

# Roadmap and maintenance documentation. The prose was already one wave behind France.
roadmap = "docs/global-pit-roadmap.md"
transform(roadmap, [
    ("85 implemented; 80 source-indexed", "87 implemented; 78 source-indexed"),
    ("86 implemented; 79 source-indexed", "87 implemented; 78 source-indexed"),
    ("Waves 1–13 integrated", "Waves 1–14 integrated"),
    ("- 85 implemented calculators;", "- 87 implemented calculators;"),
    ("- 86 implemented calculators;", "- 87 implemented calculators;"),
    ("- 80 source-indexed jurisdictions awaiting implementation;", "- 78 source-indexed jurisdictions awaiting implementation;"),
    ("- 79 source-indexed jurisdictions awaiting implementation;", "- 78 source-indexed jurisdictions awaiting implementation;"),
    ("Cambodia, Andorra and Zambia;", "Cambodia, Andorra, Zambia and Montenegro;"),
    ("- `docs/simple-progressive-packages-wave-13.md`\n", "- `docs/simple-progressive-packages-wave-13.md`\n- `docs/simple-progressive-packages-wave-14.md`\n"),
])
insert_once(
    roadmap,
    "Ecuador calculates fiscal-year 2025",
    "Montenegro calculates the 2026 national tax on caller-confirmed monthly taxable personal earnings using a EUR 700 zero-rate threshold, 9% through EUR 1,000 and 15% above, while excluding municipal surtax, contributions, annual aggregation and non-salary income. ",
    "Montenegro calculates the 2026 national tax",
)

(ROOT / "docs/simple-progressive-packages-wave-14.md").write_text(
    '''# Simple-progressive packages — wave 14\n\n## Montenegro\n\nTaxCraft implements Montenegro's national tax on monthly personal earnings for calendar year 2026.\n\n### Supported calculation\n\n- 0% through EUR 700 of monthly taxable personal earnings;\n- 9% from EUR 700 through EUR 1,000;\n- 15% above EUR 1,000.\n\nThe package uses euro cents and half-up rounding. Municipal surtax and social contributions are excluded.\n\n### Required facts\n\n- `scopeConfirmed`;\n- `monthlyTaxablePersonalIncomeMinor`.\n\n### Explicit exclusions\n\nGross-to-taxable derivation, contributions, municipal surtax, annual aggregation, non-salary schedules, withholding administration, residence and filing determinations remain outside scope.\n\n### Primary sources\n\n- Tax Administration of Montenegro personal-earnings bands;\n- Government payroll calculation instruction applicable from 1 January 2026;\n- current consolidated Personal Income Tax Law.\n\nImplementation acceptance, deployment and live acceptance remain separate states.\n''',
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
