import assert from "node:assert/strict";
import test from "node:test";
import {
  householdFilingPackages,
  householdFilingPackagesByJurisdiction,
} from "@taxcraft/country-household-filing";

test("household-filing bundle retains every maintained package", () => {
  assert.deepEqual(
    householdFilingPackages.map(({ manifest }) => manifest.jurisdiction),
    ["IE", "PL", "MT", "PT", "DE", "IM", "FR"],
  );
  assert.equal(householdFilingPackagesByJurisdiction.IE.manifest.jurisdiction, "IE");
  assert.equal(householdFilingPackagesByJurisdiction.PL.manifest.jurisdiction, "PL");
  assert.equal(householdFilingPackagesByJurisdiction.MT.manifest.jurisdiction, "MT");
  assert.equal(householdFilingPackagesByJurisdiction.PT.manifest.jurisdiction, "PT");
  assert.equal(householdFilingPackagesByJurisdiction.DE.manifest.jurisdiction, "DE");
  assert.equal(householdFilingPackagesByJurisdiction.IM.manifest.jurisdiction, "IM");
  assert.equal(householdFilingPackagesByJurisdiction.FR.manifest.jurisdiction, "FR");
  assert.ok(householdFilingPackages.every(({ manifest }) => manifest.storesUserPII === false));
});
