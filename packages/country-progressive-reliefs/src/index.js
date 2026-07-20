import {
  progressiveReliefPackages as acceptedPackages,
  progressiveReliefPackagesByJurisdiction as acceptedPackagesByJurisdiction,
} from "./base.js";
import { southAfricaPackage } from "./south-africa.js";
import { malaysiaPackage } from "./malaysia.js";
import { czechRepublicPackage } from "./czech-republic.js";
import { indonesiaPackage } from "./indonesia.js";
import { ghanaPackage } from "./ghana.js";

export const progressiveReliefPackages = Object.freeze([
  ...acceptedPackages,
  southAfricaPackage,
  malaysiaPackage,
  czechRepublicPackage,
  indonesiaPackage,
  ghanaPackage,
]);

export const progressiveReliefPackagesByJurisdiction = Object.freeze({
  ...acceptedPackagesByJurisdiction,
  ZA: southAfricaPackage,
  MY: malaysiaPackage,
  CZ: czechRepublicPackage,
  ID: indonesiaPackage,
  GH: ghanaPackage,
});

export { southAfricaPackage, malaysiaPackage, czechRepublicPackage, indonesiaPackage, ghanaPackage };
