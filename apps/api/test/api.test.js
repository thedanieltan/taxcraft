import assert from "node:assert/strict";
import test from "node:test";

import { createApi, OPENAPI_DOCUMENT } from "../src/app.js";

const api = createApi();

const MAINTAINED_JURISDICTIONS = [
  "SG", "GB", "AE", "BH", "BM", "BN", "KY", "MC", "OM", "QA", "SA", "VG", "BS", "KW", "BG", "EE", "HU", "RO", "AM", "GE", "MD", "MK", "UA", "UZ", "NZ", "PY", "CY", "PA", "HN", "DO", "BB", "TT", "SC", "UG", "GT", "RW", "AU", "PH", "TH", "FJ", "BW", "TL", "KH", "KE", "ZA", "MY", "CZ", "ID", "GH", "MU", "LK", "SZ", "JM", "LS", "GY", "HK", "IE", "PL",
];

test("lists maintained jurisdictions and exposes source-linked coverage", async () => {
  const list = await api.handle({ method: "GET", path: "/v1/jurisdictions" });
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.jurisdictions.map((entry) => entry.jurisdiction), MAINTAINED_JURISDICTIONS);

  const yearCases = [
    ["SG", ["YA2024", "YA2025", "YA2026"]],
    ["GB", ["2024-25", "2025-26", "2026-27"]],
    ...["AE", "SA", "VG", "BS", "KW", "EE", "NZ", "UA", "DO", "SC", "UG", "GT", "RW", "FJ", "TL", "KH", "KE", "PH", "TH", "CZ", "ID", "GH", "IE", "PL"].map((code) => [code, ["2024", "2025", "2026"]]),
    ["ZA", ["2025", "2026", "2027"]],
    ["AU", ["2024-25", "2025-26", "2026-27"]],
    ["BW", ["2024-25", "2025-26", "2026-27"]],
    ["MU", ["2025-26", "2026-27", "2027-28"]],
    ["LK", ["2024-25", "2025-26", "2026-27"]],
    ["SZ", ["2025-26"]],
    ["JM", ["2026"]],
    ["LS", ["2026-27"]],
    ["GY", ["2026"]],
    ["MY", ["2023", "2024", "2025"]],
    ["HK", ["2023-24", "2024-25", "2025-26"]],
  ];
  for (const [code, expectedYears] of yearCases) {
    const entry = list.body.jurisdictions.find(({ jurisdiction }) => jurisdiction === code);
    assert.deepEqual(entry.taxYears.map(({ taxYear }) => taxYear), expectedYears);
  }

  const coverageCases = [
    ["SG", "YA2026", "sg-iras-resident-rates-ya2024-onwards"],
    ["AE", "2026", "ae.pit.natural-person-wages"],
    ["SA", "2026", "sa.zatca.income-tax-scope"],
    ["VG", "2026", "vg.ird.payroll-tax"],
    ["BS", "2026", "bs.opm.mid-year-budget-2024-25"],
    ["KW", "2026", "kw.mof.income-tax-law-corporate-body"],
    ["EE", "2026", "ee.emta.basic-exemption"],
    ["NZ", "2026", "nz.ird.individual-tax-rates"],
    ["UA", "2026", "ua.sts.tax-code-section-iv-article-167"],
    ["DO", "2026", "do.dgii.individual-income-tax-scale"],
    ["BB", "2026", "bb.bra.personal-income-tax-rates-2026"],
    ["TT", "2026", "tt.ird.individual-income-tax-rates"],
    ["SC", "2026", "sc.src.employment-income-tax-rates"],
    ["UG", "2026", "ug.ura.individual-income-tax-rates"],
    ["GT", "2026", "gt.sat.income-tax-law-decree-10-2012"],
    ["RW", "2026", "rw.rra.paye-bands"],
    ["FJ", "2026", "fj.frcs.paye-structure-2024"],
    ["BW", "2026-27", "bw.burs.individual-tax-rates-subsequent-years"],
    ["TL", "2026", "tl.attl.wage-income-tax"],
    ["KH", "2026", "kh.gdt.monthly-salary-annual-income-bands-2024"],
    ["KE", "2026", "ke.kra.paye-rates-and-relief"],
    ["ZA", "2027", "za.sars.individual-tax-rates"],
    ["AU", "2026-27", "au.treasury.new-tax-cuts-2026-27"],
    ["PH", "2026", "ph.lawphil.train-act-individual-rates"],
    ["TH", "2026", "th.rd.personal-income-tax-rates"],
    ["MY", "2025", "my.hasil.individual-tax-rates-2023-2025"],
    ["CZ", "2026", "cz.fs.pit-rates-and-credit-2026"],
    ["ID", "2026", "id.djp.individual-income-tax-calculation"],
    ["GH", "2026", "gh.gra.paye-rates-2024"],
    ["MU", "2026-27", "mu.mra.fair-share-contribution"],
    ["LK", "2026-27", "lk.ird.inland-revenue-amendment-2026-notice"],
    ["SZ", "2025-26", "sz.ers.individual-rates-and-rebates"],
    ["JM", "2026", "jm.taj.threshold-2026"],
    ["LS", "2026-27", "ls.rsl.income-tax-2026-27"],
    ["GY", "2026", "gy.gra.revised-allowance-rates-2026"],
    ["HK", "2025-26", "hk.ird.two-tier-standard-rates-2024"],
    ["IE", "2026", "ie.revenue.usc-standard-rates"],
    ["PL", "2026", "pl.mf.joint-spouse-calculation"],
  ];
  for (const [code, year, sourceId] of coverageCases) {
    const coverage = await api.handle({ method: "GET", path: `/v1/jurisdictions/${code}/${year}/coverage` });
    assert.equal(coverage.status, 200);
    assert.equal(coverage.body.status, "current");
    assert.ok(coverage.body.sources.some((source) => source.sourceId === sourceId));
  }

  const ukCoverage = await api.handle({ method: "GET", path: "/v1/jurisdictions/GB/2026-27/coverage" });
  assert.equal(ukCoverage.status, 200);
  assert.equal(ukCoverage.body.status, "current");
  assert.ok(ukCoverage.body.coverage.unsupported.includes("Scotland"));
  assert.ok(ukCoverage.body.sources.every((source) => source.url.startsWith("https://www.gov.uk/")));
});

