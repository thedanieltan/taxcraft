import {
  hongKongPackage,
  unitedStatesPackage,
} from "./index.js";
import { norwayPackage } from "./norway.js";
import {
  indiaPackage,
  canadaPackage,
  japanPackage,
  spainPackage,
  italyPackage,
} from "./priority-markets-v2.js";

export const complexCompositePackages = Object.freeze([
  hongKongPackage,
  unitedStatesPackage,
  norwayPackage,
  indiaPackage,
  canadaPackage,
  japanPackage,
  spainPackage,
  italyPackage,
]);

export const complexCompositePackagesByJurisdiction = Object.freeze({
  HK: hongKongPackage,
  US: unitedStatesPackage,
  NO: norwayPackage,
  IN: indiaPackage,
  CA: canadaPackage,
  JP: japanPackage,
  ES: spainPackage,
  IT: italyPackage,
});

export {
  hongKongPackage,
  unitedStatesPackage,
  norwayPackage,
  indiaPackage,
  canadaPackage,
  japanPackage,
  spainPackage,
  italyPackage,
};
