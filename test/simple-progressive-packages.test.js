import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { simpleProgressivePackages } from "@taxcraft/country-simple-progressive";

const EXPECTED_CODES = ["NZ", "PY", "CY", "PA", "HN", "DO", "BB", "TT", "SC", "UG", "GT", "RW", "AU", "PH", "TH", "FJ", "BW", "TL", "KH", "AD", "ZM", "ME"];
const engine = createTaxCraft({ countryPackages: simpleProgressivePackages });

async function calculate(jurisdiction, taxYear, facts) {
  const result = await engine.calculate({ jurisdiction, taxYear, facts });
  assert.equal(result.status, "ok");
  return result;
}

test("simple-progressive bundle exposes twenty-two independent maintained packages", () => {
  assert.deepEqual(simpleProgressivePackages.map(({ manifest }) => manifest.jurisdiction), EXPECTED_CODES);
  for (const countryPackage of simpleProgressivePackages) {
    assert.equal(countryPackage.manifest.storesUserPII, false);
    assert.equal(countryPackage.manifest.advisory, false);
    const expectedTaxYearCount = ["AD", "ZM", "ME"].includes(countryPackage.manifest.jurisdiction) ? 1 : 3;
    assert.equal(countryPackage.manifest.taxYears.length, expectedTaxYearCount);
    assert.equal(countryPackage.manifest.taxYears.filter(({ status }) => status === "current").length, 1);
    assert.equal(countryPackage.manifest.pit.factsSchema.additionalProperties, false);
    assert.ok(countryPackage.sources.length > 0);
  }
});

test("previous simple-progressive fixtures remain stable", async () => {
  const cases = [
    ["NZ", { scopeConfirmed: true, taxableIncomeMinor: 10_000_000 }, 2_287_750],
    ["CY", { scopeConfirmed: true, taxableIncomeMinor: 7_000_000 }, 1_290_000],
    ["PA", { scopeConfirmed: true, taxableIncomeMinor: 6_000_000 }, 835_000],
    ["HN", { scopeConfirmed: true, taxableIncomeMinor: 100_000_000 }, 15_786_061],
    ["DO", { scopeConfirmed: true, taxableIncomeMinor: 100_000_000 }, 11_299_525],
    ["BB", { scopeConfirmed: true, taxableIncomeMinor: 6_000_000 }, 850_000],
    ["TT", { scopeConfirmed: true, taxableIncomeMinor: 110_000_000 }, 28_000_000],
  ];
  for (const [jurisdiction, facts, expectedTax] of cases) {
    const result = await calculate(jurisdiction, "2026", facts);
    assert.equal(result.totals.incomeTaxMinor, expectedTax);
  }

  const paraguay = await calculate("PY", "2026", {
    scopeConfirmed: true,
    grossPersonalServiceIncomeMinor: 200_000_000,
    netPersonalServiceIncomeMinor: 200_000_000,
  });
  assert.equal(paraguay.totals.incomeTaxMinor, 18_000_000);

  const seychelles = await calculate("SC", "2026", {
    scopeConfirmed: true,
    employmentTaxSchedule: "citizen",
    monthlyGrossEmolumentsMinor: 8_333_300,
  });
  assert.equal(seychelles.totals.incomeTaxMinor, 1_488_328);
});

test("Uganda applies resident and non-resident schedules", async () => {
  const exempt = await calculate("UG", "2026", {
    scopeConfirmed: true,
    individualTaxSchedule: "resident",
    annualChargeableIncomeMinor: 2_820_000,
  });
  const residentHigh = await calculate("UG", "2026", {
    scopeConfirmed: true,
    individualTaxSchedule: "resident",
    annualChargeableIncomeMinor: 121_000_000,
  });
  const nonResident = await calculate("UG", "2026", {
    scopeConfirmed: true,
    individualTaxSchedule: "non-resident",
    annualChargeableIncomeMinor: 4_920_000,
  });
  assert.equal(exempt.totals.incomeTaxMinor, 0);
  assert.equal(residentHigh.totals.incomeTaxMinor, 35_224_000);
  assert.equal(nonResident.totals.incomeTaxMinor, 582_000);
});

test("Guatemala applies the statutory 5% and 7% employment-income scale", async () => {
  const firstThreshold = await calculate("GT", "2026", {
    scopeConfirmed: true,
    annualTaxableEmploymentIncomeMinor: 30_000_000,
  });
  const aboveThreshold = await calculate("GT", "2026", {
    scopeConfirmed: true,
    annualTaxableEmploymentIncomeMinor: 40_000_000,
  });
  assert.equal(firstThreshold.totals.incomeTaxMinor, 1_500_000);
  assert.equal(aboveThreshold.totals.incomeTaxMinor, 2_200_000);
});

