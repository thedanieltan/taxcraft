import {
  SIMPLE_PROGRESSIVE_JURISDICTIONS as acceptedDefinitions,
  simpleProgressivePackages as acceptedPackages,
} from "./base.js";
import {
  SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS,
  simpleProgressiveWave3Packages,
} from "./wave3.js";

export const SIMPLE_PROGRESSIVE_JURISDICTIONS = Object.freeze([
  ...acceptedDefinitions,
  ...SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS,
]);

export const simpleProgressivePackages = Object.freeze([
  ...acceptedPackages,
  ...simpleProgressiveWave3Packages,
]);

export const simpleProgressivePackagesByJurisdiction = Object.freeze(Object.fromEntries(
  simpleProgressivePackages.map((countryPackage) => [
    countryPackage.manifest.jurisdiction,
    countryPackage,
  ]),
));

export { SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS, simpleProgressiveWave3Packages };