test("calculates through the official Singapore package and returns cited sources", async () => {
  const response = await api.handle({
    method: "POST",
    path: "/v1/calculate",
    body: {
      jurisdiction: "SG",
      taxYear: "YA2026",
      facts: { taxResident: true, chargeableIncomeMinor: 10_000_000 },
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.totals.netTaxPayableMinor, 565_000);
  assert.ok(response.body.lines.every((line) => line.sourceIds.length > 0));
  assert.ok(response.body.sources.some((source) => source.sourceId === "sg-iras-resident-rates-ya2024-onwards"));
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.headers["set-cookie"], undefined);
});

test("calculates UK non-savings Income Tax and returns HMRC sources", async () => {
  const response = await api.handle({
    method: "POST",
    path: "/v1/calculate",
    body: {
      jurisdiction: "GB",
      taxYear: "2026-27",
      facts: {
        territory: "England",
        nonSavingsIncomeMinor: 3_500_000,
        adjustedNetIncomeMinor: 3_500_000,
      },
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(response.body.totals.incomeTaxMinor, 448_600);
  assert.deepEqual(response.body.sources.map((source) => source.sourceId), ["gb-hmrc-income-tax-rates-current-and-past"]);
});

test("rejects identity-bearing facts and never logs the submitted values", async () => {
  const logs = [];
  const privateApi = createApi({ logger: (record) => logs.push(record) });
  const response = await privateApi.handle({
    method: "POST",
    path: "/v1/calculate",
    body: {
      jurisdiction: "SG",
      taxYear: "YA2026",
      facts: {
        taxResident: true,
        chargeableIncomeMinor: 12_345_600,
        name: "Private Person",
      },
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.status, "invalid");
  const serializedLogs = JSON.stringify(logs);
  assert.doesNotMatch(serializedLogs, /Private Person/);
  assert.doesNotMatch(serializedLogs, /12345600/);
});

test("serves a small OpenAPI document for the public routes", async () => {
  const response = await api.handle({ method: "GET", path: "/openapi.json" });
  assert.equal(response.status, 200);
  assert.equal(response.body.openapi, "3.1.0");
  assert.deepEqual(response.body, OPENAPI_DOCUMENT);
  assert.ok(response.body.paths["/v1/calculate"]);
});

test("returns explicit not-found responses for unavailable resources", async () => {
  const response = await api.handle({ method: "GET", path: "/v1/jurisdictions/SG/YA2023/coverage" });
  assert.equal(response.status, 404);
  assert.equal(response.body.status, "not_found");
});
