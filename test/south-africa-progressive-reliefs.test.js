import assert from "node:assert/strict";
import test from "node:test";
import { createApi } from "@taxcraft/api";
import { createTaxCraft } from "@taxcraft/core";
import { southAfricaPackage } from "@taxcraft/country-progressive-reliefs";

const engine = createTaxCraft({ countryPackages: [southAfricaPackage] });

async function calculate(taxYear, rebateSchedule, taxableIncomeMinor) {
  const result = await engine.calculate({
    jurisdiction: "ZA",
    taxYear,
    facts: { scopeConfirmed: true, rebateSchedule, taxableIncomeMinor },
  });
  assert.equal(result.status, "ok");
  return result;
}

test("South Africa maintains tax years 2025 through 2027", () => {
  assert.deepEqual(
    southAfricaPackage.manifest.taxYears.map(({ taxYear }) => taxYear),
    ["2025", "2026", "2027"],
  );
  assert.equal(southAfricaPackage.manifest.taxYears.at(-1).status, "current");
  assert.equal(southAfricaPackage.manifest.storesUserPII, false);
  assert.equal(southAfricaPackage.manifest.pit.factsSchema.additionalProperties, false);
});

test("South Africa applies the unchanged 2025 and 2026 tables", async () => {
  for (const taxYear of ["2025", "2026"]) {
    const primaryThreshold = await calculate(taxYear, "primary", 9_575_000);
    assert.equal(primaryThreshold.totals.grossIncomeTaxMinor, 1_723_500);
    assert.equal(primaryThreshold.totals.rebateAppliedMinor, 1_723_500);
    assert.equal(primaryThreshold.totals.incomeTaxMinor, 0);

    const aboveThreshold = await calculate(taxYear, "primary", 10_000_000);
    assert.equal(aboveThreshold.totals.grossIncomeTaxMinor, 1_800_000);
    assert.equal(aboveThreshold.totals.incomeTaxMinor, 76_500);
  }
});

test("South Africa applies cumulative primary, secondary and tertiary rebates", async () => {
  const primary = await calculate("2026", "primary", 17_000_000);
  const secondary = await calculate("2026", "primary-secondary", 17_000_000);
  const tertiary = await calculate("2026", "primary-secondary-tertiary", 17_000_000);

  assert.equal(primary.totals.availableRebateMinor, 1_723_500);
  assert.equal(primary.totals.incomeTaxMinor, 1_336_500);
  assert.equal(secondary.totals.availableRebateMinor, 2_667_900);
  assert.equal(secondary.totals.incomeTaxMinor, 392_100);
  assert.equal(tertiary.totals.availableRebateMinor, 2_982_400);
  assert.equal(tertiary.totals.incomeTaxMinor, 77_600);
});

test("South Africa applies the inflation-adjusted 2027 bands and rebates", async () => {
  const primaryThreshold = await calculate("2027", "primary", 9_900_000);
  const secondaryThreshold = await calculate("2027", "primary-secondary", 15_325_000);
  const tertiaryThreshold = await calculate("2027", "primary-secondary-tertiary", 17_130_000);

  assert.equal(primaryThreshold.totals.incomeTaxMinor, 0);
  assert.equal(secondaryThreshold.totals.incomeTaxMinor, 0);
  assert.equal(tertiaryThreshold.totals.incomeTaxMinor, 0);

  const upperBand = await calculate("2027", "primary", 200_000_000);
  assert.equal(upperBand.totals.grossIncomeTaxMinor, 72_096_900);
  assert.equal(upperBand.totals.rebateAppliedMinor, 1_782_000);
  assert.equal(upperBand.totals.incomeTaxMinor, 70_314_900);
});

test("South Africa is exposed through the global API", async () => {
  const api = createApi();
  const detail = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/ZA" });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.classificationStatus, "implemented");
  assert.equal(detail.body.calculationFamily, "PROGRESSIVE_RELIEFS");
  assert.deepEqual(detail.body.supportedTaxYears, ["2025", "2026", "2027"]);
  assert.equal(detail.body.calculator.available, true);

  const schema = await api.handle({ method: "GET", path: "/v1/pit/jurisdictions/ZA/2027/input-schema" });
  assert.equal(schema.status, 200);
  assert.deepEqual(schema.body.factsSchema.required, [
    "scopeConfirmed",
    "rebateSchedule",
    "taxableIncomeMinor",
  ]);

  const calculation = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ZA",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        rebateSchedule: "primary",
        taxableIncomeMinor: 200_000_000,
      },
    },
  });
  assert.equal(calculation.status, 200);
  assert.equal(calculation.body.totals.incomeTaxMinor, 70_314_900);
  assert.ok(calculation.body.sources.some(({ sourceId }) => sourceId === "za.sars.individual-tax-rates"));
});

test("South Africa rejects unsupported years and identity-bearing fields", async () => {
  const api = createApi();
  const unsupported = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ZA",
      taxYear: "2024",
      facts: {
        scopeConfirmed: true,
        rebateSchedule: "primary",
        taxableIncomeMinor: 10_000_000,
      },
    },
  });
  assert.equal(unsupported.status, 422);
  assert.equal(unsupported.body.reasonCode, "tax-year-not-supported");

  const privateFact = await api.handle({
    method: "POST",
    path: "/v1/pit/calculate",
    body: {
      jurisdiction: "ZA",
      taxYear: "2027",
      facts: {
        scopeConfirmed: true,
        rebateSchedule: "primary",
        taxableIncomeMinor: 10_000_000,
        age: 40,
      },
    },
  });
  assert.equal(privateFact.status, 400);
  assert.ok(privateFact.body.issues.some(({ code }) => code === "facts.pii-field"));
});
