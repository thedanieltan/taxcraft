import { irelandPackage } from "./base.js";
import { polandPackage } from "./poland.js";
import { maltaPackage } from "./malta.js";

export { irelandPackage, polandPackage, maltaPackage };

export const householdFilingPackages = Object.freeze([
  irelandPackage,
  polandPackage,
  maltaPackage,
]);

export const householdFilingPackagesByJurisdiction = Object.freeze({
  IE: irelandPackage,
  PL: polandPackage,
  MT: maltaPackage,
});
