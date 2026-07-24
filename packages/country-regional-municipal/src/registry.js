import { switzerlandPackage } from "./index.js";
import { belgiumPackage } from "./belgium.js";
import { denmarkPackage } from "./denmark.js";
import { finlandPackage } from "./finland.js";

export const regionalMunicipalPackages = Object.freeze([
  switzerlandPackage,
  belgiumPackage,
  denmarkPackage,
  finlandPackage,
]);

export const regionalMunicipalPackagesByJurisdiction = Object.freeze({
  CH: switzerlandPackage,
  BE: belgiumPackage,
  DK: denmarkPackage,
  FI: finlandPackage,
});

export {
  switzerlandPackage,
  belgiumPackage,
  denmarkPackage,
  finlandPackage,
};