test("Rwanda applies the annual employment-income bands", async () => {
  const cases = [
    [720_000, 0],
    [1_200_000, 48_000],
    [2_400_000, 288_000],
    [3_000_000, 468_000],
  ];
  for (const [taxableEmploymentIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("RW", "2026", {
      scopeConfirmed: true,
      incomePeriod: "annual",
      taxableEmploymentIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
  }
});

test("Rwanda annualizes monthly income and rounds monthly PAYE up", async () => {
  const cases = [
    [60_000, 0],
    [100_000, 4_000],
    [100_001, 4_001],
    [200_000, 24_000],
  ];
  for (const [taxableEmploymentIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("RW", "2026", {
      scopeConfirmed: true,
      incomePeriod: "monthly",
      taxableEmploymentIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.annualizedTaxableEmploymentIncomeMinor, taxableEmploymentIncomeMinor * 12);
  }
});

test("Timor-Leste applies monthly and annual resident and non-resident schedules", async () => {
  const cases = [
    ["monthly-wage", "resident", 50_000, 0],
    ["monthly-wage", "resident", 60_000, 1_000],
    ["monthly-wage", "non-resident", 50_000, 5_000],
    ["annual-taxable-income", "resident", 600_000, 0],
    ["annual-taxable-income", "resident", 700_000, 10_000],
    ["annual-taxable-income", "non-resident", 700_000, 70_000],
  ];

  for (const [incomeSchedule, individualTaxSchedule, taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("TL", "2026", {
      scopeConfirmed: true,
      incomeSchedule,
      individualTaxSchedule,
      taxableIncomeMinor,
    });
    assert.equal(result.totals.taxableIncomeMinor, taxableIncomeMinor);
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("tl.attl.wage-income-tax")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("tl.attl.annual-income-tax-guidelines")));
  }
});

test("Cambodia applies resident monthly salary thresholds", async () => {
  const cases = [
    [150_000_000, 0],
    [200_000_000, 2_500_000],
    [850_000_000, 67_500_000],
    [1_250_000_000, 127_500_000],
    [1_350_000_000, 147_500_000],
  ];

  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("KH", "2026", {
      scopeConfirmed: true,
      taxSchedule: "resident-monthly-salary",
      taxableIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("kh.gdt.monthly-salary-annual-income-bands-2024")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("kh.gdt.tax-on-salary-prakas-2024")));
  }
});

test("Cambodia keeps non-resident salary and resident annual income separate", async () => {
  const nonResident = await calculate("KH", "2026", {
    scopeConfirmed: true,
    taxSchedule: "non-resident-monthly-salary",
    taxableIncomeMinor: 150_000_000,
  });
  assert.equal(nonResident.totals.incomeTaxMinor, 30_000_000);
  assert.deepEqual(nonResident.lines[0].sourceIds, ["kh.gdt.tax-on-salary-prakas-2024"]);

  const annualCases = [
    [1_800_000_000, 0],
    [2_400_000_000, 30_000_000],
    [10_200_000_000, 810_000_000],
    [15_000_000_000, 1_530_000_000],
    [16_000_000_000, 1_730_000_000],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of annualCases) {
    const result = await calculate("KH", "2026", {
      scopeConfirmed: true,
      taxSchedule: "resident-annual-taxable-income",
      taxableIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.length === 1 && sourceIds[0] === "kh.gdt.monthly-salary-annual-income-bands-2024"));
  }
});

test("Andorra applies the standard resident general-income schedule", async () => {
  const cases = [
    [0, 0],
    [2_400_000, 0],
    [3_000_000, 30_000],
    [4_000_000, 80_000],
    [5_000_000, 180_000],
  ];
  for (const [generalNetIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("AD", "2026", {
      scopeConfirmed: true,
      generalNetIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.standardPersonalMinimumMinor, 2_400_000);
    assert.equal(result.totals.generalIncomeBonusCapMinor, 80_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("ad.govern.irpf-effective-rates")));
  }
});

test("Zambia applies the ordinary annual individual schedule", async () => {
  const cases = [
    [0, 0],
    [6_120_000, 0],
    [8_520_000, 480_000],
    [11_040_000, 1_236_000],
    [15_000_000, 2_701_200],
  ];
  for (const [taxableIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("ZM", "2026", {
      scopeConfirmed: true,
      taxableIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.taxFreeThresholdMinor, 6_120_000);
    assert.equal(result.totals.secondThresholdMinor, 8_520_000);
    assert.equal(result.totals.thirdThresholdMinor, 11_040_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("zm.parliament.income-tax-amendment-2023")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("zm.zra.paye-current")));
  }
});

test("Montenegro applies the national monthly personal-earnings schedule", async () => {
  const cases = [
    [0, 0],
    [70_000, 0],
    [100_000, 2_700],
    [150_000, 10_200],
  ];
  for (const [monthlyTaxablePersonalIncomeMinor, expectedTaxMinor] of cases) {
    const result = await calculate("ME", "2026", {
      scopeConfirmed: true,
      monthlyTaxablePersonalIncomeMinor,
    });
    assert.equal(result.totals.incomeTaxMinor, expectedTaxMinor);
    assert.equal(result.totals.exemptThresholdMinor, 70_000);
    assert.equal(result.totals.secondThresholdMinor, 100_000);
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("me.tax-administration.personal-earnings-rates-current")));
    assert.ok(result.lines.every(({ sourceIds }) => sourceIds.includes("me.gov.payroll-calculation-guide-2026")));
  }
});

test("global catalogue and API expose every accepted simple-progressive package", async () => {
  const api = createApi();
  const status = await api.handle({ method: "GET", path: "/v1/pit/status" });
  assert.equal(status.status, 200);
  assert.equal(status.body.jurisdictionCount, 249);
  assert.ok(status.body.counts.implemented >= 51);
  assert.equal(Object.values(status.body.counts).reduce((sum, value) => sum + value, 0), 249);

  const standardYears = EXPECTED_CODES.filter((code) => !["AU", "BW", "AD", "ZM", "ME"].includes(code));
  for (const jurisdiction of standardYears) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${jurisdiction}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.implementationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);
    assert.deepEqual(detail.body.supportedTaxYears, ["2024", "2025", "2026"]);
  }

  const australia = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AU" });
  assert.equal(australia.status, 200);
  assert.deepEqual(australia.body.supportedTaxYears, ["2024-25", "2025-26", "2026-27"]);

  const botswana = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/BW" });
  assert.equal(botswana.status, 200);
  assert.deepEqual(botswana.body.supportedTaxYears, ["2024-25", "2025-26", "2026-27"]);

  const andorra = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AD" });
  assert.equal(andorra.status, 200);
  assert.deepEqual(andorra.body.supportedTaxYears, ["2026"]);

  const zambia = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/ZM" });
  assert.equal(zambia.status, 200);
  assert.deepEqual(zambia.body.supportedTaxYears, ["2026"]);

  const montenegro = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/ME" });
  assert.equal(montenegro.status, 200);
  assert.deepEqual(montenegro.body.supportedTaxYears, ["2026"]);

  const schemaCases = [
    ["UG", "2026", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["GT", "2026", ["scopeConfirmed", "annualTaxableEmploymentIncomeMinor"]],
    ["RW", "2026", ["scopeConfirmed", "incomePeriod", "taxableEmploymentIncomeMinor"]],
    ["AU", "2026-27", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["PH", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["TH", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["FJ", "2026", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["BW", "2026-27", ["scopeConfirmed", "individualTaxSchedule", "annualTaxableIncomeMinor"]],
    ["TL", "2026", ["scopeConfirmed", "incomeSchedule", "individualTaxSchedule", "taxableIncomeMinor"]],
    ["KH", "2026", ["scopeConfirmed", "taxSchedule", "taxableIncomeMinor"]],
    ["AD", "2026", ["scopeConfirmed", "generalNetIncomeMinor"]],
    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["ME", "2026", ["scopeConfirmed", "monthlyTaxablePersonalIncomeMinor"]],
  ];
  for (const [code, year, required] of schemaCases) {
    const schema = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}/${year}/input-schema` });
    assert.equal(schema.status, 200);
    assert.deepEqual(schema.body.factsSchema.required, required);
  }
});

test("simple-progressive packages reject unsupported years and identity fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ZM",
      taxYear: "2025",
      facts: {
        scopeConfirmed: true,
        taxableIncomeMinor: 8_520_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ZM",
      taxYear: "2026",
      facts: {
        scopeConfirmed: true,
        taxableIncomeMinor: 8_520_000,
        name: "Private Person",
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
