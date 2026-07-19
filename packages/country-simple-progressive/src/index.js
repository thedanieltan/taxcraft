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
import {
  SIMPLE_PROGRESSIVE_WAVE_7_JURISDICTIONS,
  simpleProgressiveWave7Packages,
} from "./wave7.js";
import {
  SIMPLE_PROGRESSIVE_WAVE_8_JURISDICTIONS,
  simpleProgressiveWave8Packages,
} from "./wave8.js";
import {
  SIMPLE_PROGRESSIVE_WAVE_9_JURISDICTIONS,
  simpleProgressiveWave9Packages,
} from "./wave9.js";

export const SIMPLE_PROGRESSIVE_JURISDICTIONS = Object.freeze([
  ...acceptedDefinitions,
  ...SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_4_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_5_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_6_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_7_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_8_JURISDICTIONS,
  ...SIMPLE_PROGRESSIVE_WAVE_9_JURISDICTIONS,
]);

export const simpleProgressivePackages = Object.freeze([
  ...acceptedPackages,
  ...simpleProgressiveWave3Packages,
  ...simpleProgressiveWave4Packages,
  ...simpleProgressiveWave5Packages,
  ...simpleProgressiveWave6Packages,
  ...simpleProgressiveWave7Packages,
  ...simpleProgressiveWave8Packages,
  ...simpleProgressiveWave9Packages,
]);

export const simpleProgressivePackagesByJurisdiction = Object.freeze(Object.fromEntries(
  simpleProgressivePackages.map((countryPackage) => [
    countryPackage.manifest.jurisdiction,
    countryPackage,
  ]),
));
