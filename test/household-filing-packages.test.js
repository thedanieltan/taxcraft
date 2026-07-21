import assert from "node:assert/strict";
import test from "node:test";
import {
  householdFilingPackages,
  householdFilingPackagesByJurisdiction,
} from "@taxcraft/country-household-filing";

test("household-filing bundle retains every maintained package", () => {
  assert.deepEqual(
    householdFilingPackages.map(({ manifest }) => manifest.jurisdiction),
    ["IE", "PL", "MT"],
  );
  assert.equal(householdFilingPackagesByJurisdiction.IE.manifest.jurisdiction, "IE");
  assert.equal(householdFilingPackagesByJurisdiction.PL.manifest.jurisdiction, "PL");
  assert.equal(householdFilingPackagesByJurisdiction.MT.manifest.jurisdiction, "MT");
  assert.ok(householdFilingPackages.every(({ manifest }) => manifest.storesUserPII === false));
});
