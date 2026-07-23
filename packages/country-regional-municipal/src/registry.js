import { switzerlandPackage } from "./index.js";
import { belgiumPackage } from "./belgium.js";

export const regionalMunicipalPackages = Object.freeze([
  switzerlandPackage,
  belgiumPackage,
]);

export const regionalMunicipalPackagesByJurisdiction = Object.freeze({
  CH: switzerlandPackage,
  BE: belgiumPackage,
});

export {
  switzerlandPackage,
  belgiumPackage,
};
