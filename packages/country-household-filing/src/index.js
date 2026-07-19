import { irelandPackage } from "./base.js";
import { polandPackage } from "./poland.js";

export { irelandPackage, polandPackage };

export const householdFilingPackages = Object.freeze([
  irelandPackage,
  polandPackage,
]);

export const householdFilingPackagesByJurisdiction = Object.freeze({
  IE: irelandPackage,
  PL: polandPackage,
});
