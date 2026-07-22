import assert from "node:assert/strict";
import test from "node:test";
import {
  getPitCatalogueStatus,
  getPitJurisdiction,
  listPitJurisdictions,
} from "@taxcraft/catalog";
import { OPENAPI_DOCUMENT, createApi } from "@taxcraft/api";

const api = createApi();
const IMPLEMENTED_CODES = [
  "SG", "GB", "AE", "BH", "BM", "BN", "KY", "MC", "OM", "QA", "SA", "VG", "BS", "KW", "BG", "EE", "HU", "RO", "AM", "GE", "MD", "MK", "UA", "UZ", "NZ", "PY", "CY", "PA", "HN", "DO", "BB", "TT", "SC", "UG", "GT", "RW", "AU", "PH", "TH", "FJ", "BW", "TL", "KH", "AD", "ZM", "KE", "ZA", "MY", "CZ", "ID", "GH", "MU", "LK", "SZ", "JM", "LS", "GY", "LR", "LC", "NA", "KR", "KZ", "TN", "SI", "SK", "AT", "TR", "PE", "CO", "GR", "JO", "JE", "EC", "BR", "MO", "MA", "EG", "DZ", "HK", "IE", "PL", "MT", "PT", "DE", "IM",
];
const VERIFIED_CODES = ["SG", "AE", "SA", "VG", "BS", "KW", "EE", "NZ", "CY", "AM", "UA", "UZ", "PA", "HN", "DO", "BB", "TT", "SC", "UG", "GT", "RW", "AU", "PH", "TH", "FJ", "BW", "TL", "KH", "AD", "ZM", "KE", "ZA", "MY", "CZ", "ID", "GH", "MU", "LK", "SZ", "JM", "LS", "GY", "LR", "LC", "NA", "KR", "KZ", "TN", "SI", "SK", "AT", "TR", "PE", "CO", "GR", "JO", "JE", "EC", "BR", "MO", "MA", "EG", "DZ", "HK", "IE", "PL", "MT", "PT", "DE", "IM"];

test("runtime catalogue exposes all registered PIT jurisdictions", () => {
  const jurisdictions = listPitJurisdictions();
  const status = getPitCatalogueStatus();
  assert.equal(jurisdictions.length, 249);
  assert.equal(status.counts.implemented, 85);
  assert.equal(status.counts["source-indexed"], 80);
  assert.equal(status.counts["source-discovery"], 84);
  for (const code of VERIFIED_CODES) assert.equal(getPitJurisdiction(code).verificationStatus, "verified");
  assert.equal(getPitJurisdiction("AF").verificationStatus, "unmapped");
});

test("global PIT jurisdiction API returns the complete catalogue", async () => {
  const response = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions" });
  assert.equal(response.status, 200);
  assert.equal(response.body.jurisdictions.length, 249);
  assert.equal(response.body.jurisdictions[0].code, "AD");
  for (const code of VERIFIED_CODES) {
    assert.ok(response.body.jurisdictions.some(({ code: entryCode, implementationStatus }) => entryCode === code && implementationStatus === "implemented"));
  }
});

