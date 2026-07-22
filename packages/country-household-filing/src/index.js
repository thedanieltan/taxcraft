import { irelandPackage } from "./base.js";
import { polandPackage } from "./poland.js";
import { maltaPackage } from "./malta.js";
import { portugalPackage } from "./portugal.js";
import { germanyPackage } from "./germany.js";

export { irelandPackage, polandPackage, maltaPackage, portugalPackage, germanyPackage };

export const householdFilingPackages = Object.freeze([
  irelandPackage,
  polandPackage,
  maltaPackage,
  portugalPackage,
  germanyPackage,
]);

export const householdFilingPackagesByJurisdiction = Object.freeze({
  IE: irelandPackage,
  PL: polandPackage,
  MT: maltaPackage,
  PT: portugalPackage,
  DE: germanyPackage,
});
