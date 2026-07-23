import { switzerlandPackage } from "./index.js";
import { belgiumPackage } from "./belgium.js";
import { denmarkPackage } from "./denmark.js";

export const regionalMunicipalPackages = Object.freeze([
  switzerlandPackage,
  belgiumPackage,
  denmarkPackage,
]);

export const regionalMunicipalPackagesByJurisdiction = Object.freeze({
  CH: switzerlandPackage,
  BE: belgiumPackage,
  DK: denmarkPackage,
});

export {
  switzerlandPackage,
  belgiumPackage,
  denmarkPackage,
};
