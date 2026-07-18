import {
  SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS as initialDefinitions,
  simpleProgressiveWave3Packages as initialPackages,
} from "./wave3-base.js";
import { SEYCHELLES_DEFINITION, seychellesPackage } from "./seychelles.js";

export const SIMPLE_PROGRESSIVE_WAVE_3_JURISDICTIONS = Object.freeze([
  ...initialDefinitions.filter(({ code }) => code !== "SC"),
  SEYCHELLES_DEFINITION,
]);

export const simpleProgressiveWave3Packages = Object.freeze([
  ...initialPackages.filter(({ manifest }) => manifest.jurisdiction !== "SC"),
  seychellesPackage,
]);
