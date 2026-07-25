import { switzerlandPackage } from "./index.js";
import { belgiumPackage } from "./belgium.js";
import { denmarkPackage } from "./denmark.js";
import { finlandPackage } from "./finland.js";
import { swedenPackage } from "./sweden.js";

export const regionalMunicipalPackages = Object.freeze([
  switzerlandPackage,
  belgiumPackage,
  denmarkPackage,
  finlandPackage,
  swedenPackage,
]);

export const regionalMunicipalPackagesByJurisdiction = Object.freeze({
  CH: switzerlandPackage,
  BE: belgiumPackage,
  DK: denmarkPackage,
  FI: finlandPackage,
  SE: swedenPackage,
});

export {
  switzerlandPackage,
  belgiumPackage,
  denmarkPackage,
  finlandPackage,
  swedenPackage,
};
