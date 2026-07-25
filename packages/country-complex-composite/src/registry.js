import {
  hongKongPackage,
  unitedStatesPackage,
} from "./index.js";
import { norwayPackage } from "./norway.js";

export const complexCompositePackages = Object.freeze([
  hongKongPackage,
  unitedStatesPackage,
  norwayPackage,
]);

export const complexCompositePackagesByJurisdiction = Object.freeze({
  HK: hongKongPackage,
  US: unitedStatesPackage,
  NO: norwayPackage,
});

export {
  hongKongPackage,
  unitedStatesPackage,
  norwayPackage,
};