test("jurisdiction detail distinguishes catalogue records from calculators", async () => {
  for (const code of VERIFIED_CODES) {
    const detail = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}` });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.classificationStatus, "implemented");
    assert.equal(detail.body.calculator.available, true);
    assert.equal(detail.body.calculator.pit.contractVersion, "taxcraft.pit-country-package.v1");
  }

  const afghanistan = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AF" });
  assert.equal(afghanistan.status, 200);
  assert.equal(afghanistan.body.classificationStatus, "source-discovery");
  assert.equal(afghanistan.body.calculator.available, false);
});

test("implemented model input schemas are public and unimplemented models fail explicitly", async () => {
  const cases = [
    ["SG", "YA2026", ["taxResident", "chargeableIncomeMinor"]],
    ["AE", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["SA", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["VG", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["BS", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["KW", "2026", ["scopeConfirmed", "coveredIncomeMinor"]],
    ["BG", "2026", ["scopeConfirmed", "taxBaseMinor"]],
    ["NZ", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["UA", "2026", ["scopeConfirmed", "taxBaseMinor"]],
    ["DO", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["SC", "2026", ["scopeConfirmed", "employmentTaxSchedule", "monthlyGrossEmolumentsMinor"]],
    ["UG", "2026", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["GT", "2026", ["scopeConfirmed", "annualTaxableEmploymentIncomeMinor"]],
    ["RW", "2026", ["scopeConfirmed", "incomePeriod", "taxableEmploymentIncomeMinor"]],
    ["FJ", "2026", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["BW", "2026-27", ["scopeConfirmed", "individualTaxSchedule", "annualTaxableIncomeMinor"]],
    ["TL", "2026", ["scopeConfirmed", "incomeSchedule", "individualTaxSchedule", "taxableIncomeMinor"]],
    ["KH", "2026", ["scopeConfirmed", "taxSchedule", "taxableIncomeMinor"]],
    ["AD", "2026", ["scopeConfirmed", "generalNetIncomeMinor"]],
    ["ZM", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["KE", "2026", ["scopeConfirmed", "incomePeriod", "individualTaxSchedule", "taxableEmploymentIncomeMinor"]],
    ["ZA", "2027", ["scopeConfirmed", "rebateSchedule", "taxableIncomeMinor"]],
    ["AU", "2026-27", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["PH", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["TH", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["MY", "2025", ["scopeConfirmed", "individualRebateSchedule", "chargeableIncomeMinor"]],
    ["CZ", "2026", ["scopeConfirmed", "basicTaxpayerCreditSchedule", "reducedTaxBaseMinor"]],
    ["ID", "2026", ["scopeConfirmed", "nonTaxableIncomeSchedule", "annualNetIncomeMinor"]],
    ["GH", "2026", ["scopeConfirmed", "incomePeriod", "individualTaxSchedule", "chargeableIncomeMinor"]],
    ["MU", "2026-27", ["scopeConfirmed", "chargeableIncomeMinor", "fairShareThresholdIncomeMinor", "fairShareLeviableIncomeMinor"]],
    ["LK", "2026-27", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["SZ", "2025-26", ["scopeConfirmed", "rebateSchedule", "taxableIncomeMinor"]],
    ["JM", "2026", ["scopeConfirmed", "exemptionSchedule", "aggregateIncomeMinor"]],
    ["LS", "2026-27", ["scopeConfirmed", "individualTaxSchedule", "annualChargeableIncomeMinor"]],
    ["GY", "2026", ["scopeConfirmed", "annualChargeableIncomeMinor"]],
    ["LR", "2026", ["scopeConfirmed", "annualGrossTaxableIncomeMinor"]],
    ["LC", "2026", ["scopeConfirmed", "annualChargeableIncomeMinor"]],
    ["NA", "2027", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["KR", "2026", ["scopeConfirmed", "standardLocalRateConfirmed", "globalIncomeTaxBaseMinor"]],
    ["KZ", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["TN", "2026", ["scopeConfirmed", "netTaxableIncomeMinor"]],
    ["SI", "2026", ["scopeConfirmed", "netAnnualTaxBaseMinor"]],
    ["SK", "2026", ["scopeConfirmed", "taxBaseMinor"]],
    ["AT", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["TR", "2026", ["scopeConfirmed", "incomeSchedule", "taxableIncomeMinor"]],
    ["PE", "2026", ["scopeConfirmed", "netTaxableWorkIncomeMinor"]],
    ["CO", "2026", ["scopeConfirmed", "taxableBaseUvtTenThousandths"]],
    ["GR", "2026", ["scopeConfirmed", "incomeSchedule", "ageSchedule", "dependentChildrenCount", "taxableIncomeMinor"]],
    ["JO", "2026", ["scopeConfirmed", "taxableIncomeMinor"]],
    ["JE", "2026", ["scopeConfirmed", "liableIncomeAfterDeductionsPounds", "totalExemptionThresholdPounds"]],
    ["EC", "2025", ["scopeConfirmed", "taxableBaseMinor"]],
    ["BR", "2025", ["scopeConfirmed", "annualTaxBaseMinor"]],
    ["MO", "2026", ["scopeConfirmed", "annualProfessionalIncomeMinor"]],
    ["MA", "2026", ["scopeConfirmed", "netTaxableIncomeMinor"]],
    ["EG", "2026", ["scopeConfirmed", "netTaxableIncomeMinor"]],
    ["DZ", "2026", ["scopeConfirmed", "annualTaxableIncomeMinor"]],
    ["HK", "2025-26", ["scopeConfirmed", "netIncomeMinor", "netChargeableIncomeMinor"]],
    ["IE", "2026", ["scopeConfirmed", "filingSchedule", "primaryTaxableIncomeMinor", "secondaryTaxableIncomeMinor", "lowerEarnerBandIncomeMinor", "primaryPayeIncomeMinor", "secondaryPayeIncomeMinor", "primaryUscIncomeMinor", "secondaryUscIncomeMinor"]],
    ["PL", "2026", ["scopeConfirmed", "filingSchedule", "primaryTaxableIncomeMinor", "secondaryTaxableIncomeMinor"]],
    ["MT", "2026", ["scopeConfirmed", "filingSchedule", "chargeableIncomeMinor"]],
    ["PT", "2026", ["scopeConfirmed", "filingSchedule", "taxableIncomeMinor"]],
    ["DE", "2026", ["scopeConfirmed", "filingSchedule", "taxableIncomeMinor"]],
    ["IM", "2026-27", ["scopeConfirmed", "filingSchedule", "assessableIncomePounds", "totalIncomeForAllowanceTaperPounds", "additionalAllowancesPounds"]],
  ];
  for (const [code, year, required] of cases) {
    const schema = await api.handle({ method: "GET", path: `/v1/pit/jurisdictions/${code}/${year}/input-schema` });
    assert.equal(schema.status, 200);
    assert.equal(schema.body.factsSchema.additionalProperties, false);
    assert.deepEqual(schema.body.factsSchema.required, required);
  }

  const unavailable = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/AF/2026/coverage" });
  assert.equal(unavailable.status, 409);
  assert.equal(unavailable.body.status, "not_implemented");
  assert.equal(unavailable.body.jurisdiction, "AF");
});

test("PIT calculation route remains equivalent to the compatibility route", async () => {
  const request = {
    jurisdiction: "SG",
    taxYear: "YA2026",
    facts: { taxResident: true, chargeableIncomeMinor: 100_000_00 },
  };
  const legacy = await api.handle({ method: "POST", path: "/v1/calculate", body: request });
  const pit = await api.handle({ method: "POST", path: "/v1/pit/calculate", body: request });
  assert.deepEqual(pit, legacy);
});

test("legacy jurisdiction discovery remains limited to implemented packages", async () => {
  const response = await api.handle({ method: "GET", path: "/v1/jurisdictions" });
  assert.equal(response.status, 200);
  assert.equal(response.body.jurisdictions.length, IMPLEMENTED_CODES.length);
  assert.deepEqual(response.body.jurisdictions.map(({ jurisdiction }) => jurisdiction), IMPLEMENTED_CODES);
});

test("OpenAPI publishes the global PIT catalogue surfaces", () => {
  for (const path of [
    "/v1/pit/status",
    "/v1/pit/calculation-families",
    "/v1/pit/jurisdictions",
    "/v1/pit/jurisdictions/{code}",
    "/v1/pit/jurisdictions/{code}/{taxYear}/input-schema",
    "/v1/pit/calculate",
  ]) {
    assert.ok(OPENAPI_DOCUMENT.paths[path], `${path} is missing from OpenAPI`);
  }
});
