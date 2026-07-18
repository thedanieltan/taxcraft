import {
  SIMPLE_PROGRESSIVE_JURISDICTIONS as acceptedDefinitions,
  simpleProgressivePackages as acceptedPackages,
} from "./base.js";
import {
  SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS,
  simpleProgressiveWave3Packages,
} from "./wave3.js";
import {
  SIMPLE_PROGRESSIVE_WAVE_4_JURISDICTIONS,
  simpleProgressiveWave4Packages,
} from "./wave4.js";
import {
  SIMPLE_PROGRESSIVE_WAVE_5_JURISDICTIONS,
  simpleProgressiveWave5Packages,
} from "./wave5.js";
import {
  SIMPLE_PROGRESSIVE_WAVE_6_JURISDICTIONS,
  simpleProgressiveWave6Packages,
} from "./wave6.js";

export const SIMPLE_PROGRESSIVE_JURISDICTIONS = Object.freeze([
  ...acceptedDefinitions,
  ...SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_4_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_5_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_6_JURISDICTIONS,
]);

export const simpleProgressivePackages = Object.freeze([
  ...acceptedPackages,
  ...simpleProgressiveWave3Packages,
  ...simpleProgressiveWave4Packages,
  ...simpleProgressiveWave5Packages,
  ...simpleProgressiveWave6Packages,
]);

export const simpleProgressivePackagesByJurisdiction = Object.freeze(Object.fromEntries(
  simpleProgressivePackages.map((countryPackage) => [
    countryPackage.manifest.jurisdiction,
    countryPackage,
  ]),
));
